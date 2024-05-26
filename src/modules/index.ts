import EnvConfig from '../configs/envConfig';
import { ContextStorages, IChainAdapter } from '../types/namespaces';
import EvmChainAdapter from './adapters/evm';

export default function getAdapter(storages: ContextStorages, chain: string): IChainAdapter | null {
  switch (chain) {
    case 'ethereum': {
      return new EvmChainAdapter(storages, EnvConfig.blockchains[chain]);
    }
  }

  return null;
}
