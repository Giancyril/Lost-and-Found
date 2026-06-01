import express from "express";
import { retentionController } from "./retention.controller";
import auth from "../../midddlewares/auth";

const router = express.Router();

// All retention policy routes require admin authentication
// Note: Admin role checking is handled by the auth middleware and controller logic
router.get("/pending", auth(), retentionController.getItemsPendingDeletion);
router.get("/report/download", auth(), retentionController.downloadDeletionReport);
router.post("/purge", auth(), retentionController.purgeExpiredItems);
router.post("/restore", auth(), retentionController.restoreItem);
router.post("/report/send", auth(), retentionController.sendWeeklyReport);

export const retentionRoutes = router;
