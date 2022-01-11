import log from 'loglevel';
import Web3 from 'web3';
import { Contract } from "web3-eth-contract";
import { ridingTurtleContractAbi } from "../web3/riding-turtle-contract-abi";

// TODO: this probably doesn't work with HttpProvider, see https://stackoverflow.com/questions/56046443/how-to-connect-to-a-protected-infura-project-with-web3 for help
const authHeader = [
  {name: 'Authorization', value: `Basic ${Buffer.from(":"+process.env.INFURA_WEB3_SECRET).toString('base64')}`}
];

let contract: Contract | null = null;
let web3: Web3 | null = null;
let lastBlockSeen = -1;

function getWeb3Singleton() {
  if (!web3) {
    log.info('set up web3 provider');

    const web3Provider = new Web3.providers.HttpProvider(
        process.env.INFURA_WEB3_URL,{ headers: authHeader }
    );

    web3 = new Web3(web3Provider);
  }
  return web3;
}

function getContractSingleton() {
  if (!contract) {
    log.info('set up contract instance');
    const w3 = getWeb3Singleton();

    contract = new w3.eth.Contract(
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

export async function getPastMintedEvents(startBlock: number, endBlock: number | 'latest'): Promise<any[]> {
  const ridingTurtlesContract = getContractSingleton();
  return ridingTurtlesContract.getPastEvents("NftMinted", {
    fromBlock: startBlock,
    toBlock: endBlock
  });
}

export async function getBlockNumber(): Promise<number> {
  const w3 = getWeb3Singleton();
  return w3.eth.getBlockNumber();
}

export async function getHighestTokenId(): Promise<number> {
  const ridingTurtlesContract = getContractSingleton();
  const [minted, ownerMinted] = await ridingTurtlesContract.methods.stats().call();
  return Number(minted) + Number(ownerMinted) - 1;
}
