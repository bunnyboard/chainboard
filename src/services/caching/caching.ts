import { ICachingService } from './domains';

// caching level: memory
export class CachingService implements ICachingService {
  public readonly name: string = 'caching';

  private readonly _memories: { [key: string]: any } = {};

  constructor() {}

  public async getCachingData(name: string): Promise<any> {
    // get data from memory
    if (this._memories[name]) {
      return this._memories[name];
    }

    return null;
  }

  public async setCachingData(name: string, data: any): Promise<void> {
    this._memories[name] = data;
  }
}
