import { expect, test } from 'vitest';
import envConfig from '../configs/envConfig';
import { MemcacheService } from '../services/caching/memcache';
import DatabaseService from '../services/database/database';
import { DefaultMemcacheTime } from '../configs';
import AptosChainAdapter from './aptos';
import { ChainFamilies } from '../types/configs';

const memcache = new MemcacheService(DefaultMemcacheTime);
const database = new DatabaseService();

test('should get block data correctly chain aptos', async function () {
  const chainAdapter = new AptosChainAdapter(
    {
      memcache: memcache,
      database: database,
    },
    envConfig.blockchains.aptos,
  );
  const latestBlockNumber = await chainAdapter.getLatestBlockNumber();
  expect(latestBlockNumber).greaterThan(0);

  const blockData = await chainAdapter.getBlockData(203259724);
  expect(blockData).not.equal(null);

  console.log(blockData);

  if (blockData) {
    expect(blockData.chain).equal('aptos');
    expect(blockData.family).equal(ChainFamilies.aptos);
    expect(blockData.coin).equal('APT');
    expect(blockData.number).equal(203259724);
    expect(blockData.timestamp).equal(1721316230);
    expect(blockData.transactions).equal(5);
  }
});
