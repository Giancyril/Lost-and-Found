import Redis from 'ioredis';

export class RedisClient {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000), 
      lazyConnect: true,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      console.log('✅ Redis disconnected successfully');
    } catch (error) {
      console.error('❌ Redis disconnection failed:', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (error) {
      console.error(`❌ Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.client.set(key, value, 'EX', ttl || 3600); // Default 1 hour TTL
      console.log(`✅ Redis SET: ${key}`);
    } catch (error) {
      console.error(`❌ Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
      console.log(`✅ Redis DEL: ${key}`);
    } catch (error) {
      console.error(`❌ Redis DEL error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error(`❌ Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      const values = await this.client.mget(keys);
      return values;
    } catch (error) {
      console.error('❌ Redis MGET error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Array<{key: string, value: any}>): Promise<void> {
    try {
      const pipeline = this.client.pipeline();
      keyValuePairs.forEach(({ key, value }) => pipeline.set(key, value));
      await pipeline.exec();
      console.log(`✅ Redis MSET: ${keyValuePairs.length} keys`);
    } catch (error) {
      console.error('❌ Redis MSET error:', error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
      console.log(`✅ Redis EXPIRE: ${key} in ${seconds}s`);
    } catch (error) {
      console.error(`❌ Redis EXPIRE error for key ${key}:`, error);
      throw error;
    }
  }
}

export default RedisClient;
