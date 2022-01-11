require('dotenv').config();

import log from "loglevel";
import Bottleneck from "bottleneck";
import { addStateTableEntry, getAllStateTableEntries } from "./helper/aws-dynamodb";
import { getTokenTraits, getHighestTokenId, getBlockNumber, getPastMintedEvents } from "./helper/web3-connector";
import { getTraitImages } from "./helper/image-loader";
import { composeImages } from "./helper/sharp";
import { uploadImageToIpfs } from "./helper/infura-ipfs";
import { createMetaData } from "./helper/metadata-creator";
import { uploadMetaDataToBucket } from "./helper/aws-s3";

log.setDefaultLevel('info');
let handleMintEventLimited;
let lastBlockSeen;

async function main() {
  setupLimiter();
  lastBlockSeen = await getBlockNumber();
  processMissedMintEvents()
      .catch(e => {
        log.error(`missing events processing error:`, e);
      });
  await mintedEventsLoop();
}

async function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s * 1000));
}

async function mintedEventsLoop() {
  while (true) {
    try {
      await sleep(30);
      const latestBlock = await getBlockNumber(); // get latest block number
      const pastMintedEvents = await getPastMintedEvents(lastBlockSeen + 1, latestBlock);
      pastMintedEvents.forEach((ev) => {
        scheduleMintEventHandling(undefined, ev); // intentionally called without handling promise as never rejected and non-blocking required
      });
      lastBlockSeen = latestBlock;
    } catch (err) {
      log.error(`error in events loop:`, err);
    }
  }
}

async function scheduleMintEventHandling(err: any, event: any) {
  try {
    await handleMintEventLimited(err, event);
  } catch (e) {
    log.error('error during processing of minting event:', event.returnValues, e);
  }
}

function setupLimiter() {
  let maxReqsPerMin = parseInt(process.env.LIMITER_MAX_REQUESTS_PROCESSED_PER_MIN || '') || 60; // default 60
  const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: (60 * 1000) / maxReqsPerMin
  });
  log.info(`limiter settings: ${maxReqsPerMin} requests per min, 1 max concurrent processes`);
  handleMintEventLimited = limiter.wrap(handleMintEvent);
  limiter.on('failed', async (error, jobInfo) => {
    const id = jobInfo.options.id;
    log.warn(`job ${id} failed: ${error}`);
    if (jobInfo.retryCount <= 1) { // retry twice at most
      log.info(`retrying job ${id} in 1s!`);
      return 1000;
    }
  });
  limiter.on('retry', (error, jobInfo) => log.info(`now retrying ${jobInfo.options.id}`));
}

async function processMissedMintEvents(): Promise<void> {
  log.info(`missing events: starting rollup`);
  const highestTokenId = await getHighestTokenId();
  if (highestTokenId < 0) {
    log.info(`missing events: no tokens minted yet`);
    return;
  }
  const allStateTableEntriesAsc = (await getAllStateTableEntries())
      .sort((a, b) => a.tokenId - b.tokenId);

  let lastFinishedIndexWithoutGap = -1;
  for (let i = 0; i < allStateTableEntriesAsc.length; i++) {
    if (allStateTableEntriesAsc[i].tokenId === i) {
      // check if the token ids are in order without gaps
      lastFinishedIndexWithoutGap = i;
    } else {
      // if there is a missing tokenId (=gap), leave loop
      break;
    }
  }

  let startFromBlock;
  if (lastFinishedIndexWithoutGap <= -1) {
    // we've not processed any events yet
    startFromBlock = 23586065; // this is the block before the first mints were done
  } else if (highestTokenId > allStateTableEntriesAsc[lastFinishedIndexWithoutGap].tokenId) {
    // we've processed some events already but are not up to date with the chain
    startFromBlock = allStateTableEntriesAsc[lastFinishedIndexWithoutGap].blockHeight
  } else {
    // return because up to date
    log.info(`missing events: no missing events`);
    return;
  }

  // if we are here, we've missed at least some minted events
  // roll up all minted events starting from block where the gap occurred
  log.info(`missing events: found a gap, rolling up beginning with block ${startFromBlock}`);
  let missedEventsCount = 0;
  const pastEvents = await getPastMintedEvents(startFromBlock, 'latest');
  for (const pastEvent of pastEvents) {
    const tokenId = parseInt(pastEvent.returnValues.tokenId);
    const alreadyProcessed = allStateTableEntriesAsc.some(ele => ele.tokenId === tokenId);
    if (!alreadyProcessed) {
      missedEventsCount ++;
      try {
        await handleMintEventLimited(undefined, pastEvent);
      } catch (e) {
        log.error('error during processing of minting event rollup:', pastEvent.returnValues, e);
      }
    }
  }
  log.info(`missing events: finished rolling up ${missedEventsCount} missed events`);
}

async function handleMintEvent(err: any, event: any): Promise<void> {
  if (err) {
    // error of on-chain minted event
    return;
  }
  const tokenId = parseInt(event.returnValues.tokenId);
  const traits = await getTokenTraits(tokenId);

  const specialNFT = traits[traits.length - 1] > 0;
  const alreadyFusedNFT = traits[0] === 0;

  // images and metadata for special NFTs (special != 0) will be manually created and uploaded
  // already fused NFTs will be skipped
  if (!specialNFT && !alreadyFusedNFT) {
    await createAndUploadImageAndMetaData(tokenId, traits);
  }

  await addStateTableEntry({
    tokenId,
    blockHeight: event.blockNumber,
    date: new Date().toISOString(),
  });
}

async function createAndUploadImageAndMetaData(tokenId: number, traits: number[]): Promise<void> {
  const traitImages = await getTraitImages(traits);

  const finalImage = await composeImages(traitImages);

  const imageCid = await uploadImageToIpfs(finalImage);

  const metaData = createMetaData(tokenId, traits, imageCid);

  await uploadMetaDataToBucket(tokenId, metaData);
}

main()
    .then(() => {
      console.log("exited cleanly");
    })
    .catch(err => {
      console.error(err);
    });
