"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sheets_controller_1 = require("./sheets.controller");
const router = (0, express_1.Router)();
// POST /api/sheets/log - Log data to Google Sheets
router.post("/log", sheets_controller_1.logToSheetsController);
// GET /api/sheets/config - Get sheets configuration
router.get("/config", sheets_controller_1.getSheetsConfigController);
exports.default = router;
