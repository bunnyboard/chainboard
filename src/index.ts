import dotenv from 'dotenv';
import yargs from 'yargs/yargs';

import { CollectCommand } from './cmd/collect';

(async function () {
  dotenv.config();

  const collectCommand = new CollectCommand();

  yargs(process.argv.slice(2))
    .scriptName('chainboard')
    .command(collectCommand.name, collectCommand.describe, collectCommand.setOptions, collectCommand.execute)
    .help().argv;
})();
