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
exports.foundItemController = void 0;
const http_status_codes_1 = require("http-status-codes");
const response_1 = __importDefault(require("../../global/response"));
const foundItem_service_1 = require("./foundItem.service");
const utils_1 = require("../../utils/utils");
const match_service_1 = require("../matching/match.service");
const storage_1 = require("../../utils/storage");
const sharp_1 = __importDefault(require("sharp"));
const mailer_1 = require("../../utils/mailer");
const emailTemplates_1 = require("../../utils/emailTemplates");
const sheets_service_1 = require("../sheets/sheets.service");
const points_service_1 = require("../points/points.service");
const prisma_1 = __importDefault(require("../../config/prisma"));
const achievementService_1 = require("../../utils/achievementService");
const createFoundItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const requestUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === "ADMIN";
        // For admin submissions: find the student's User record by their email
        // so the found item is linked to them and points go to them
        let reporterUserId = undefined;
        if (!isAdmin) {
            // Student submitting directly — use their own account
            reporterUserId = requestUserId;
        }
        else if (req.body.schoolEmail) {
            // Admin submitting on behalf of student — look up by schoolEmail
            const studentUser = yield prisma_1.default.user.findFirst({
                where: { email: req.body.schoolEmail, role: "USER", isDeleted: false },
                select: { id: true },
            });
            if (studentUser) {
                reporterUserId = studentUser.id;
            }
        }
        const result = yield foundItem_service_1.foundItemService.createFoundItem(req.body, reporterUserId);
        if (result === null || result === void 0 ? void 0 : result.id) {
            // Award 50pts to the student if their User account was found
            if (reporterUserId) {
                yield points_service_1.pointsService
                    .award(reporterUserId, "FOUND_ITEM_REPORTED", result.id)
                    .catch((err) => console.error("[Points] Failed to award points for found item:", err));
            }
            // ── Log to Google Sheets ─────────────────────────────────────────────────
            try {
                const reportTimestamp = new Date().toISOString();
                const studentId = req.body.studentId ||
                    (req.body.schoolEmail ? req.body.schoolEmail.split("@")[0] : "N/A");
                yield (0, sheets_service_1.logToSheet)({
                    sheetName: "Found Items",
                    timestamp: reportTimestamp,
                    studentId,
                    reporterName: req.body.reporterName || "SAS Office",
                    email: req.body.schoolEmail || "N/A",
                    itemName: req.body.foundItemName,
                    description: req.body.description || "",
                    location: req.body.location,
                    date: req.body.date,
                    type: "FOUND",
                    reportId: result.id.toString(),
                    scannedAt: reportTimestamp,
                });
                console.log("[Sheets] Found item logged to Google Sheets:", result.id);
            }
            catch (sheetsError) {
                console.error("[Sheets] Failed to log found item to Google Sheets:", sheetsError);
            }
            // ── Send confirmation email ──────────────────────────────────────────────
            try {
                const fromName = process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";
                const fromEmail = process.env.SMTP_FROM_EMAIL || "mijaresgiancyril@gmail.com";
                const template = (0, emailTemplates_1.foundItemReportedTemplate)({
                    reporterName: req.body.reporterName || "Unknown",
                    itemName: req.body.foundItemName,
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
                console.log("[Email] Found item confirmation sent to:", req.body.schoolEmail);
            }
            catch (emailError) {
                console.error("[Email] Failed to send found item confirmation:", emailError);
            }
            // ── Smart matching ───────────────────────────────────────────────────────
            match_service_1.matchService.findMatchesForFoundItem(result).catch((err) => console.error("[SmartMatch] Error matching found item:", err));
            // ── Achievement triggers ────────────────────────────────────────────────
            if (reporterUserId) {
                (0, achievementService_1.checkFoundItemAchievements)(reporterUserId).catch(err => console.error("[Achievement] Error checking found item badges:", err));
                (0, achievementService_1.checkPointAchievements)(reporterUserId).catch(err => console.error("[Achievement] Error checking point badges:", err));
            }
        }
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.CREATED,
            success: true,
            message: "Found item reported successfully",
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
const getFoundItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.set("Cache-Control", "public, max-age=60");
        const meta = yield utils_1.utils.calculateMeta(Object.assign(Object.assign({}, req.query), { itemType: "found" }));
        const result = yield foundItem_service_1.foundItemService.getFoundItem(req.query);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Found items retrieved successfully",
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
const getSingleFoundItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req === null || req === void 0 ? void 0 : req.params.id;
        const result = yield foundItem_service_1.foundItemService.getSingleFoundItem(id);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Found item retrieved successfully",
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
const getMyFoundItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield foundItem_service_1.foundItemService.getMyFoundItem(req.user);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Found item retrieved successfully",
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
const editMyFoundItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        yield foundItem_service_1.foundItemService.editMyFoundItem(data);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Found item edited successfully",
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
const deleteMyFoundItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield foundItem_service_1.foundItemService.deleteMyFoundItem(id);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Found item deleted successfully",
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
const archiveFoundItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield foundItem_service_1.foundItemService.archiveFoundItem(id);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Found item archived successfully",
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
const restoreFoundItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield foundItem_service_1.foundItemService.restoreFoundItem(id);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Found item restored successfully",
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
const getArchivedFoundItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield foundItem_service_1.foundItemService.getArchivedFoundItems();
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Archived items retrieved successfully",
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
const getStaleFoundItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield foundItem_service_1.foundItemService.getStaleFoundItems();
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Stale items retrieved successfully",
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
const uploadFoundItemImages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const files = req.files;
        const { primaryIndex } = req.body;
        if (!files || files.length === 0) {
            return (0, response_1.default)(res, {
                statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                success: false,
                message: "No images provided",
                data: null,
            });
        }
        const uploadedUrls = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            let compressedBuffer = file.buffer;
            try {
                compressedBuffer = yield (0, sharp_1.default)(file.buffer)
                    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
                    .jpeg({ quality: 80, progressive: true })
                    .toBuffer();
            }
            catch (error) {
                console.error("Image compression error:", error);
                compressedBuffer = file.buffer;
            }
            const url = yield (0, storage_1.uploadFileToStorage)(compressedBuffer, file.mimetype, "found", id);
            uploadedUrls.push(url);
        }
        const primaryImageUrl = uploadedUrls[parseInt(primaryIndex) || 0];
        yield foundItem_service_1.foundItemService.updateFoundItemImage(id, primaryImageUrl);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Images uploaded successfully",
            data: { urls: uploadedUrls, primaryImageUrl },
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
exports.foundItemController = {
    createFoundItem,
    getFoundItem,
    getSingleFoundItem,
    getMyFoundItem,
    editMyFoundItem,
    deleteMyFoundItem,
    archiveFoundItem,
    restoreFoundItem,
    getArchivedFoundItems,
    getStaleFoundItems,
    uploadFoundItemImages,
};
