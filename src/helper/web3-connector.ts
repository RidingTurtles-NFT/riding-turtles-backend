import log from 'loglevel';
import Web3 from 'web3';
import { Contract } from "web3-eth-contract";
import { ridingTurtleContractAbi } from "../web3/riding-turtle-contract-abi";

const authHeader = {
  Authorization: `Basic ${Buffer.from(":"+process.env.INFURA_WEB3_SECRET).toString('base64')}`,
};

let contract: Contract | null = null;

function getContractSingleton() {
  if (!contract) {
    log.info('set up web3 provider and contract instance');

    const web3WssProvider = new Web3.providers.WebsocketProvider(
      process.env.INFURA_WEB3_WSS_URL,{ headers: authHeader }
    );

    const web3 = new Web3(web3WssProvider);

    contract = new web3.eth.Contract(
      // @ts-ignore
      ridingTurtleContractAbi,
      process.env.WEB3_SMART_CONTRACT_ADDRESS
    );
  }
  return contract;
}

export async function getTokenTraits(tokenId: number): Promise<number[]> {
  const ridingTurtlesContract = getContractSingleton();

  const traits: string[] = await ridingTurtlesContract.methods.getTraits(tokenId).call();

  log.info(`received token traits for token id ${tokenId}`, traits);

  return traits.map(trait => (parseInt(trait)));
}

export function setupMintEventListener(callback: any): void {
  log.info('set up "MFftMinted" event listener');

  const ridingTurtlesContract = getContractSingleton();

  ridingTurtlesContract.events.NftMinted({}, (err, event) => {
    if(err) {
      log.error(`error while catching "MFftMinted" event for token id ${event.returnValues.tokenId}`, err);
    } else {
      log.info(`caught "MFftMinted" event for token id ${event.returnValues.tokenId}`);
    }
    callback(err, event);
  });
}

export async function getNftMintEventsFromBlock(blockHeight: number): Promise<any> {
  const ridingTurtlesContract = getContractSingleton();

  const pastEvents = await ridingTurtlesContract.getPastEvents(
    'NftMinted',
    { fromBlock: blockHeight }
  ).catch(err => {
    log.error(`error while catching "MFftMinted" events starting from block height ${blockHeight}`, err);
    throw err;
  });

  log.info(`caught "MFftMinted" events starting from block height ${blockHeight}`);

  return pastEvents;
}

export async function getHighestTokenId(): Promise<number> {
  const ridingTurtlesContract = getContractSingleton();
  const [minted, ownerMinted] = await ridingTurtlesContract.methods.stats().call();
  return Number(minted) + Number(ownerMinted) - 1;
}
