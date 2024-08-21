import { ChainFamily } from './configs';

export interface BlockData {
  // chain name
  chain: string;

  // chain family
  family: ChainFamily;

  // native token
  coin: string;

  // block number
  number: number;

  // unix timestamp
  timestamp: number;

  // the percentage of block resource limit was filled
  utilization: string;

  // total fees (in native coin) were paid
  totalFeesPaid: string;

  // number of transactions were transact in this block
  transactions: number;

  // unique addresses trigger to send transactions
  senderAddresses: Array<string>;
}
