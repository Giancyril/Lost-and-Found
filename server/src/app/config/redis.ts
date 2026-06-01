// src/config/redis.ts
// Redis client — shared singleton used by the masterlist cache and any
// other modules that need fast in-memory storage.
//
// Redis v5 (already in package.json) uses the "createClient" API.
// The client is lazy-connected: call `connectRedis()` once at server startup
// (in server.ts / app.ts) before anything tries to use it.
//
// Redis is OPTIONAL — if connection fails, the system gracefully falls back
// to Google Sheets Gviz API for all student lookups.

import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;
let isRedisAvailable = false;

// Only create Redis client if REDIS_URL is provided
if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        // Limit reconnect attempts to 3 for faster failure
        if (retries > 3) {
          console.warn("[Redis] Connection failed - falling back to Google Sheets");
          return new Error("Redis unavailable");
        }
        return Math.min(retries * 500, 2000);
      },
    },
  });

  redisClient.on("connect", () => {
    console.log("[Redis] Connected ✓ - Using cache for student lookups");
    isRedisAvailable = true;
  });
  
  redisClient.on("reconnecting", () => {
    console.warn("[Redis] Reconnecting…");
    isRedisAvailable = false;
  });
  
  redisClient.on("error", (err) => {
    console.warn("[Redis] Error:", err.message, "- Falling back to Google Sheets");
    isRedisAvailable = false;
  });
} else {
  console.log("[Redis] REDIS_URL not configured - Using Google Sheets only");
}

export const connectRedis = async () => {
  if (!redisClient) {
    console.log("[Redis] Skipping connection (not configured)");
    return;
  }

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      isRedisAvailable = true;
    }
  } catch (error) {
    console.warn("[Redis] Connection failed - System will use Google Sheets fallback");
    isRedisAvailable = false;
    // Don't throw - allow server to start without Redis
  }
};

export const isRedisConnected = () => isRedisAvailable && redisClient?.isOpen;

export default redisClient;