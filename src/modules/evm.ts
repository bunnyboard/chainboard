import { PublicClient, createPublicClient, http } from 'viem';
import { getBlock, getBlockNumber } from 'viem/actions';

import logger from '../lib/logger';
import { normalizeAddress } from '../lib/utils';
import { Blockchain, ChainFamilies } from '../types/configs';
import ChainAdapter from './chain';
import { BlockData } from '../types/domains';
import { ContextStorages } from '../types/namespaces';
import axios from 'axios';
import BigNumber from 'bignumber.js';

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

  public async getBlockData(blockNumber: number): Promise<BlockData | null> {
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
          const blockData: BlockData = {
            chain: this.chainConfig.name,
            family: this.chainConfig.family,
            coin: this.chainConfig.coin,
            number: Number(rawBlock.number),
            timestamp: Number(rawBlock.timestamp),
            utilization: new BigNumber(rawBlock.gasUsed.toString())
              .dividedBy(new BigNumber(rawBlock.gasLimit.toString()))
              .toString(10),
            totalFeesPaid: '0',
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

          let blockTransactionReceipts: Array<any> = [];
          if (this.chainConfig.extension === 'alchemy') {
            const response = await axios.post(nodeRpc, {
              id: 1,
              jsonrpc: '2.0',
              method: 'alchemy_getTransactionReceipts',
              params: [
                {
                  blockNumber: `0x${blockNumber.toString(16)}`,
                },
              ],
            });
            if (response && response.data) {
              blockTransactionReceipts = response.data.result.receipts;
            }
          } else {
            for (const transaction of rawBlock.transactions) {
              const receipt = await client.getTransactionReceipt({
                hash: transaction.hash as any,
              });
              if (receipt) {
                blockTransactionReceipts.push(receipt);
              }
            }
          }

          for (const transactionReceipt of blockTransactionReceipts) {
            const transactionFeePaid = new BigNumber(transactionReceipt.gasUsed.toString(), 16)
              .multipliedBy(new BigNumber(transactionReceipt.effectiveGasPrice.toString(), 16))
              .dividedBy(1e18);
            blockData.totalFeesPaid = new BigNumber(blockData.totalFeesPaid)
              .plus(new BigNumber(transactionFeePaid))
              .toString(10);
          }

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
