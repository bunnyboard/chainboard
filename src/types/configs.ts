import { MongoCollectionConfig } from '../services/database/domains';

export const ChainFamilies = {
  evm: 'evm',
  solana: 'solana',
  sui: 'sui',
  aptos: 'aptos',
};
const AllChainFamilies = Object.values(ChainFamilies);
export type ChainFamily = (typeof AllChainFamilies)[number];

export interface Blockchain {
  // ex: ethereum
  name: string;

  // default: evm, more coming soon
  family: ChainFamily;

  // start collect data from block number
  startBlock: number;

  // list of node rpcs
  nodeRpcs: Array<string>;
}

export interface DatabaseCollectionConfig {
  cachingData: MongoCollectionConfig;

  rawdataBlocks: MongoCollectionConfig;
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
