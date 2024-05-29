import BigNumber from 'bignumber.js';
import { PublicClient, createPublicClient, http } from 'viem';
import { getBlock, getBlockNumber } from 'viem/actions';

import logger from '../lib/logger';
import { normalizeAddress, sleep } from '../lib/utils';
import { Blockchain, ChainFamilies } from '../types/configs';
import { BlockData } from '../types/domains';
import { ContextStorages } from '../types/namespaces';
import ChainAdapter from './chain';

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

  public async getBlockNumber(): Promise<number> {
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
        const logs = await client.getLogs({
          fromBlock: BigInt(blockNumber),
          toBlock: BigInt(blockNumber),
        });

        if (rawBlock) {
          const blockData: BlockData = {
            chain: this.chainConfig.name,
            family: this.chainConfig.family,
            number: Number(rawBlock.number),
            timestamp: Number(rawBlock.timestamp),

            gasUsed: Number(rawBlock.gasUsed),
            gasLimit: Number(rawBlock.gasLimit),

            totalCoinTransfer: '0',

            // eip 1559
            totalCoinBurnt: this.chainConfig.eip1559 ? '0' : undefined,

            deployedContracts: 0,

            transactions: rawBlock.transactions.length,

            fromAddresses: [],
            toAddresses: [],

            contractLogs: [],
          };

          const fromAddresses: any = {};
          const toAddresses: any = {};
          const transactionDeployContracts: any = {};

          for (const transaction of rawBlock.transactions) {
            if (transaction.gasPrice && transaction.gasPrice === 0n) {
              // ignore, layer 2 system transaction
              continue;
            }

            // count unique addresses
            fromAddresses[normalizeAddress(transaction.from)] = true;
            if (transaction.to) {
              toAddresses[normalizeAddress(transaction.to)] = true;
            }

            if (!transaction.to && transaction.input !== '0x0' && (transaction.input as string) !== '') {
              transactionDeployContracts[transaction.hash] = true;
            }

            // count coin volume transfer
            blockData.totalCoinTransfer = new BigNumber(blockData.totalCoinTransfer)
              .plus(new BigNumber(transaction.value.toString()).dividedBy(1e18))
              .toString(10);
          }

          // count coin were burnt if any, EIP-1559
          // coin burnt = baseFeePerGas * gasUsed
          if (rawBlock.baseFeePerGas && blockData.totalCoinBurnt && this.chainConfig.eip1559) {
            blockData.totalCoinBurnt = new BigNumber(blockData.totalCoinBurnt)
              .plus(
                new BigNumber(rawBlock.baseFeePerGas.toString())
                  .multipliedBy(rawBlock.gasUsed.toString())
                  .dividedBy(1e18),
              )
              .toString(10);
          }

          blockData.deployedContracts = Object.keys(transactionDeployContracts).length;

          blockData.fromAddresses = Object.keys(fromAddresses);
          blockData.toAddresses = Object.keys(toAddresses);

          blockData.contractLogs = logs.map((item) => {
            return {
              address: normalizeAddress(item.address),
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
        });
        console.log(e);
        await sleep(1);
      }
    }

    return null;
  }
}
