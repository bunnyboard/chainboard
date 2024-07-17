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

  // size in bytes
  size?: number;

  // unix timestamp
  timestamp: number;

  // native coin transfer volume
  // simply count tx.value
  totalCoinTransfer: string;

  // total base fees
  totalBaseFees: string;

  // eth2 ETH withdrawal
  totalCoinWithdrawn?: string;

  // total number of transactions were transact in all blocks
  transactions: number;

  // gas on evm or compute on solana
  gasLimit?: number;
  gasUsed?: number;

  // address trigger to send the transaction
  senderAddresses: Array<string>;
}
