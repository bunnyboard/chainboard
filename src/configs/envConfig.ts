import fs from 'fs';
import tomlJson from 'toml-json';

import { EnvConfig } from '../types/configs';

const configPath = './configs.toml';

let rawConfigs: any = null;
if (fs.existsSync(configPath)) {
  try {
    rawConfigs = tomlJson({ fileUrl: configPath });
  } catch (e: any) {
    rawConfigs = null;
  }
}

if (!rawConfigs) {
  console.log('Missing configs.json file. Check configs.example.toml for more details!');
  process.exit(0);
}

const MongodbPrefix = 'board';
const envConfig: EnvConfig = {
  mongodb: {
    connectionUri: rawConfigs.database.connectionUri,
    databaseName: rawConfigs.database.databaseName,
    collections: {
      blockchainDataBlocks: {
        name: `${MongodbPrefix}.blockchainDataBlocks`,
        indies: [
          {
            chain: 1,
            number: 1,
          },
          {
            chain: 1,
            timestamp: 1,
          },
        ],
      },
    },
  },
  blockchains: rawConfigs.blockchains,
};

export default envConfig;
