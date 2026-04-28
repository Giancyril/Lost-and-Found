"use strict";
/**
 * Google Sheets Logging Service
 * Handles logging lost and found items to Google Sheets via Google Apps Script Webhook
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSheetsConfig = exports.logToSheet = void 0;
const SHEET_ID = "1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI";
const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
const logToSheet = (data) => __awaiter(void 0, void 0, void 0, function* () {
    if (!WEBHOOK_URL) {
        console.warn("GOOGLE_SHEETS_WEBHOOK_URL is not defined in backend environment");
        return;
    }
    try {
        const response = yield fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`Google Sheets webhook responded with status: ${response.status}`);
        }
        console.log(`Successfully logged to ${data.sheetName} sheet`);
    }
    catch (error) {
        console.error(`Error logging to Google Sheets (${data.sheetName}):`, error);
        throw error;
    }
});
exports.logToSheet = logToSheet;
const getSheetsConfig = () => ({
    sheetId: SHEET_ID,
    webhookUrl: WEBHOOK_URL,
    isEnabled: !!WEBHOOK_URL,
});
exports.getSheetsConfig = getSheetsConfig;
