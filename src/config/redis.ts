import { Redis } from 'ioredis';

const connectRedis = (): Redis => {
  try {
    if (process.env.REDIS_URL) {
      const redisClient = new Redis(process.env.REDIS_URL);
      console.log("Redis Connected");
      return redisClient;
    }
    throw new Error('Redis URL not found in environment variables');
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw new Error('Redis connection failed');
  }
};


export const redis = connectRedis();

export default connectRedis;