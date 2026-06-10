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
exports.claimsController = void 0;
const response_1 = __importDefault(require("../../global/response"));
const http_status_codes_1 = require("http-status-codes");
const claim_service_1 = require("./claim.service");
const achievementService_1 = require("../../utils/achievementService");
const createClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const item = req.body;
        const result = yield claim_service_1.claimsService.createClaim(item, req.user);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.CREATED,
            success: true,
            message: "Claim created successfully",
            data: result,
        });
        // ── Achievement triggers ────────────────────────────────────────────────
        const userId = result.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (userId) {
            (0, achievementService_1.checkClaimAchievements)(userId).catch(err => console.error("[Achievement] Error checking claim badges:", err));
        }
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
const getClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield claim_service_1.claimsService.getClaim();
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Claims retrieved successfully",
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
const getMyClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const result = yield claim_service_1.claimsService.getMyClaim(user);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Claims retrieved successfully",
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
const updateClaimStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d;
    try {
        const result = yield claim_service_1.claimsService.updateClaimStatus(req.params.claimId, req.body, { id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id, name: ((_c = req.user) === null || _c === void 0 ? void 0 : _c.name) || ((_d = req.user) === null || _d === void 0 ? void 0 : _d.username) });
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Claims updated successfully",
            data: result,
        });
        // ── Achievement triggers ────────────────────────────────────────────────
        if (result && result.userId) {
            (0, achievementService_1.checkClaimAchievements)(result.userId).catch(err => console.error("[Achievement] Error checking claim badges:", err));
            if (req.body.status === "APPROVED") {
                (0, achievementService_1.checkPointAchievements)(result.userId).catch(err => console.error("[Achievement] Error checking point badges:", err));
            }
        }
    }
    catch (error) {
        next(error);
    }
});
const deleteClaim = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    try {
        const userId = ((_e = req.user) === null || _e === void 0 ? void 0 : _e.role) === "ADMIN" ? undefined : (_f = req.user) === null || _f === void 0 ? void 0 : _f.id;
        const result = yield claim_service_1.claimsService.deleteClaim(req.params.claimId, userId);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Claim deleted successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
const trackClaim = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { claimId, email } = req.body;
        const result = yield claim_service_1.claimsService.trackClaim(claimId, email);
        if (!result) {
            return (0, response_1.default)(res, {
                statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                success: false,
                message: "Claim not found. Please check your Tracking ID and Email.",
                data: null,
            });
        }
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Claim tracked successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.claimsController = {
    createClaim,
    getClaim,
    updateClaimStatus,
    deleteClaim,
    getMyClaim,
    trackClaim,
};
