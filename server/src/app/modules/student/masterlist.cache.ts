// src/modules/student/masterlist.cache.ts
// Thin wrapper around Redis for the student masterlist.
//
// Data layout
// ───────────
//   Key   : "masterlist"
//   Value : JSON-serialised StudentRow[]
//   TTL   : 7 hours  (background job refreshes every 6 h, so there is
//                     always a valid copy even if one sync run is delayed)
//
// The cache module is intentionally side-effect-free: it never fetches
// from Gviz itself — that is the sync job's responsibility.
//
// Redis is OPTIONAL — all functions gracefully handle null client.

import redisClient, { isRedisConnected } from "../../config/redis";

const CACHE_KEY = "masterlist";
const TTL_SECONDS = 7 * 60 * 60; // 7 hours

export interface StudentRow {
  id: string;
  email: string;
  name: string;
  course: string;
  department: string;
  yearLevel: string;
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Persist a fresh masterlist into Redis.
 * Called exclusively by the sync job.
 */
export const setMasterlistCache = async (rows: StudentRow[]): Promise<void> => {
  if (!redisClient || !isRedisConnected()) {
    console.log("[Cache] Redis not available - skipping cache write");
    return;
  }

  try {
    await redisClient.set(CACHE_KEY, JSON.stringify(rows), { EX: TTL_SECONDS });
    console.log(`[Cache] Masterlist stored – ${rows.length} students, TTL ${TTL_SECONDS}s`);
  } catch (err) {
    // Log but don't crash; the service will fall back to Gviz
    console.error("[Cache] Failed to write masterlist to Redis:", err);
  }
};

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Return the cached masterlist, or `null` if the cache is empty / expired.
 */
export const getMasterlistCache = async (): Promise<StudentRow[] | null> => {
  if (!redisClient || !isRedisConnected()) {
    return null; // No Redis = cache miss = fall back to Gviz
  }

  try {
    const raw = await redisClient.get(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudentRow[];
  } catch (err) {
    console.error("[Cache] Failed to read masterlist from Redis:", err);
    return null; // treat a broken cache as a miss → fall back to Gviz
  }
};

// ── Invalidate ────────────────────────────────────────────────────────────────

/**
 * Delete the cached masterlist.
 * Useful for admin-triggered forced refreshes.
 */
export const invalidateMasterlistCache = async (): Promise<void> => {
  if (!redisClient || !isRedisConnected()) {
    console.log("[Cache] Redis not available - skipping cache invalidation");
    return;
  }

  try {
    await redisClient.del(CACHE_KEY);
    console.log("[Cache] Masterlist cache invalidated");
  } catch (err) {
    console.error("[Cache] Failed to invalidate masterlist cache:", err);
  }
};

// ── Stats ─────────────────────────────────────────────────────────────────────

/**
 * Returns basic info about the current cache state.
 * Exposed via an admin endpoint so you can monitor without Redis CLI.
 */
export const getMasterlistCacheStats = async () => {
  if (!redisClient || !isRedisConnected()) {
    return { 
      cached: false, 
      ttlSeconds: -1, 
      studentCount: 0, 
      expiresAt: null,
      redisAvailable: false 
    };
  }

  try {
    const ttl = await redisClient.ttl(CACHE_KEY);
    const raw = await redisClient.get(CACHE_KEY);
    const count = raw ? (JSON.parse(raw) as StudentRow[]).length : 0;
    return {
      cached: ttl > 0,
      ttlSeconds: ttl,
      studentCount: count,
      expiresAt: ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : null,
      redisAvailable: true
    };
  } catch {
    return { 
      cached: false, 
      ttlSeconds: -1, 
      studentCount: 0, 
      expiresAt: null,
      redisAvailable: false 
    };
  }
};