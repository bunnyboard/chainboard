import { ChainFamily } from './configs';

export interface EventLogBasic {
  contract: string;
  signature: string;
}

export interface RawdataBlock {
  // chain name
  chain: string;

  // chain family
  family: ChainFamily;

  // block number
  number: number;

  // unix timestamp
  timestamp: number;

  // native coin transfer volume
  // simply count tx.value
  totalCoinTransfer: string;

  // total transaction fees were paid
  totalFeesPaid?: string;

  // total reward paid to miner/validator
  totalRewardPaid?: string;

  // total number of transactions were transact in all blocks
  transactions: number;

  // gas on evm
  gasUsed?: number;
  gasLimit?: number;

  // address trigger to send the transaction
  senderAddresses: Array<string>;

  // list of contract logs
  eventLogs: Array<EventLogBasic>;
}
