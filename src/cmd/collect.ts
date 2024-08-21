import { DefaultServiceInterval } from '../configs';
import EnvConfig from '../configs/envConfig';
import { sleep } from '../lib/utils';
import AptosChainAdapter from '../modules/aptos';
import EvmChainAdapter from '../modules/evm';
import { ChainFamilies } from '../types/configs';
import { ContextStorages, IChainAdapter } from '../types/namespaces';
import { BasicCommand } from './basic';
import { verifyConfigs } from './configs';

export class CollectCommand extends BasicCommand {
  public readonly name: string = 'collect';
  public readonly describe: string = 'Run blockchain data collector services';

  constructor() {
    super();
  }

  public async execute(argv: any) {
    verifyConfigs();

    const storages: ContextStorages = await super.getStorages();

    const chains = argv.chain.split(',');
    for (const chain of chains) {
      if (!EnvConfig.blockchains[chain]) {
        console.log(`Chain ${chain} config not found!`);
        process.exit(0);
      }
    }

    do {
      for (const chain of chains) {
        const config = EnvConfig.blockchains[chain];

        let adapter: IChainAdapter;
        switch (config.family) {
          case ChainFamilies.evm: {
            adapter = new EvmChainAdapter(storages, EnvConfig.blockchains[chain]);
            break;
          }
          // case ChainFamilies.solana: {
          //   adapter = new SolanaChainAdapter(storages, EnvConfig.blockchains[chain]);
          //   break;
          // }
          // case ChainFamilies.sui: {
          //   adapter = new SuiChainAdapter(storages, EnvConfig.blockchains[chain]);
          //   break;
          // }
          case ChainFamilies.aptos: {
            adapter = new AptosChainAdapter(storages, EnvConfig.blockchains[chain]);
            break;
          }
          default: {
            console.log(`Adapter not found for chain ${chain}`);
            process.exit(0);
          }
        }

        await adapter.run({
          fromBlock: argv.fromBlock ? Number(argv.fromBlock) : undefined,
          force: argv.force ? argv.force : undefined,
        });
      }

      if (argv.exit) {
        process.exit(0);
      }

      await sleep(argv.sleep);
    } while (!argv.exit);

    process.exit(0);
  }

  public setOptions(yargs: any) {
    return yargs.option({
      chain: {
        type: 'string',
        default: '',
        describe:
          'Collect all protocols data on given list of chain seperated by comma, ex: --chain "ethereum,arbitrum"',
      },
      fromBlock: {
        type: 'number',
        default: 0,
        describe: 'Collect data from given block number.',
      },
      force: {
        type: 'boolean',
        default: false,
        describe: 'Force collect data from given from block number.',
      },

      exit: {
        type: 'boolean',
        default: false,
        describe: 'Do not run services as workers.',
      },
      sleep: {
        type: 'number',
        default: DefaultServiceInterval, // 5 minutes
        describe: 'Given amount of seconds to sleep after every sync round. Default is 5 minutes.',
      },
    });
  }
}
