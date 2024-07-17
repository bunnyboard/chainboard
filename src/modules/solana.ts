import logger from '../lib/logger';
import { Blockchain } from '../types/configs';
import ChainAdapter from './chain';
import { ContextStorages } from '../types/namespaces';
import axios from 'axios';
import { RawdataBlock } from '../types/domains';
import BigNumber from 'bignumber.js';

export default class SolanaChainAdapter extends ChainAdapter {
  public readonly name: string = 'chain.solana';

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
        method: 'getSlot',
        params: [{ commitment: 'confirmed' }],
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
        method: 'getBlock',
        params: [
          blockNumber,
          {
            encoding: 'json',
            transactionDetails: 'full',
            maxSupportedTransactionVersion: 0,
          },
        ],
      });

      if (response.result) {
        const blockData: RawdataBlock = {
          chain: this.chainConfig.name,
          family: this.chainConfig.family,
          number: blockNumber,
          timestamp: Number(response.result.blockTime),

          totalCoinTransfer: '0',
          totalFeesPaid: '0',
          totalRewardPaid: '0',

          transactions: response.result.transactions.length,

          senderAddresses: [],

          eventLogs: [],
        };

        const senderAddresses: { [key: string]: boolean } = {};
        for (const transaction of response.result.transactions) {
          const signer = transaction.transaction.message.accountKeys[0];
          senderAddresses[signer] = true;

          for (let i = 0; i < transaction.meta.preBalances.length; i++) {
            const preBalance = new BigNumber(transaction.meta.preBalances[i]);
            const postBalance = new BigNumber(transaction.meta.postBalances[i]);
            if (preBalance.lt(postBalance)) {
              blockData.totalCoinTransfer = new BigNumber(blockData.totalCoinTransfer)
                .plus(postBalance.minus(preBalance).dividedBy(1e8))
                .toString(10);
            }
          }

          if (blockData.totalFeesPaid) {
            blockData.totalFeesPaid = new BigNumber(blockData.totalFeesPaid)
              .plus(new BigNumber(transaction.meta.fee.toString()).dividedBy(1e8))
              .toString(10);
          }
        }

        if (blockData.totalRewardPaid) {
          for (const reward of response.result.rewards) {
            blockData.totalRewardPaid = new BigNumber(blockData.totalRewardPaid)
              .plus(new BigNumber(reward.lamports.toString()).dividedBy(1e8))
              .toString(10);
          }
        }

        blockData.senderAddresses = Object.keys(senderAddresses);

        return blockData;
      }
    }

    return null;
  }
}
