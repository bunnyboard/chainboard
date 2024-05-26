import BigNumber from 'bignumber.js';
import { PublicClient, createPublicClient, http } from 'viem';
import { getBlock, getBlockNumber } from 'viem/actions';

import EnvConfig from '../../configs/envConfig';
import logger from '../../lib/logger';
import { normalizeAddress, sleep } from '../../lib/utils';
import { Blockchain } from '../../types/configs';
import { BlockData } from '../../types/domains';
import { ContextStorages, IChainAdapter } from '../../types/namespaces';
import { RunCollectorOptions } from '../../types/options';

export default class EvmChainAdapter implements IChainAdapter {
  public readonly name: string = 'evm';
  public readonly config: Blockchain;
  public readonly storages: ContextStorages;

  constructor(storages: ContextStorages, config: Blockchain) {
    this.storages = storages;
    this.config = config;
  }

  private getPublicClient(nodeRpc: string): PublicClient {
    return createPublicClient({
      batch: {
        multicall: true,
      },
      transport: http(nodeRpc, {
        timeout: 10000, // 10 secs
      }),
    });
  }

  public async getBlockNumber(): Promise<number> {
    for (const nodeRpc of this.config.nodeRpcs) {
      const client = this.getPublicClient(nodeRpc);
      const blockNumber = await getBlockNumber(client);

      if (blockNumber) {
        return Number(blockNumber);
      }

      logger.warn('failed to get block number from rpc', {
        service: this.name,
        chain: this.config.name,
        rpc: nodeRpc,
      });

      await sleep(1);
    }

    return 0;
  }

  public async getBlockData(blockNumber: number): Promise<BlockData | null> {
    for (const nodeRpc of this.config.nodeRpcs) {
      const client = this.getPublicClient(nodeRpc);
      const rawBlock = await getBlock(client, {
        blockNumber: BigInt(blockNumber),
        includeTransactions: true,
      });
      const logs = await client.getLogs({
        fromBlock: BigInt(blockNumber),
        toBlock: BigInt(blockNumber),
      });

      if (rawBlock) {
        const blockData: BlockData = {
          chain: this.config.name,
          number: Number(rawBlock.number),
          timestamp: Number(rawBlock.timestamp),

          gasUsed: Number(rawBlock.gasUsed),
          gasLimit: Number(rawBlock.gasLimit),

          totalCoinTransfer: '0',
          totalCoinBurnt: '0',

          deployedContracts: 0,
          transactions: rawBlock.transactions.length,

          addresses: [],
          withdrawRecipients: [],

          contractLogs: [],
        };

        const transactionDeployContracts: any = {};

        const addressSenders: any = {};
        const addressWithdrawRecipients: any = {};

        for (const transaction of rawBlock.transactions) {
          if (transaction.gasPrice && transaction.gasPrice === 0n) {
            // ignore, layer 2 system transaction
            continue;
          }

          // count unique sender addresses
          addressSenders[normalizeAddress(transaction.from)] = true;

          if (!transaction.to && transaction.input !== '0x0' && (transaction.input as string) !== '') {
            transactionDeployContracts[transaction.hash] = true;
          }

          // count coin volume transfer
          blockData.totalCoinTransfer = new BigNumber(blockData.totalCoinTransfer)
            .plus(new BigNumber(transaction.value.toString()).dividedBy(1e18))
            .toString(10);
        }

        if (this.config.name === 'ethereum') {
          blockData.totalCoinWithdrawn = '0';
          if (rawBlock.withdrawals) {
            for (const withdrawal of rawBlock.withdrawals) {
              blockData.totalCoinWithdrawn = new BigNumber(blockData.totalCoinWithdrawn)
                .plus(new BigNumber(withdrawal.amount, 16).dividedBy(1e9))
                .toString(10);

              addressWithdrawRecipients[normalizeAddress(withdrawal.address)] = true;
            }
          }
        }

        // count coin were burnt if any
        // coin burnt = baseFeePerGas * gasUsed
        if (rawBlock.baseFeePerGas) {
          blockData.totalCoinBurnt = new BigNumber(blockData.totalCoinBurnt)
            .plus(
              new BigNumber(rawBlock.baseFeePerGas.toString())
                .multipliedBy(rawBlock.gasUsed.toString())
                .dividedBy(1e18),
            )
            .toString(10);
        }

        blockData.deployedContracts = Object.keys(transactionDeployContracts).length;

        blockData.addresses = Object.keys(addressSenders);
        blockData.withdrawRecipients = Object.keys(addressWithdrawRecipients);

        blockData.contractLogs = logs.map((item) => {
          return {
            address: normalizeAddress(item.address),
            signature: item.topics[0] ? item.topics[0] : '',
          };
        });

        return blockData;
      }

      logger.warn('failed to get block data from rpc', {
        service: this.name,
        chain: this.config.name,
        rpc: nodeRpc,
      });

      await sleep(1);
    }

    return null;
  }

  public async run(options: RunCollectorOptions): Promise<void> {
    const latestBlock = await this.getBlockNumber();

    let startBlock = options.fromBlock ? options.fromBlock : this.config.startBlock;

    const syncStateKey = `state-${this.config.name}`;
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
      chain: this.config.name,
      fromBlock: startBlock,
      toBlock: latestBlock,
    });

    while (startBlock <= latestBlock) {
      const blockData = await this.getBlockData(startBlock);
      if (blockData) {
        await this.storages.database.update({
          collection: EnvConfig.mongodb.collections.rawdataBlockData.name,
          keys: {
            chain: this.config.name,
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

        logger.info('updated block data', {
          service: this.name,
          chain: this.config.name,
          number: blockData.number,
          age: new Date(blockData.timestamp * 1000).toISOString(),
        });
      } else {
        logger.error('failed to get block data from all rpcs', {
          service: this.name,
          chain: this.config.name,
          number: startBlock,
        });
        process.exit(0);
      }

      startBlock += 1;
    }
  }
}
