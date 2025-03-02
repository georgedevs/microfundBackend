"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
const connectRedis = () => {
    try {
        if (process.env.REDIS_URL) {
            const redisClient = new ioredis_1.Redis(process.env.REDIS_URL);
            console.log("Redis Connected");
            return redisClient;
        }
        throw new Error('Redis URL not found in environment variables');
    }
    catch (error) {
        console.error('Redis connection failed:', error);
        throw new Error('Redis connection failed');
    }
};
exports.redis = connectRedis();
exports.default = connectRedis;
