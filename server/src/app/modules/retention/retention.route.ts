import express from "express";
import { retentionController } from "./retention.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

// All retention policy routes require admin authentication
router.use(auth("ADMIN"));

// Get items pending deletion
router.get("/pending", retentionController.getItemsPendingDeletion);

// Download CSV report
router.get("/report/download", retentionController.downloadDeletionReport);

// Manually trigger purge
router.post("/purge", retentionController.purgeExpiredItems);

// Restore a soft-deleted item
router.post("/restore", retentionController.restoreItem);

// Manually send weekly report
router.post("/report/send", retentionController.sendWeeklyReport);

export const retentionRoutes = router;
