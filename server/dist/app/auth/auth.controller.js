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
exports.authController = void 0;
const response_1 = __importDefault(require("../global/response"));
const http_status_codes_1 = require("http-status-codes");
const auth_service_1 = require("./auth.service");
const securityController_1 = require("../utils/securityController");
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
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Login successful",
            data: user,
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
exports.authController = {
    login,
    newPasswords,
    changeEmail,
    changeUsername
};
