import { ChainFamily } from './configs';

export interface ContractLogBasic {
  address: string;
  signature: string;
}

export interface DataValue {
  value: number;
  changedDay?: number;
}

export interface BlockData {
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

  // list of contract logs
  contractLogs: Array<ContractLogBasic>;

  // total number of transactions were transact in all blocks
  transactions: number;

  // address trigger to send the transaction
  fromAddresses: Array<string>;

  // address called to or contract
  toAddresses: Array<string>;

  // === EVM === //
  // for Ethereum EIP-1559
  // number of ETH were burnt
  totalCoinBurnt?: string;

  // new contract were deployed
  // we detect a new contract deployed with:
  // - tx.to is null (omitted)
  // - tx.data is not empty
  deployedContracts?: number;

  // gas on evm
  gasUsed?: number;
  gasLimit?: number;
}

export interface ChainData {
  chain: string;
  family: ChainFamily;

  timestamp: number; // timestamp where data were updated

  blocks: DataValue;
  transactions: DataValue;
  fromAddresses: DataValue;
  toAddresses: DataValue;

  totalCoinTransfer: DataValue;

  deployedContracts: DataValue;
}
