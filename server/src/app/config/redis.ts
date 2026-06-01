// src/config/redis.ts
// Redis client — shared singleton used by the masterlist cache and any
// other modules that need fast in-memory storage.
//
// Redis v5 (already in package.json) uses the "createClient" API.
// The client is lazy-connected: call `connectRedis()` once at server startup
// (in server.ts / app.ts) before anything tries to use it.

import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential back-off capped at 30 s; give up after 10 attempts
      if (retries > 10) {
        console.error("[Redis] Too many reconnect attempts – giving up.");
        return new Error("Redis reconnect limit reached");
      }
      return Math.min(retries * 200, 30_000);
    },
  },
});

redisClient.on("connect",     () => console.log("[Redis] Connected ✓"));
redisClient.on("reconnecting",() => console.warn("[Redis] Reconnecting…"));
redisClient.on("error",  (err) => console.error("[Redis] Error:", err.message));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export default redisClient;