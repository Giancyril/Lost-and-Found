"use strict";
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
exports.getSheetsConfigController = exports.logToSheetsController = void 0;
const sheets_service_1 = require("./sheets.service");
const http_status_codes_1 = require("http-status-codes");
const logToSheetsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logData = req.body;
        // Validate required fields
        const requiredFields = ['sheetName', 'reporterName', 'itemName', 'location', 'date', 'type', 'reportId'];
        for (const field of requiredFields) {
            if (!logData[field]) {
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `Missing required field: ${field}`
                });
            }
        }
        // Validate sheetName
        if (!['Lost Items', 'Found Items'].includes(logData.sheetName)) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Invalid sheetName. Must be "Lost Items" or "Found Items"'
            });
        }
        // Validate type matches sheetName
        if (logData.sheetName === 'Lost Items' && logData.type !== 'LOST') {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Type must be "LOST" for "Lost Items" sheet'
            });
        }
        if (logData.sheetName === 'Found Items' && logData.type !== 'FOUND') {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Type must be "FOUND" for "Found Items" sheet'
            });
        }
        yield (0, sheets_service_1.logToSheet)(logData);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: `Successfully logged to ${logData.sheetName} sheet`
        });
    }
    catch (error) {
        console.error('Sheets logging error:', error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to log to Google Sheets',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
exports.logToSheetsController = logToSheetsController;
const getSheetsConfigController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = (0, sheets_service_1.getSheetsConfig)();
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: {
                isEnabled: config.isEnabled,
                sheetId: config.sheetId
                // Don't expose webhook URL in response
            }
        });
    }
    catch (error) {
        console.error('Error getting sheets config:', error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get sheets configuration'
        });
    }
});
exports.getSheetsConfigController = getSheetsConfigController;
