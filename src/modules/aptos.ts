import logger from '../lib/logger';
import { Blockchain } from '../types/configs';
import ChainAdapter from './chain';
import { ContextStorages } from '../types/namespaces';
import axios from 'axios';
import { AptosTransactionMaxGas } from '../configs/constants';
import { BlockData } from '../types/domains';
import BigNumber from 'bignumber.js';

export default class AptosChainAdapter extends ChainAdapter {
  public readonly name: string = 'chain.aptos';

  constructor(storages: ContextStorages, chainConfig: Blockchain) {
    super(storages, chainConfig);
  }

  private async queryApi(url: string): Promise<any> {
    try {
      const response = await axios.get(url);

      if (response.data) {
        return response.data;
      }
    } catch (e: any) {}

    return null;
  }

  public async getLatestBlockNumber(): Promise<number> {
    for (const nodeRpc of this.chainConfig.nodeRpcs) {
      const response = await this.queryApi(`${nodeRpc}/v1`);

      if (response) {
        return Number(response.block_height);
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
    for (const nodeRpc of this.chainConfig.nodeRpcs) {
      const response = await this.queryApi(`${nodeRpc}/v1/blocks/by_height/${blockNumber}?with_transactions=true`);

      if (response) {
        const blockData: BlockData = {
          chain: this.chainConfig.name,
          family: this.chainConfig.family,
          number: blockNumber,
          timestamp: Math.floor(response.block_timestamp / 1_000_000),
          coin: this.chainConfig.coin,
          utilization: '0',
          totalFeesPaid: '0',
          transactions: response.transactions.length,
          senderAddresses: [],
        };

        let totalGasUsed = 0;
        const senderAddresses: { [key: string]: boolean } = {};
        for (const transaction of response.transactions) {
          if (transaction.sender) {
            senderAddresses[transaction.sender] = true;
          }

          if (transaction.gas_used && transaction.gas_unit_price) {
            blockData.totalFeesPaid = new BigNumber(blockData.totalFeesPaid)
              .plus(
                new BigNumber(transaction.gas_used.toString())
                  .multipliedBy(transaction.gas_unit_price.toString())
                  .dividedBy(1e9),
              )
              .toString(10);
          }

          totalGasUsed += Number(transaction.gas_used);
        }

        blockData.utilization = new BigNumber(totalGasUsed)
          .dividedBy(AptosTransactionMaxGas * response.transactions.length)
          .toString(10);
        blockData.senderAddresses = Object.keys(senderAddresses);

        return blockData;
      }
    }

    return null;
  }
}
