import logger from '../lib/logger';
import { getTimestamp } from '../lib/utils';

export default class ExecuteSession {
  private _sessionStart: number = 0;

  public startSessionMuted() {
    this._sessionStart = getTimestamp();
  }

  public startSession(message: string, props: any) {
    this._sessionStart = getTimestamp();

    logger.info(message, props);
  }

  public endSession(message: string, props: any) {
    const endExeTime = Math.floor(new Date().getTime() / 1000);
    const elapsed = endExeTime - this._sessionStart;

    logger.info(message, {
      ...props,
      elapses: `${elapsed}s`,
    });

    // reset session
    this._sessionStart = 0;
  }
}
