"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectRedis = exports.getRedisClient = exports.initializeRedis = void 0;
const redis_1 = require("redis");
let redisClient = null;
const initializeRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        redisClient = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                connectTimeout: 5000
            }
        });
        redisClient.on('error', (error) => {
            console.error('Redis Client Error:', error);
        });
        redisClient.on('connect', () => {
            console.log('Redis Client Connected');
        });
        yield redisClient.connect();
        return redisClient;
    }
    catch (error) {
        console.error('Failed to initialize Redis:', error);
        return null;
    }
});
exports.initializeRedis = initializeRedis;
const getRedisClient = () => {
    return redisClient;
};
exports.getRedisClient = getRedisClient;
const disconnectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    if (redisClient) {
        yield redisClient.disconnect();
        redisClient = null;
    }
});
exports.disconnectRedis = disconnectRedis;
