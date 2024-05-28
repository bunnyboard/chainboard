import { MongoCollectionConfig } from '../services/database/domains';

export const ChainFamilies = {
  evm: 'evm',
  solana: 'solana',
};
const AllChainFamilies = Object.values(ChainFamilies);
export type ChainFamily = (typeof AllChainFamilies)[number];

export interface Blockchain {
  // ex: ethereum
  name: string;

  chainId: number;

  // default: evm, more coming soon
  family: ChainFamily;

  // the chain support EIP-1559
  // https://consensys.io/blog/what-is-eip-1559-how-will-it-change-ethereum
  eip1559?: boolean;

  // start collect data from block number
  startBlock: number;

  // the native coin
  nativeCoin: {
    symbol: string;
    decimals: number;
  };

  // list of node rpcs
  nodeRpcs: Array<string>;
}

export interface DatabaseCollectionConfig {
  cachingStates: MongoCollectionConfig;

  rawdataBlockData: MongoCollectionConfig;
  chainDataStates: MongoCollectionConfig;
  chainDataSnapshots: MongoCollectionConfig;
}

export interface EnvConfig {
  mongodb: {
    databaseName: string;
    connectionUri: string;
    collections: DatabaseCollectionConfig;
  };

  // we pre-define supported blockchains here
  blockchains: {
    [key: string]: Blockchain;
  };
}
