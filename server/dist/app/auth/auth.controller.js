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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const response_1 = __importDefault(require("../global/response"));
const http_status_codes_1 = require("http-status-codes");
const auth_service_1 = require("./auth.service");
const securityController_1 = require("../utils/securityController");
const utils_1 = require("../utils/utils");
const points_service_1 = require("../modules/points/points.service");
const achievementService_1 = require("../utils/achievementService");
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { email, password, username } = req.body;
        // loginUser expects { username: <email or username>, password }
        const user = yield auth_service_1.authServices.loginUser({
            username: email || username, // ← pass as "username" key
            password,
        });
        try {
            yield (0, securityController_1.logLoginAttempt)({
                userId: user.id,
                username: user.username,
                email: user.email,
                ipAddress: (0, securityController_1.getClientIp)(req),
                userAgent: req.headers["user-agent"] || "",
                success: true,
            });
        }
        catch (logErr) {
            console.error("[LoginLog] Failed to log success:", logErr);
        }
        // Record login streak and award milestones
        yield points_service_1.pointsService.recordLoginStreak(user.id);
        yield (0, achievementService_1.checkStreakAndAwardBonus)(user.id);
        const { refreshToken } = user, userData = __rest(user, ["refreshToken"]);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Login successful",
            data: userData,
        });
    }
    catch (error) {
        try {
            yield (0, securityController_1.logLoginAttempt)({
                email: ((_a = req.body) === null || _a === void 0 ? void 0 : _a.email) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.username) || "",
                ipAddress: (0, securityController_1.getClientIp)(req),
                userAgent: req.headers["user-agent"] || "",
                success: false,
                reason: error.message,
            });
        }
        catch (logErr) {
            console.error("[LoginLog] Failed to log failure:", logErr);
        }
        next(error);
    }
});
const portalLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { portalUser, portalToken } = req.body;
        if (!portalUser || !portalToken) {
            return (0, response_1.default)(res, {
                statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                success: false,
                message: "Missing portal credentials",
                data: null,
            });
        }
        const user = yield auth_service_1.authServices.portalLoginUser({
            portalUser,
            portalToken,
        });
        try {
            yield (0, securityController_1.logLoginAttempt)({
                userId: user.id,
                username: user.username,
                email: user.email,
                ipAddress: (0, securityController_1.getClientIp)(req),
                userAgent: req.headers["user-agent"] || "",
                success: true,
            });
        }
        catch (logErr) {
            console.error("[LoginLog] Failed to log success for portal login:", logErr);
        }
        // Record login streak and award milestones for portal login too
        yield points_service_1.pointsService.recordLoginStreak(user.id);
        yield (0, achievementService_1.checkStreakAndAwardBonus)(user.id);
        const { refreshToken } = user, userData = __rest(user, ["refreshToken"]);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Portal login successful",
            data: userData,
        });
    }
    catch (error) {
        try {
            yield (0, securityController_1.logLoginAttempt)({
                email: ((_c = req.body) === null || _c === void 0 ? void 0 : _c.portalUser) || "",
                ipAddress: (0, securityController_1.getClientIp)(req),
                userAgent: req.headers["user-agent"] || "",
                success: false,
                reason: error.message,
            });
        }
        catch (logErr) {
            console.error("[LoginLog] Failed to log failure for portal login:", logErr);
        }
        next(error);
    }
});
const newPasswords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const passwordData = req.body;
        const result = yield auth_service_1.authServices.newPasswords(passwordData, req.user);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: 'Password changed successfully',
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
const changeEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.body;
        // console.log(email)
        const result = yield auth_service_1.authServices.changeEmail(email, req.user);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: 'Email changed successfully',
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
const changeUsername = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const username = req.body;
        const result = yield auth_service_1.authServices.changeUsername(username, req.user);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: 'Username changed successfully',
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
const refresh = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const refreshToken = (_d = req.cookies) === null || _d === void 0 ? void 0 : _d.refreshToken;
        if (!refreshToken) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ success: false, message: "No refresh token" });
        }
        try {
            const decoded = utils_1.utils.verifyToken(refreshToken);
            const accessToken = utils_1.utils.createToken({
                id: decoded.id,
                name: decoded.name,
                email: decoded.email,
                username: decoded.username,
                role: decoded.role,
                userImg: decoded.userImg,
                schoolId: decoded.schoolId,
            });
            (0, response_1.default)(res, {
                statusCode: http_status_codes_1.StatusCodes.OK,
                success: true,
                message: "Token refreshed",
                data: { token: accessToken },
            });
        }
        catch (e) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ success: false, message: "Invalid refresh token" });
        }
    }
    catch (error) {
        next(error);
    }
});
const logout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        });
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Logged out successfully",
            data: null,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.authController = {
    login,
    portalLogin,
    newPasswords,
    changeEmail,
    changeUsername,
    refresh,
    logout
};
