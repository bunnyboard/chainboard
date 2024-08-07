import { PublicClient, createPublicClient, http } from 'viem';
import { getBlock, getBlockNumber } from 'viem/actions';

import logger from '../lib/logger';
import { normalizeAddress } from '../lib/utils';
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

        if (rawBlock) {
          const blockData: RawdataBlock = {
            chain: this.chainConfig.name,
            family: this.chainConfig.family,
            number: Number(rawBlock.number),
            size: Number(rawBlock.size),
            timestamp: Number(rawBlock.timestamp),

            throughput: {
              resourceLimit: Number(rawBlock.gasLimit),
              resourceUsed: Number(rawBlock.gasUsed),
            },

            transactions: rawBlock.transactions.length,

            senderAddresses: [],
          };

          const senderAddresses: any = {};
          for (const transaction of rawBlock.transactions) {
            if (transaction.gasPrice && transaction.gasPrice === 0n) {
              // ignore, EVM layer 2 system transaction
              continue;
            }

            // count unique addresses
            senderAddresses[normalizeAddress(transaction.from)] = true;
          }

          blockData.senderAddresses = Object.keys(senderAddresses);

          return blockData;
        }
      } catch (e: any) {
        logger.warn('failed to get data from rpc', {
          service: this.name,
          chain: this.chainConfig.name,
          rpc: nodeRpc,
        });
      }
    }

    return null;
  }
}
