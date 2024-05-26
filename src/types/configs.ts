import { MongoCollectionConfig } from '../services/database/domains';

export interface Blockchain {
  // ex: ethereum
  name: string;

  chainId: number;

  // default: evm, more coming soon
  family: 'evm';

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
