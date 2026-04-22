import { Router } from "express";
import { logToSheetsController, getSheetsConfigController } from "./sheets.controller";

const router = Router();

// POST /api/sheets/log - Log data to Google Sheets
router.post("/log", logToSheetsController);

// GET /api/sheets/config - Get sheets configuration
router.get("/config", getSheetsConfigController);

export default router;
