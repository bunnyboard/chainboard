import fs from 'fs';

import { EnvConfig } from '../types/configs';

const configPath = './configs.json';

let rawConfigs: any = null;
if (fs.existsSync(configPath)) {
  try {
    rawConfigs = JSON.parse(fs.readFileSync(configPath).toString());
  } catch (e: any) {
    rawConfigs = null;
  }
}

if (!rawConfigs) {
  console.log('Missing configs.json file. Check configs.example.json for more details!');
  process.exit(0);
}

const envConfig: EnvConfig = {
  mongodb: {
    connectionUri: rawConfigs.database.connectionUri,
    databaseName: rawConfigs.database.databaseName,
    collections: {
      cachingStates: {
        name: 'cachingStates',
        indies: [
          {
            name: 1,
          },
        ],
      },

      rawdataBlockData: {
        name: 'rawdataBlockData',
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

      chainDataStates: {
        name: 'chainDataStates',
        indies: [
          {
            chain: 1,
          },
        ],
      },
      chainDataSnapshots: {
        name: 'chainDataSnapshots',
        indies: [
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
