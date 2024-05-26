export interface ICachingService {
  name: string;
  getCachingData: (name: string) => Promise<any>;
  setCachingData: (name: string, data: any) => Promise<void>;
}

export interface IMemcacheService extends ICachingService {
  // number of seconds
  expiration: number;
}
