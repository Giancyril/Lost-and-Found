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
exports.userService = void 0;
const utils_1 = require("../../utils/utils");
const error_1 = __importDefault(require("../../global/error"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const registerUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const existedUser = yield prisma_1.default.user.findFirst({
        where: {
            OR: [{ username: user.username }, { email: user.email }],
        },
    });
    if (existedUser) {
        throw new error_1.default(400, "Same Username and email exists");
    }
    const hashedPassword = yield utils_1.utils.passwordHash(user.password);
    const result = yield prisma_1.default.$transaction((transactions) => __awaiter(void 0, void 0, void 0, function* () {
        const createdUser = yield transactions.user.create({
            data: {
                username: user.username,
                email: user.email,
                password: hashedPassword,
                userImg: user.userImg,
            },
        });
        const returnData = {
            id: createdUser.id,
            userImg: createdUser.userImg,
            username: createdUser.username,
            email: createdUser.email,
            createdAt: createdUser.createdAt,
            updatedAt: createdUser.updatedAt,
        };
        return returnData;
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
const changeUserRole = (id, role) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedUser = yield prisma_1.default.user.update({
        where: {
            id,
        },
        data: {
            role: role,
        },
    });
    return {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        activated: updatedUser.activated,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
    };
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
exports.userService = {
    registerUser,
    allUsers,
    blockUser,
    changeUserRole,
    softDeleteUser,
};
