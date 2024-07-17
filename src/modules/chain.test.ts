import { describe, expect, test } from 'vitest';
import envConfig from '../configs/envConfig';
import { MemcacheService } from '../services/caching/memcache';
import DatabaseService from '../services/database/database';
import { DefaultMemcacheTime } from '../configs';
import { ChainFamilies } from '../types/configs';
import SolanaChainAdapter from './solana';

const memcache = new MemcacheService(DefaultMemcacheTime);
const database = new DatabaseService();

describe('getBlockNumberAtTimestamp', function () {
  Object.values(envConfig.blockchains).map((item) =>
    test(`should get block data correctly - ${item.name}`, async function () {
      if (item.family === ChainFamilies.evm) {
        // const evmChainAdapter = new EvmChainAdapter(
        //   {
        //     memcache: memcache,
        //     database: database,
        //   },
        //   item,
        // );
        // const latestBlockNumber = await evmChainAdapter.getLatestBlockNumber();
        // const blockData = await evmChainAdapter.getBlockData(latestBlockNumber);
        // expect(latestBlockNumber).greaterThan(0);
        // expect(blockData).not.equal(null);
      } else if (item.family === ChainFamilies.solana) {
        const solanaChainAdapter = new SolanaChainAdapter(
          {
            memcache: memcache,
            database: database,
          },
          item,
        );

        const latestBlockNumber = await solanaChainAdapter.getLatestBlockNumber();
        const blockData = await solanaChainAdapter.getBlockData(278004416);

        expect(latestBlockNumber).greaterThan(0);
        expect(blockData).not.equal(null);
      }
    }),
  );
});
