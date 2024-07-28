// time
export const TimeUnits = {
  SecondsPerDay: 24 * 60 * 60,
  DaysPerYear: 365,
  SecondsPerYear: 365 * 24 * 60 * 60,
};

export const AddressZero = '0x0000000000000000000000000000000000000000';
export const AddressE = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
export const AddressF = '0xffffffffffffffffffffffffffffffffffffffff';

// Every block on Solana has a blockspace limit of 48 million CUs
// https://github.com/solana-developers/cu_optimizations
export const SolanaBlockComputeUnits = 48_000_000;

// https://docs.sui.io/concepts/tokenomics/gas-in-sui#computation
export const SuiTransactionComputeUnits = 5_000_000;

// https://docs.rs/aptos-global-constants-link/latest/aptos_global_constants_link/constant.MAX_GAS_AMOUNT.html
export const AptosTransactionMaxGas = 1_000_000;
