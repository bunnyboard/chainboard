import logger from '../lib/logger';
import { Blockchain } from '../types/configs';
import ChainAdapter from './chain';
import { ContextStorages } from '../types/namespaces';
import axios from 'axios';
import { RawdataBlock } from '../types/domains';
import BigNumber from 'bignumber.js';

export default class SuiChainAdapter extends ChainAdapter {
  public readonly name: string = 'chain.sui';

  constructor(storages: ContextStorages, chainConfig: Blockchain) {
    super(storages, chainConfig);
  }

  private async callRpc(url: string, data: any): Promise<any> {
    try {
      const response = await axios.post(url, data);

      if (response.data) {
        return response.data;
      }
    } catch (e: any) {}

    return null;
  }

  public async getLatestBlockNumber(): Promise<number> {
    for (const nodeRpc of this.chainConfig.nodeRpcs) {
      const response = await this.callRpc(nodeRpc, {
        jsonrpc: '2.0',
        id: 0,
        method: 'sui_getLatestCheckpointSequenceNumber',
        params: [],
      });

      if (response) {
        return Number(response.result);
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
    for (const nodeRpc of this.chainConfig.nodeRpcs) {
      const response = await this.callRpc(nodeRpc, {
        jsonrpc: '2.0',
        id: 0,
        method: 'sui_getCheckpoint',
        params: [blockNumber.toString()],
      });

      if (response.result) {
        const blockData: RawdataBlock = {
          chain: this.chainConfig.name,
          family: this.chainConfig.family,
          number: blockNumber,
          timestamp: Math.floor(response.result.timestampMs / 1000),

          totalCoinTransfer: '0',
          totalBaseFees: '0',

          resourceLimit: 0,
          resourceUsed: 0,

          transactions: response.result.transactions.length,

          senderAddresses: [],
        };

        const transactions = await this.callRpc(nodeRpc, {
          jsonrpc: '2.0',
          id: 0,
          method: 'sui_multiGetTransactionBlocks',
          params: [
            response.result.transactions,
            {
              showInput: true,
              showRawInput: true,
              showEffects: true,
              showBalanceChanges: true,
            },
          ],
        });

        if (transactions.result) {
          const senderAddresses: { [key: string]: boolean } = {};
          for (const transaction of transactions.result) {
            const sender = transaction.transaction.data.sender;
            if (sender !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
              senderAddresses[sender] = true;
            }

            if (transaction.effects) {
              const fees = new BigNumber(transaction.effects.gasUsed.computationCost)
                .plus(new BigNumber(transaction.effects.gasUsed.storageCost))
                .minus(new BigNumber(transaction.effects.gasUsed.storageRebate));
              blockData.totalBaseFees = new BigNumber(blockData.totalBaseFees).plus(fees.dividedBy(1e9)).toString(10);
            }

            if (transaction.balanceChanges) {
              for (const balanceChange of transaction.balanceChanges) {
                if (balanceChange.coinType === '0x2::sui::SUI') {
                  const amount = new BigNumber(balanceChange.amount);
                  if (amount.lt(0)) {
                    blockData.totalCoinTransfer = new BigNumber(blockData.totalBaseFees)
                      .plus(amount.abs().dividedBy(1e9))
                      .toString(10);
                  }
                }
              }
            }

            // https://docs.sui.io/concepts/tokenomics/gas-in-sui#computation
            // resource limit is total bucket of a transaction
            const budget = Number(transaction.transaction.data.gasData.budget);
            blockData.resourceLimit += budget;
            // resource used is transaction computationCost
            const gasPrice = Number(transaction.transaction.data.gasData.price);
            blockData.resourceUsed += Math.floor(Number(transaction.effects.gasUsed.computationCost) / gasPrice);
          }

          // remove amount of SUI paid for transaction fee
          blockData.totalCoinTransfer = new BigNumber(blockData.totalCoinTransfer)
            .minus(new BigNumber(blockData.totalBaseFees))
            .toString(10);

          blockData.senderAddresses = Object.keys(senderAddresses);
        }

        return blockData;
      }
    }

    return null;
  }
}
