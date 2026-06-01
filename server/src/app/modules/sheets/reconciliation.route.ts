import express from "express";
import { reconciliationController } from "./reconciliation.controller";
import auth from "../../midddlewares/auth";

const router = express.Router();

// All reconciliation routes require admin authentication
router.get("/status", auth(), reconciliationController.getReconciliationStatus);
router.post("/resync", auth(), reconciliationController.resyncMissingItems);
router.post("/trigger", auth(), reconciliationController.triggerWeeklyReport);

export const reconciliationRoutes = router;
