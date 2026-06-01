// src/modules/student/masterlist.sync.ts
// Background job: pulls the masterlist from Google Sheets (Gviz) every 6 hours
// and writes the result into Redis via the cache module.
//
// Uses node-cron (already in package.json). Call `startMasterlistSync()` once
// during server startup — it runs an immediate warm-up fetch, then schedules
// the recurring job.

import cron from "node-cron";
import { setMasterlistCache } from "./masterlist.cache";

// ── Config ────────────────────────────────────────────────────────────────────

const SHEET_ID         = "1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI";
const MASTERLIST_SHEET = "Copy of Master List";
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(MASTERLIST_SHEET)}`;

// Every 6 hours: at minute 0 of hours 0, 6, 12, 18
const CRON_SCHEDULE = "0 0,6,12,18 * * *";

// ── Gviz helpers (duplicated here so the sync job has no circular deps) ───────

interface StudentRow {
  id: string;
  email: string;
  name: string;
  course: string;
  department: string;
  yearLevel: string;
}

const parseRow = (row: any): StudentRow => {
  const id        = String(row.c[0]?.v ?? "").trim();
  const email     = String(row.c[1]?.v ?? "").trim();
  const name      = String(row.c[2]?.v ?? "").trim();
  const course    = String(row.c[3]?.v ?? "").trim();
  const yearLevel = String(row.c[4]?.v ?? "").trim();
  return { id, email, name, course, department: course, yearLevel };
};

const parseGvizResponse = (data: string): StudentRow[] => {
  const jsonStr = data.substring(data.indexOf("(") + 1, data.lastIndexOf(")"));
  const json    = JSON.parse(jsonStr);
  return (json.table.rows as any[]).filter(r => r.c && r.c[0]?.v).map(parseRow);
};

// ── Core fetch ────────────────────────────────────────────────────────────────

/**
 * Fetch the full masterlist from Gviz and push it into Redis.
 * Safe to call manually (e.g. from an admin "force refresh" endpoint).
 */
export const syncMasterlistNow = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  console.log("[Sync] Fetching masterlist from Google Sheets…");
  try {
    const response = await fetch(GVIZ_URL);
    if (!response.ok) {
      throw new Error(`Gviz responded with HTTP ${response.status}`);
    }
    const rows = parseGvizResponse(await response.text());
    await setMasterlistCache(rows);
    console.log(`[Sync] ✓ Masterlist synced – ${rows.length} students`);
    return { success: true, count: rows.length };
  } catch (err: any) {
    console.error("[Sync] ✗ Masterlist sync failed:", err.message);
    // Do NOT throw — a failed sync must not crash the server.
    // The existing cache (if any) stays valid until its TTL expires.
    return { success: false, count: 0, error: err.message };
  }
};

// ── Scheduler ─────────────────────────────────────────────────────────────────

/**
 * Call once at server startup.
 *
 *  1. Runs an immediate sync so Redis is warm before the first request arrives.
 *  2. Schedules the recurring 6-hour cron job.
 */
export const startMasterlistSync = (): void => {
  // 1 — Warm-up (async, does not block startup)
  syncMasterlistNow().then(result => {
    if (!result.success) {
      console.warn("[Sync] Warm-up failed – scanner will fall back to Gviz on first requests.");
    }
  });

  // 2 — Recurring job
  cron.schedule(CRON_SCHEDULE, async () => {
    await syncMasterlistNow();
  });

  console.log(`[Sync] Masterlist sync scheduled (${CRON_SCHEDULE})`);
};