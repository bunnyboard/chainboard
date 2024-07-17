import { expect, test } from 'vitest';
import envConfig from '../configs/envConfig';
import { MemcacheService } from '../services/caching/memcache';
import DatabaseService from '../services/database/database';
import { DefaultMemcacheTime } from '../configs';
import EvmChainAdapter from './evm';
import { ChainFamilies } from '../types/configs';
import SolanaChainAdapter from './solana';

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
    expect(blockData.number).equal(20324875);
    expect(blockData.timestamp).equal(1721202755);
    expect(blockData.size).equal(87853);
    expect(blockData.totalCoinTransfer).equal('118.589464196681790992');
    expect(blockData.totalBaseFees).equal('0.121615809895338528');
    expect(blockData.transactions).equal(173);
  }
});

test('should get block data correctly chain arbitrum', async function () {
  const evmChainAdapter = new EvmChainAdapter(
    {
      memcache: memcache,
      database: database,
    },
    envConfig.blockchains.arbitrum,
  );
  const latestBlockNumber = await evmChainAdapter.getLatestBlockNumber();
  expect(latestBlockNumber).greaterThan(0);

  const blockData = await evmChainAdapter.getBlockData(233088189);
  expect(blockData).not.equal(null);
  if (blockData) {
    expect(blockData.chain).equal('arbitrum');
    expect(blockData.family).equal(ChainFamilies.evm);
    expect(blockData.number).equal(233088189);
    expect(blockData.timestamp).equal(1721203632);
    expect(blockData.size).equal(4064);
    expect(blockData.totalCoinTransfer).equal('0.003130812223826');
    expect(blockData.totalBaseFees).equal('0.00001273156');
    expect(blockData.transactions).equal(8);
    expect(blockData.gasLimit).equal(1125899906842624);
    expect(blockData.gasUsed).equal(1273156);
  }
});

test('should get block data correctly chain solana', async function () {
  const evmChainAdapter = new SolanaChainAdapter(
    {
      memcache: memcache,
      database: database,
    },
    envConfig.blockchains.solana,
  );
  const latestBlockNumber = await evmChainAdapter.getLatestBlockNumber();
  expect(latestBlockNumber).greaterThan(0);

  const blockData = await evmChainAdapter.getBlockData(257265854);
  expect(blockData).not.equal(null);

  if (blockData) {
    expect(blockData.chain).equal('solana');
    expect(blockData.family).equal(ChainFamilies.solana);
    expect(blockData.number).equal(257265854);
    expect(blockData.timestamp).equal(1711765475);
    expect(blockData.size).equal(undefined);
    expect(blockData.totalCoinTransfer).equal('1730.20364196');
    expect(blockData.totalBaseFees).equal('0.57702702');
    expect(blockData.transactions).equal(1362);
    expect(blockData.gasLimit).equal(48000000);
    expect(blockData.gasUsed).equal(35169985);
  }
});
