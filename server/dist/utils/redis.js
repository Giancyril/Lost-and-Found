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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class RedisClient {
    constructor() {
        this.client = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 100, 3000),
            lazyConnect: true,
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.connect();
                console.log('✅ Redis connected successfully');
            }
            catch (error) {
                console.error('❌ Redis connection failed:', error);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.disconnect();
                console.log('✅ Redis disconnected successfully');
            }
            catch (error) {
                console.error('❌ Redis disconnection failed:', error);
                throw error;
            }
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const value = yield this.client.get(key);
                return value;
            }
            catch (error) {
                console.error(`❌ Redis GET error for key ${key}:`, error);
                return null;
            }
        });
    }
    set(key, value, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.set(key, value, 'EX', ttl || 3600); // Default 1 hour TTL
                console.log(`✅ Redis SET: ${key}`);
            }
            catch (error) {
                console.error(`❌ Redis SET error for key ${key}:`, error);
                throw error;
            }
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.del(key);
                console.log(`✅ Redis DEL: ${key}`);
            }
            catch (error) {
                console.error(`❌ Redis DEL error for key ${key}:`, error);
                throw error;
            }
        });
    }
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const exists = yield this.client.exists(key);
                return exists === 1;
            }
            catch (error) {
                console.error(`❌ Redis EXISTS error for key ${key}:`, error);
                return false;
            }
        });
    }
    mget(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const values = yield this.client.mget(keys);
                return values;
            }
            catch (error) {
                console.error('❌ Redis MGET error:', error);
                return keys.map(() => null);
            }
        });
    }
    mset(keyValuePairs) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pipeline = this.client.pipeline();
                keyValuePairs.forEach(({ key, value }) => pipeline.set(key, value));
                yield pipeline.exec();
                console.log(`✅ Redis MSET: ${keyValuePairs.length} keys`);
            }
            catch (error) {
                console.error('❌ Redis MSET error:', error);
                throw error;
            }
        });
    }
    expire(key, seconds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.expire(key, seconds);
                console.log(`✅ Redis EXPIRE: ${key} in ${seconds}s`);
            }
            catch (error) {
                console.error(`❌ Redis EXPIRE error for key ${key}:`, error);
                throw error;
            }
        });
    }
}
exports.RedisClient = RedisClient;
exports.default = RedisClient;
