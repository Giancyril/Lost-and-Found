"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.authServices = void 0;
const utils_1 = require("../utils/utils");
const error_1 = __importDefault(require("../global/error"));
const http_status_codes_1 = require("http-status-codes");
const prisma_1 = __importDefault(require("../config/prisma"));
const loginUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { password, username: userNameEmail } = data;
    const user = yield prisma_1.default.user.findFirst({
        where: {
            OR: [
                { username: userNameEmail },
                { email: userNameEmail },
                { schoolId: userNameEmail },
            ],
        },
    });
    if (!user) {
        throw new error_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User does not exist");
    }
    if (password && !(yield utils_1.utils.comparePasswords(password, user.password))) {
        throw new error_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Password is incorrect");
    }
    const { id, name, email, role, userImg, username, schoolId } = user;
    // FIX: schoolId is now included in the token payload so req.user.schoolId
    // is available in all protected routes (e.g. getMyFoundItem).
    const accessToken = utils_1.utils.createToken({
        id,
        name,
        email,
        username,
        role,
        userImg,
        schoolId,
    });
    const refreshToken = utils_1.utils.createRefreshToken({
        id,
        name,
        email,
        username,
        role,
        userImg,
        schoolId,
    });
    return {
        id: user.id,
        name: name || "User",
        username: user.username,
        email: user.email,
        role,
        schoolId, // ← ADDED so frontend also gets it on login
        token: accessToken,
        refreshToken,
    };
});
const portalLoginUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { portalUser, portalToken } = data;
    // Ideally, validate portalToken against SAS portal here.
    // Assuming token validation passes, look up user by portalUser.
    let user = yield prisma_1.default.user.findFirst({
        where: {
            OR: [
                { username: portalUser },
                { email: portalUser },
                { schoolId: portalUser },
            ],
        },
    });
    // Auto-provision if user doesn't exist
    if (!user) {
        // Try to fetch student details from masterlist to get correct info
        try {
            const { studentService } = yield Promise.resolve().then(() => __importStar(require("../modules/student/student.service")));
            const masterlistData = yield studentService.getStudentById(portalUser).catch(() => null);
            const email = (masterlistData === null || masterlistData === void 0 ? void 0 : masterlistData.email) || `${portalUser}@nbsc.edu.ph`;
            const name = (masterlistData === null || masterlistData === void 0 ? void 0 : masterlistData.name) || portalUser;
            // Check if email already exists
            const existingEmail = yield prisma_1.default.user.findFirst({ where: { email } });
            if (existingEmail) {
                // Upgrade to ADMIN if they came in via portal and are not already ADMIN
                if (existingEmail.role !== "ADMIN") {
                    user = yield prisma_1.default.user.update({
                        where: { id: existingEmail.id },
                        data: { role: "ADMIN" },
                    });
                }
                else {
                    user = existingEmail;
                }
            }
            else {
                const hashedPassword = yield utils_1.utils.passwordHash("DefaultPortalPass123!"); // Or a random secure password
                // SAS Portal is exclusively for staff — always provision as ADMIN
                user = yield prisma_1.default.user.create({
                    data: {
                        username: portalUser,
                        email,
                        name,
                        schoolId: portalUser,
                        password: hashedPassword,
                        role: "ADMIN",
                        course: (masterlistData === null || masterlistData === void 0 ? void 0 : masterlistData.course) || null,
                        yearLevel: (masterlistData === null || masterlistData === void 0 ? void 0 : masterlistData.yearLevel) || null,
                    }
                });
            }
        }
        catch (e) {
            console.error("Auto-provisioning failed for portal login", e);
            throw new error_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Failed to auto-provision user from portal");
        }
    }
    else {
        // Existing user found — upgrade to ADMIN if not already (SAS Portal is admin-only)
        if (user.role !== "ADMIN") {
            user = yield prisma_1.default.user.update({
                where: { id: user.id },
                data: { role: "ADMIN" },
            });
        }
    }
    const { id, name, email, role, userImg, username, schoolId } = user;
    const accessToken = utils_1.utils.createToken({
        id,
        name,
        email,
        username,
        role,
        userImg,
        schoolId,
    });
    const refreshToken = utils_1.utils.createRefreshToken({
        id,
        name,
        email,
        username,
        role,
        userImg,
        schoolId,
    });
    return {
        id: user.id,
        name: name || "User",
        username: user.username,
        email: user.email,
        role,
        schoolId,
        token: accessToken,
        refreshToken,
    };
});
const newPasswords = (data, user) => __awaiter(void 0, void 0, void 0, function* () {
    if (data.currentPassword === data.newPassword) {
        throw new error_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password is same");
    }
    const existedUser = yield prisma_1.default.user.findFirst({
        where: { username: user.username },
    });
    if (data.currentPassword &&
        existedUser &&
        !(yield utils_1.utils.comparePasswords(data.currentPassword, existedUser.password))) {
        throw new error_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password is incorrect");
    }
    const newHashPassword = yield utils_1.utils.passwordHash(data.newPassword);
    const updated = yield prisma_1.default.user.update({
        where: { email: existedUser === null || existedUser === void 0 ? void 0 : existedUser.email },
        data: { password: newHashPassword },
    });
    const { checkSecurityFirstAchievement } = yield Promise.resolve().then(() => __importStar(require("../utils/achievementService")));
    yield checkSecurityFirstAchievement(updated.id);
});
const changeEmail = (email, user) => __awaiter(void 0, void 0, void 0, function* () {
    const existedUser = yield prisma_1.default.user.findFirst({ where: email });
    if (existedUser) {
        throw new error_1.default(http_status_codes_1.StatusCodes.CONFLICT, "Email already exists. Try new one!");
    }
    const updated = yield prisma_1.default.user.update({
        where: { username: user === null || user === void 0 ? void 0 : user.username },
        data: email,
    });
    const { checkProfileAchievements } = yield Promise.resolve().then(() => __importStar(require("../utils/achievementService")));
    yield checkProfileAchievements(updated.id);
});
const changeUsername = (username, user) => __awaiter(void 0, void 0, void 0, function* () {
    const existedUser = yield prisma_1.default.user.findFirst({ where: username });
    if (existedUser) {
        throw new error_1.default(http_status_codes_1.StatusCodes.CONFLICT, "Username already exists. Try new one!");
    }
    const updated = yield prisma_1.default.user.update({
        where: { email: user.email },
        data: username,
    });
    const { checkProfileAchievements, checkProfileWarriorAchievement } = yield Promise.resolve().then(() => __importStar(require("../utils/achievementService")));
    yield checkProfileWarriorAchievement(updated.id);
    yield checkProfileAchievements(updated.id);
});
exports.authServices = {
    loginUser,
    portalLoginUser,
    newPasswords,
    changeEmail,
    changeUsername,
};
