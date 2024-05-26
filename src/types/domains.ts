export interface ContractLogBasic {
  address: string;
  signature: string;
}

export interface BlockData {
  // chain name
  chain: string;

  // block number
  number: number;

  // unix timestamp
  timestamp: number;

  // gas
  gasUsed: number;
  gasLimit: number;

  // native coin transfer volume
  // simply count tx.value
  totalCoinTransfer: string;

  // number of ETH were withdrawn from ETH2 staking
  // available after shanghai upgrade
  totalCoinWithdrawn?: string;

  // for Ethereum EIP-1559
  // number of ETH were burnt
  totalCoinBurnt: string;

  // new contract were deployed
  // we detect a new contract deployed with:
  // - tx.to is null (omitted)
  // - tx.data is not empty
  deployedContracts: number;

  // total number of transactions were transact in all blocks
  transactions: number;

  // address trigger to send the transaction
  addresses: Array<string>;

  // address is recipient of ETH2 withdrawal
  withdrawRecipients?: Array<string>;

  contractLogs: Array<ContractLogBasic>;
}
