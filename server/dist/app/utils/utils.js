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
exports.utils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("../config/config"));
const prisma_1 = __importDefault(require("../config/prisma"));
const passwordHash = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const saltRounds = Number(config_1.default.saltrounds);
    const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
    return hashedPassword;
});
const comparePasswords = (plainTextPassword, hashedPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const match = yield bcrypt_1.default.compare(plainTextPassword, hashedPassword);
    return match;
});
const createToken = (data) => {
    return jsonwebtoken_1.default.sign(data, config_1.default.jwt_secrets, {
        algorithm: "HS256",
        expiresIn: config_1.default.jwt_expires_in,
    });
};
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.default.jwt_secrets);
};
const calculateMeta = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, itemType = 'found' } = data;
    let total;
    let retryCount = 0;
    const maxRetries = 3;
    while (retryCount < maxRetries) {
        try {
            if (itemType === 'lost') {
                total = yield prisma_1.default.lostItem.count({
                    where: { isDeleted: false }
                });
            }
            else {
                total = yield prisma_1.default.foundItem.count({
                    where: { isDeleted: false }
                });
            }
            break; // Success, exit retry loop
        }
        catch (error) {
            retryCount++;
            console.error(`calculateMeta attempt ${retryCount} failed:`, error.message);
            if (retryCount >= maxRetries) {
                console.error('calculateMeta: Max retries reached, throwing error');
                throw new Error('Database connection failed. Please try again.');
            }
            // Wait before retrying (exponential backoff)
            yield new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
    }
    const meta = {
        total: total || 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((total || 0) / Number(limit)),
    };
    return meta;
});
exports.utils = {
    passwordHash,
    comparePasswords,
    createToken,
    verifyToken,
    calculateMeta,
};
