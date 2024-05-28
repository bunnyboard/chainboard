import { IMemcacheService } from '../services/caching/domains';
import { IDatabaseService } from '../services/database/domains';
import { Blockchain } from './configs';
import { BlockData } from './domains';
import { RunCollectorOptions } from './options';

export interface ContextStorages {
  database: IDatabaseService;
  memcache: IMemcacheService;
}

export interface IChainAdapter {
  name: string;

  chainConfig: Blockchain;

  storages: ContextStorages;

  // return latest block number of the chain
  getBlockNumber: () => Promise<number>;

  // query block data
  getBlockData: (blockNumber: number) => Promise<BlockData | null>;

  run: (options: RunCollectorOptions) => Promise<void>;
}
