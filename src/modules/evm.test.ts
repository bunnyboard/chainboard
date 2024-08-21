import { expect, test } from 'vitest';
import envConfig from '../configs/envConfig';
import { MemcacheService } from '../services/caching/memcache';
import DatabaseService from '../services/database/database';
import { DefaultMemcacheTime } from '../configs';
import EvmChainAdapter from './evm';
import { ChainFamilies } from '../types/configs';

const memcache = new MemcacheService(DefaultMemcacheTime);
const database = new DatabaseService();

test('should get block data correctly chain ethereum', async function () {
  const evmChainAdapter = new EvmChainAdapter(
    {
      memcache: memcache,
      database: database,
    },
    envConfig.blockchains.ethereum,
  );
  const latestBlockNumber = await evmChainAdapter.getLatestBlockNumber();
  expect(latestBlockNumber).greaterThan(0);

  const blockData = await evmChainAdapter.getBlockData(20324875);
  expect(blockData).not.equal(null);
  if (blockData) {
    expect(blockData.chain).equal('ethereum');
    expect(blockData.family).equal(ChainFamilies.evm);
    expect(blockData.coin).equal('ETH');
    expect(blockData.number).equal(20324875);
    expect(blockData.timestamp).equal(1721202755);
    expect(blockData.transactions).equal(173);
    expect(blockData.utilization).equal('0.5656882');
    expect(blockData.totalFeesPaid).equal('0.178223303570381742');
  }
});

test('should get block data correctly chain optimism', async function () {
  const evmChainAdapter = new EvmChainAdapter(
    {
      memcache: memcache,
      database: database,
    },
    envConfig.blockchains.optimism,
  );
  const latestBlockNumber = await evmChainAdapter.getLatestBlockNumber();
  expect(latestBlockNumber).greaterThan(0);

  const blockData = await evmChainAdapter.getBlockData(124314195);
  expect(blockData).not.equal(null);
  if (blockData) {
    expect(blockData.chain).equal('optimism');
    expect(blockData.family).equal(ChainFamilies.evm);
    expect(blockData.coin).equal('ETH');
    expect(blockData.number).equal(124314195);
    expect(blockData.timestamp).equal(1724227167);
    expect(blockData.transactions).equal(8);
    expect(blockData.utilization).equal('0.15239273333333333333');
    expect(blockData.totalFeesPaid).equal('0.000007623319048678');
  }
});
