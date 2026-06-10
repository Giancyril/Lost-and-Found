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
exports.userService = void 0;
const utils_1 = require("../../utils/utils");
const error_1 = __importDefault(require("../../global/error"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const registerUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    // Build the identifier fields from either schoolId or username/email
    const username = user.username || user.schoolId;
    const email = user.email || `${user.schoolId}@student.nbsc.edu.ph`;
    const existedUser = yield prisma_1.default.user.findFirst({
        where: {
            OR: [
                { username },
                { email },
                ...(user.schoolId ? [{ schoolId: user.schoolId }] : []),
            ],
        },
    });
    if (existedUser) {
        throw new error_1.default(406, "Username, email, or School ID already exists");
    }
    const hashedPassword = yield utils_1.utils.passwordHash(user.password);
    const result = yield prisma_1.default.$transaction((transactions) => __awaiter(void 0, void 0, void 0, function* () {
        const createdUser = yield transactions.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                userImg: user.userImg || "",
                name: user.name || "",
                schoolId: user.schoolId || null,
                course: user.course || null,
                yearLevel: user.yearLevel || null,
            },
        });
        // Auto-Sync Option A: Link any past anonymous records that used this email to the new user
        yield transactions.claim.updateMany({
            where: { schoolEmail: email, userId: null },
            data: {
                userId: createdUser.id,
                claimantName: createdUser.name || createdUser.username
            },
        });
        yield transactions.lostItem.updateMany({
            where: { schoolEmail: email, userId: null },
            data: {
                userId: createdUser.id,
                reporterName: createdUser.name || createdUser.username
            },
        });
        yield transactions.foundItem.updateMany({
            where: { schoolEmail: email, userId: null },
            data: {
                userId: createdUser.id,
                reporterName: createdUser.name || createdUser.username
            },
        });
        yield transactions.supportTicket.updateMany({
            where: { senderEmail: email },
            data: { senderName: createdUser.name || createdUser.username },
        });
        yield transactions.feedback.updateMany({
            where: { senderEmail: email },
            data: { senderName: createdUser.name || createdUser.username },
        });
        return {
            id: createdUser.id,
            userImg: createdUser.userImg,
            username: createdUser.username,
            email: createdUser.email,
            schoolId: createdUser.schoolId,
            createdAt: createdUser.createdAt,
            updatedAt: createdUser.updatedAt,
        };
    }));
    return result;
});
const allUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.user.findMany({
        where: {
            isDeleted: false,
        },
        orderBy: {
            activated: "desc",
        },
    });
    return result;
});
const blockUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma_1.default.user.findFirst({
        where: {
            AND: [{ id }, { activated: true }],
        },
    });
    if (users) {
        yield prisma_1.default.user.update({
            where: {
                id,
            },
            data: {
                activated: false,
            },
        });
        return "block";
    }
    else {
        yield prisma_1.default.user.update({
            where: {
                id,
            },
            data: {
                activated: true,
            },
        });
        return "active";
    }
});
const softDeleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: { id },
    });
    if (!user) {
        throw new error_1.default(404, "User not found");
    }
    if (user.isDeleted) {
        throw new error_1.default(400, "User is already deleted");
    }
    const updatedUser = yield prisma_1.default.user.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
            activated: false,
        },
    });
    return {
        id: updatedUser.id,
        username: user.username,
        email: user.email,
        deleted: true,
        deletedAt: updatedUser.deletedAt,
    };
});
const backfillCourseAndYearLevel = () => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma_1.default.user.findMany({
        where: { schoolId: { not: null }, course: null },
        select: { id: true, schoolId: true },
    });
    const results = { updated: 0, skipped: 0, errors: [] };
    for (const user of users) {
        try {
            const { studentService } = yield Promise.resolve().then(() => __importStar(require("../student/student.service")));
            const student = yield studentService.getStudentById(user.schoolId);
            yield prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    course: student.course,
                    yearLevel: student.yearLevel,
                },
            });
            results.updated++;
        }
        catch (e) {
            results.skipped++;
            results.errors.push(`${user.schoolId}: ${e.message}`);
        }
    }
    return results;
});
const updateUser = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.user.update({
        where: {
            id,
        },
        data,
    });
    return result;
});
exports.userService = {
    registerUser,
    allUsers,
    blockUser,
    softDeleteUser,
    backfillCourseAndYearLevel,
    updateUser,
};
