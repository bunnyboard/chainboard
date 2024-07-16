import BigNumber from 'bignumber.js';
import { PublicClient, createPublicClient, http } from 'viem';
import { getBlock, getBlockNumber } from 'viem/actions';

import logger from '../lib/logger';
import { normalizeAddress, sleep } from '../lib/utils';
import { Blockchain, ChainFamilies } from '../types/configs';
import ChainAdapter from './chain';
import { RawdataBlock } from '../types/domains';
import { ContextStorages } from '../types/namespaces';

export default class EvmChainAdapter extends ChainAdapter {
  public readonly name: string = 'chain.evm';

  constructor(storages: ContextStorages, chainConfig: Blockchain) {
    super(storages, chainConfig);
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

  public async getLatestBlockNumber(): Promise<number> {
    for (const nodeRpc of this.chainConfig.nodeRpcs) {
      const client = this.getPublicClient(nodeRpc);
      const blockNumber = await getBlockNumber(client);

      if (blockNumber) {
        return Number(blockNumber);
      }

      logger.warn('failed to get block number from rpc', {
        service: this.name,
        chain: this.chainConfig.name,
        rpc: nodeRpc,
      });

      await sleep(1);
    }

    return 0;
  }

  public async getBlockData(blockNumber: number): Promise<RawdataBlock | null> {
    if (this.chainConfig.family !== ChainFamilies.evm) {
      return null;
    }

    for (const nodeRpc of this.chainConfig.nodeRpcs) {
      try {
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
          const blockData: RawdataBlock = {
            chain: this.chainConfig.name,
            family: this.chainConfig.family,
            number: Number(rawBlock.number),
            timestamp: Number(rawBlock.timestamp),

            gasUsed: Number(rawBlock.gasUsed),
            gasLimit: Number(rawBlock.gasLimit),

            totalCoinTransfer: '0',

            transactions: rawBlock.transactions.length,

            senderAddresses: [],

            eventLogs: [],
          };

          const senderAddresses: any = {};
          for (const transaction of rawBlock.transactions) {
            if (transaction.gasPrice && transaction.gasPrice === 0n) {
              // ignore, EVM layer 2 system transaction
              continue;
            }

            // count unique addresses
            senderAddresses[normalizeAddress(transaction.from)] = true;

            // count coin volume transfer
            blockData.totalCoinTransfer = new BigNumber(blockData.totalCoinTransfer)
              .plus(new BigNumber(transaction.value.toString()).dividedBy(1e18))
              .toString(10);
          }

          blockData.senderAddresses = Object.keys(senderAddresses);

          blockData.eventLogs = logs.map((item) => {
            return {
              contract: normalizeAddress(item.address),
              signature: item.topics[0] ? item.topics[0] : '',
            };
          });

          return blockData;
        }
      } catch (e: any) {
        logger.warn('failed to get data from rpc', {
          service: this.name,
          chain: this.chainConfig.name,
          rpc: nodeRpc,
          error: e.message,
        });
        await sleep(1);
      }
    }

    return null;
  }
}
