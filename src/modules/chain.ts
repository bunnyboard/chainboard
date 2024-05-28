import EnvConfig from '../configs/envConfig';
import logger from '../lib/logger';
import { formatTime, getTimestamp } from '../lib/utils';
import ExecuteSession from '../services/execute';
import { Blockchain } from '../types/configs';
import { BlockData, ChainData } from '../types/domains';
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

  public async getBlockNumber(): Promise<number> {
    return 0;
  }

  public async getBlockData(blockNumber: number): Promise<BlockData | null> {
    return null;
  }

  protected async runCollector(options: RunCollectorOptions): Promise<void> {
    const latestBlock = await this.getBlockNumber();

    let startBlock = options.fromBlock ? options.fromBlock : this.chainConfig.startBlock;

    const syncStateKey = `collecting-block-data-${this.chainConfig.name}`;
    if (!options.force) {
      const state = await this.storages.database.find({
        collection: EnvConfig.mongodb.collections.cachingStates.name,
        query: {
          name: syncStateKey,
        },
      });
      if (state) {
        startBlock = state.blockNumber;
      }
    }

    logger.info('start to update block data', {
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
          collection: EnvConfig.mongodb.collections.rawdataBlockData.name,
          keys: {
            chain: this.chainConfig.name,
            number: blockData.number,
          },
          updates: {
            ...blockData,
          },
          upsert: true,
        });

        if (!options.force) {
          await this.storages.database.update({
            collection: EnvConfig.mongodb.collections.cachingStates.name,
            keys: {
              name: syncStateKey,
            },
            updates: {
              name: syncStateKey,
              blockNumber: startBlock,
            },
            upsert: true,
          });
        }

        this.execute.endSession('updated block data', {
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

  protected async aggregateData(options: RunCollectorOptions): Promise<void> {
    logger.info('start to aggregate chain data', {
      service: this.name,
      chain: this.chainConfig.name,
    });

    // update state

    this.execute.startSessionMuted();
    const currentTimestamp = getTimestamp();
    const last24HoursTimestamp = currentTimestamp - 24 * 60 * 60;

    const rawBlocks = await this.storages.database.query({
      collection: EnvConfig.mongodb.collections.rawdataBlockData.name,
      query: {
        chain: this.chainConfig.name,
        timestamp: {
          $gte: last24HoursTimestamp,
          $lte: currentTimestamp,
        },
      },
    });

    const chainDataCurrent: ChainData = {
      chain: this.chainConfig.name,
      family: this.chainConfig.family,
      timestamp: currentTimestamp,
      blocks: {
        value: rawBlocks.length,
      },
      transactions: {
        value: 0,
      },
      fromAddresses: {
        value: 0,
      },
      toAddresses: {
        value: 0,
      },
      totalCoinTransfer: {
        value: 0,
      },
      deployedContracts: {
        value: 0,
      },
    };

    const fromAddresses: any = {};
    const toAddresses: any = {};
    for (const block of rawBlocks) {
      chainDataCurrent.transactions.value += block.transactions;
      chainDataCurrent.totalCoinTransfer.value += Number(block.totalCoinTransfer);

      if (block.deployedContracts) {
        chainDataCurrent.deployedContracts.value += block.deployedContracts;
      }

      fromAddresses[block.fromAddresses] = true;
      toAddresses[block.toAddresses] = true;
    }

    chainDataCurrent.fromAddresses.value = Object.keys(fromAddresses).length;
    chainDataCurrent.toAddresses.value = Object.keys(toAddresses).length;

    await this.storages.database.update({
      collection: EnvConfig.mongodb.collections.chainDataStates.name,
      keys: {
        chain: this.chainConfig.name,
      },
      updates: {
        ...chainDataCurrent,
      },
      upsert: true,
    });

    this.execute.startSession('updated chain data state', {
      service: this.name,
      chain: this.chainConfig.name,
      blocks: chainDataCurrent.blocks.value,
      txns: chainDataCurrent.transactions.value,
    });
  }

  public async run(options: RunCollectorOptions): Promise<void> {
    await this.runCollector(options);
    await this.aggregateData(options);
  }
}
