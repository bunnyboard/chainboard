import envConfig from '../configs/envConfig';
import logger from '../lib/logger';

export function verifyConfigs() {
  if (envConfig.mongodb.connectionUri === '' || envConfig.mongodb.databaseName === '') {
    logger.error('invalid mongodb configs', {});
    process.exit(1);
  }
}
