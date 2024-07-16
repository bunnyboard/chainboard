import envConfig from '../configs/envConfig';
import EnvConfig from '../configs/envConfig';
import logger from '../lib/logger';
import { formatTime } from '../lib/utils';
import ExecuteSession from '../services/execute';
import { Blockchain } from '../types/configs';
import { RawdataBlock } from '../types/domains';
import { ContextStorages, IChainAdapter } from '../types/namespaces';
import { RunCollectorOptions } from '../types/options';

export default class ChainAdapter implements IChainAdapter {
  public readonly name: string = 'chain';
  public readonly chainConfig: Blockchain;
  public readonly storages: ContextStorages;

  protected execute: ExecuteSession;

  constructor(storages: ContextStorages, chainConfig: Blockchain) {
    this.storages = storages;
    this.chainConfig = chainConfig;

    this.execute = new ExecuteSession();
  }

  public async getLatestBlockNumber(): Promise<number> {
    return 0;
  }

  public async getBlockData(blockNumber: number): Promise<RawdataBlock | null> {
    return null;
  }

  protected async runCollector(options: RunCollectorOptions): Promise<void> {
    const latestBlock = await this.getLatestBlockNumber();

    let startBlock = options.fromBlock ? options.fromBlock : this.chainConfig.startBlock;

    // sync from recently 100 blocks
    if (startBlock === 0) {
      startBlock = latestBlock - 100;
    }

    // we find the latest block number from database
    if (!options.force) {
      const latestBlockFromDb = await this.storages.database.find({
        collection: envConfig.mongodb.collections.rawdataBlocks.name,
        query: {
          chain: this.chainConfig.name,
        },
        options: {
          limit: 1,
          skip: 0,
          order: { number: -1 },
        },
      });
      if (latestBlockFromDb) {
        startBlock = latestBlockFromDb.number;
      }
    }

    logger.info('start to update raw block data', {
      service: this.name,
      chain: this.chainConfig.name,
      fromBlock: startBlock,
      toBlock: latestBlock,
    });

    while (startBlock <= latestBlock) {
      this.execute.startSessionMuted();

      const blockData = await this.getBlockData(startBlock);
      if (blockData) {
        await this.storages.database.update({
          collection: EnvConfig.mongodb.collections.rawdataBlocks.name,
          keys: {
            chain: this.chainConfig.name,
            number: blockData.number,
          },
          updates: {
            ...blockData,
          },
          upsert: true,
        });

        this.execute.endSession('updated raw block data', {
          service: this.name,
          chain: this.chainConfig.name,
          number: blockData.number,
          age: formatTime(blockData.timestamp),
          txns: blockData.transactions,
        });
      } else {
        logger.error('failed to get block data from all rpcs', {
          service: this.name,
          chain: this.chainConfig.name,
          number: startBlock,
        });
        process.exit(0);
      }

      startBlock += 1;
    }
  }

  public async run(options: RunCollectorOptions): Promise<void> {
    await this.runCollector(options);
  }
}
