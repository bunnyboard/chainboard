import { ChainFamily } from './configs';

// present limit of block space in blockchain
// for example, on evm chains, we use gasLimit and gasUsed
// on solana, we use compound unit used with compound unit limit
export interface BlockThroughput {
  resourceLimit: number;
  resourceUsed: number;
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

  // size in bytes
  size?: number;

  // block throughput
  throughput: BlockThroughput | null;

  // total number of transactions were transact in all blocks
  transactions: number;

  // address trigger to send the transaction
  senderAddresses: Array<string>;
}
