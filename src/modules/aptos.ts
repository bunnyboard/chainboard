import logger from '../lib/logger';
import { Blockchain } from '../types/configs';
import ChainAdapter from './chain';
import { ContextStorages } from '../types/namespaces';
import axios from 'axios';
import { RawdataBlock } from '../types/domains';
import { AptosTransactionMaxGas } from '../configs/constants';

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

  public async getBlockData(blockNumber: number): Promise<RawdataBlock | null> {
    for (const nodeRpc of this.chainConfig.nodeRpcs) {
      const response = await this.queryApi(`${nodeRpc}/v1/blocks/by_height/${blockNumber}?with_transactions=true`);

      if (response) {
        const blockData: RawdataBlock = {
          chain: this.chainConfig.name,
          family: this.chainConfig.family,
          number: blockNumber,
          timestamp: Math.floor(response.block_timestamp / 1_000_000),

          throughput: {
            resourceLimit: response.transactions.length * AptosTransactionMaxGas,
            resourceUsed: 0,
          },

          transactions: response.transactions.length,

          senderAddresses: [],
        };

        const senderAddresses: { [key: string]: boolean } = {};
        for (const transaction of response.transactions) {
          if (transaction.sender) {
            senderAddresses[transaction.sender] = true;
          }

          if (blockData.throughput) {
            blockData.throughput.resourceUsed += Number(transaction.gas_used);
          }
        }

        blockData.senderAddresses = Object.keys(senderAddresses);

        return blockData;
      }
    }

    return null;
  }
}
