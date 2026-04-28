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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lostItemController = void 0;
const response_1 = __importDefault(require("../../global/response"));
const http_status_codes_1 = require("http-status-codes");
const lostItem_service_1 = require("./lostItem.service");
const utils_1 = require("../../utils/utils");
const match_service_1 = require("../matching/match.service");
const mailer_1 = require("../../utils/mailer");
const emailTemplates_1 = require("../../utils/emailTemplates");
const sheets_service_1 = require("../sheets/sheets.service");
const toggleFoundStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.body;
        const result = yield lostItem_service_1.lostTItemServices.toggleFoundStatus(id);
        const message = result.isFound
            ? "Item marked as found successfully"
            : "Item marked as not found successfully";
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message,
            data: result,
        });
    }
    catch (error) {
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: error === null || error === void 0 ? void 0 : error.message,
            data: null,
        });
    }
});
const createLostItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const item = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const result = yield lostItem_service_1.lostTItemServices.createLostItem(userId, item);
        if (result === null || result === void 0 ? void 0 : result.id) {
            // Log to Google Sheets
            try {
                const reportTimestamp = new Date().toISOString();
                const studentId = req.body.studentId ||
                    (req.body.schoolEmail ? req.body.schoolEmail.split("@")[0] : "N/A");
                yield (0, sheets_service_1.logToSheet)({
                    sheetName: "Lost Items",
                    timestamp: reportTimestamp,
                    studentId: studentId,
                    reporterName: req.body.reporterName || "SAS Office",
                    email: req.body.schoolEmail || "N/A",
                    itemName: req.body.lostItemName,
                    description: req.body.description || "",
                    location: req.body.location,
                    date: req.body.date,
                    type: "LOST",
                    reportId: result.id.toString(),
                    scannedAt: reportTimestamp
                });
                console.log("[Sheets] Lost item logged to Google Sheets:", result.id);
            }
            catch (sheetsError) {
                console.error("[Sheets] Failed to log lost item to Google Sheets:", sheetsError);
            }
            // Send confirmation email to the reporter
            try {
                const fromName = process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";
                const fromEmail = process.env.SMTP_FROM_EMAIL || "mijaresgiancyril@gmail.com";
                const template = (0, emailTemplates_1.lostItemReportedTemplate)({
                    reporterName: req.body.reporterName || "Unknown",
                    itemName: req.body.lostItemName,
                    location: req.body.location,
                    date: new Date(req.body.date).toLocaleDateString(),
                    description: req.body.description,
                });
                yield (0, mailer_1.sendEmail)({
                    fromName,
                    fromEmail,
                    toEmail: req.body.schoolEmail,
                    subject: template.subject,
                    html: template.html,
                });
                console.log("[Email] Lost item confirmation sent to:", req.body.schoolEmail);
            }
            catch (emailError) {
                console.error("[Email] Failed to send lost item confirmation:", emailError);
            }
            match_service_1.matchService.findMatchesForLostItem(result).catch((err) => console.error("[SmartMatch] Error matching lost item:", err));
        }
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.CREATED,
            success: true,
            message: "Lost items created successfully",
            data: result,
        });
    }
    catch (error) {
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: error === null || error === void 0 ? void 0 : error.message,
            data: null,
        });
    }
});
const getLostItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ── EGRESS FIX: cache public list for 60 seconds ──────────────────────────
        res.set("Cache-Control", "public, max-age=60");
        const meta = yield utils_1.utils.calculateMeta(Object.assign(Object.assign({}, req.query), { itemType: 'lost' }));
        const result = yield lostItem_service_1.lostTItemServices.getLostItem(req.query);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Lost items retrieved successfully",
            meta,
            data: result,
        });
    }
    catch (error) {
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: error === null || error === void 0 ? void 0 : error.message,
            data: null,
        });
    }
});
const getAllLostItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const meta = yield utils_1.utils.calculateMeta(Object.assign(Object.assign({}, req.query), { itemType: 'lost' }));
        const result = yield lostItem_service_1.lostTItemServices.getAllLostItems(req.query);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "All lost items retrieved successfully",
            meta,
            data: result,
        });
    }
    catch (error) {
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: error === null || error === void 0 ? void 0 : error.message,
            data: null,
        });
    }
});
const getSingleLostItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req === null || req === void 0 ? void 0 : req.params.id;
        const result = yield lostItem_service_1.lostTItemServices.getSingleLostItem(id);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Lost item retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: error === null || error === void 0 ? void 0 : error.message,
            data: null,
        });
    }
});
const getMyLostItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield lostItem_service_1.lostTItemServices.getMyLostItem(req.user);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Lost item retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: error === null || error === void 0 ? void 0 : error.message,
            data: null,
        });
    }
});
const editMyLostItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const user = req.user;
        const result = yield lostItem_service_1.lostTItemServices.editMyLostItem(data, user);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Lost item edited successfully",
            data: result,
        });
    }
    catch (error) {
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: error === null || error === void 0 ? void 0 : error.message,
            data: null,
        });
    }
});
const deleteMyLostItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield lostItem_service_1.lostTItemServices.deleteMyLostItem(id);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Lost item deleted successfully",
            data: null,
        });
    }
    catch (error) {
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: error === null || error === void 0 ? void 0 : error.message,
            data: null,
        });
    }
});
exports.lostItemController = {
    toggleFoundStatus,
    createLostItem,
    getLostItem,
    getAllLostItems,
    getSingleLostItem,
    getMyLostItem,
    editMyLostItem,
    deleteMyLostItem,
};
