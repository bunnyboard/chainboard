import logger from '../lib/logger';
import { Blockchain } from '../types/configs';
import ChainAdapter from './chain';
import { ContextStorages } from '../types/namespaces';
import axios from 'axios';
import { RawdataBlock } from '../types/domains';
import { SuiTransactionComputeUnits } from '../configs/constants';

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

          throughput: {
            // https://docs.sui.io/concepts/tokenomics/gas-in-sui#computation
            // every sui tx has limit of 5,000,000 Computation Units
            resourceLimit: SuiTransactionComputeUnits * response.result.transactions.length,
            resourceUsed: 0,
          },

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

            if (blockData.throughput) {
              // Computation Units = computationCost / gasPrice
              const gasPrice = Number(transaction.transaction.data.gasData.price);
              blockData.throughput.resourceUsed += Math.floor(
                Number(transaction.effects.gasUsed.computationCost) / gasPrice,
              );
            }
          }

          blockData.senderAddresses = Object.keys(senderAddresses);
        }

        return blockData;
      }
    }

    return null;
  }
}
