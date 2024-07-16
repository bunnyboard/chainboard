import { describe, expect, test } from 'vitest';
import envConfig from '../configs/envConfig';
import { MemcacheService } from '../services/caching/memcache';
import DatabaseService from '../services/database/database';
import { DefaultMemcacheTime } from '../configs';
import EvmChainAdapter from './evm';

const memcache = new MemcacheService(DefaultMemcacheTime);
const database = new DatabaseService();

describe('getBlockNumberAtTimestamp', function () {
  Object.values(envConfig.blockchains).map((item) =>
    test(`should get block data correctly - ${item.name}`, async function () {
      const evmChainAdapter = new EvmChainAdapter(
        {
          memcache: memcache,
          database: database,
        },
        item,
      );

      const latestBlockNumber = await evmChainAdapter.getLatestBlockNumber();
      const blockData = await evmChainAdapter.getBlockData(latestBlockNumber);

      expect(latestBlockNumber).greaterThan(0);
      expect(blockData).not.equal(null);
    }),
  );
});
