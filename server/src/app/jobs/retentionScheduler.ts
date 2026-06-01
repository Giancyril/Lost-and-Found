import cron from "node-cron";
import { retentionService } from "../modules/retention/retention.service";

/**
 * Retention Policy Scheduler
 * 
 * This scheduler runs two jobs:
 * 1. Weekly deletion report: Sends a report to admins every Monday at 9:00 AM
 * 2. Daily purge job: Permanently deletes expired items every day at 2:00 AM
 */

/**
 * Weekly deletion report job
 * Runs every Monday at 9:00 AM
 * Sends a report to admins listing items that will be permanently deleted within 7 days
 */
export const startWeeklyDeletionReport = () => {
  // Cron format: minute hour day-of-month month day-of-week
  // "0 9 * * 1" = Every Monday at 9:00 AM
  cron.schedule("0 9 * * 1", async () => {
    console.log("[RetentionScheduler] Running weekly deletion report job...");
    try {
      await retentionService.sendWeeklyDeletionReport();
      console.log("[RetentionScheduler] Weekly deletion report sent successfully");
    } catch (error) {
      console.error("[RetentionScheduler] Failed to send weekly deletion report:", error);
    }
  });

  console.log("[RetentionScheduler] Weekly deletion report job scheduled (Every Monday at 9:00 AM)");
};

/**
 * Daily purge job
 * Runs every day at 2:00 AM
 * Permanently deletes items that have exceeded the grace period
 */
export const startDailyPurgeJob = () => {
  // Cron format: minute hour day-of-month month day-of-week
  // "0 2 * * *" = Every day at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("[RetentionScheduler] Running daily purge job...");
    try {
      const results = await retentionService.purgeExpiredItems();
      console.log(
        `[RetentionScheduler] Purge completed: ${results.foundItems} found items, ${results.lostItems} lost items, ${results.claims} claims deleted`
      );
    } catch (error) {
      console.error("[RetentionScheduler] Failed to purge expired items:", error);
    }
  });

  console.log("[RetentionScheduler] Daily purge job scheduled (Every day at 2:00 AM)");
};

/**
 * Start all retention policy jobs
 */
export const startRetentionScheduler = () => {
  console.log("[RetentionScheduler] Starting retention policy scheduler...");
  startWeeklyDeletionReport();
  startDailyPurgeJob();
  console.log("[RetentionScheduler] All retention policy jobs started");
};
