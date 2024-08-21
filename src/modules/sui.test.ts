// import { expect, test } from 'vitest';
// import envConfig from '../configs/envConfig';
// import { MemcacheService } from '../services/caching/memcache';
// import DatabaseService from '../services/database/database';
// import { DefaultMemcacheTime } from '../configs';
// import SuiChainAdapter from './sui';
// import { ChainFamilies } from '../types/configs';

// const memcache = new MemcacheService(DefaultMemcacheTime);
// const database = new DatabaseService();

// test('should get block data correctly chain sui', async function () {
//   const evmChainAdapter = new SuiChainAdapter(
//     {
//       memcache: memcache,
//       database: database,
//     },
//     envConfig.blockchains.sui,
//   );
//   const latestBlockNumber = await evmChainAdapter.getLatestBlockNumber();
//   expect(latestBlockNumber).greaterThan(0);

//   const blockData = await evmChainAdapter.getBlockData(39565698);
//   expect(blockData).not.equal(null);
//   if (blockData) {
//     console.log(blockData);
//     expect(blockData.chain).equal('sui');
//     expect(blockData.family).equal(ChainFamilies.sui);
//     expect(blockData.number).equal(39565698);
//     expect(blockData.timestamp).equal(1721217131);
//     expect(blockData.size).equal(undefined);
//     expect(blockData.transactions).equal(22);
//   }
// });
