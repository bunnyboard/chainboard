import { getTimestamp } from '../../lib/utils';
import { IMemcacheService } from './domains';

export class MemcacheService implements IMemcacheService {
  public readonly name: string = 'caching';
  public readonly expiration: number;

  private readonly _memories: { [key: string]: any } = {};

  constructor(_expiration: number) {
    this.expiration = _expiration;
  }

  public async getCachingData(name: string): Promise<any> {
    const timestamp = getTimestamp();
    if (this._memories[name] && this._memories[name].expiredTime && this._memories[name].expiredTime > timestamp) {
      return this._memories[name].data;
    }

    return null;
  }

  public async setCachingData(name: string, data: any): Promise<void> {
    const expiredTime = getTimestamp() + this.expiration;
    this._memories[name] = {
      data: data,
      expiredTime: expiredTime,
    };
  }
}
