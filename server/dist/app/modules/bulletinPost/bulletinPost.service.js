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
exports.bulletinPostService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const createPost = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    return prisma_1.default.bulletinPost.create({
        data: {
            itemName: data.itemName.trim(),
            description: data.description,
            location: data.location,
            dateLost: new Date(data.dateLost),
            imageUrl: (_a = data.imageUrl) !== null && _a !== void 0 ? _a : "",
            reporterName: (_b = data.reporterName) !== null && _b !== void 0 ? _b : "",
            contactHint: (_c = data.contactHint) !== null && _c !== void 0 ? _c : "",
        },
    });
});
const getPosts = (_d) => __awaiter(void 0, [_d], void 0, function* ({ page = 1, limit = 12, searchTerm = "" }) {
    const skip = (page - 1) * limit;
    const where = { isDeleted: false };
    if (searchTerm) {
        where.OR = [
            { itemName: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
            { location: { contains: searchTerm, mode: "insensitive" } },
        ];
    }
    const [data, total] = yield Promise.all([
        prisma_1.default.bulletinPost.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            // ── EGRESS FIX: exclude imageUrl (base64) from list ───────────────────
            select: {
                id: true,
                itemName: true,
                description: true,
                location: true,
                dateLost: true,
                reporterName: true,
                contactHint: true,
                isResolved: true,
                isDeleted: true,
                createdAt: true,
                updatedAt: true,
                imageUrl: true,
                _count: { select: { tips: true } },
            },
        }),
        prisma_1.default.bulletinPost.count({ where }),
    ]);
    return {
        data,
        meta: { total, page, limit, totalPage: Math.ceil(total / limit) },
    };
});
const getSinglePost = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Single post view — include imageUrl here since it's just one record
    return prisma_1.default.bulletinPost.findFirst({
        where: { id, isDeleted: false },
        include: { _count: { select: { tips: true } } },
    });
});
const createTip = (postId, data) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    return prisma_1.default.bulletinTip.create({
        data: {
            bulletinPostId: postId,
            details: data.details,
            location: (_e = data.location) !== null && _e !== void 0 ? _e : "",
        },
    });
});
const getTips = (postId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.bulletinTip.findMany({
        where: { bulletinPostId: postId },
        orderBy: { createdAt: "desc" },
    });
});
const deletePost = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.bulletinPost.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
    });
});
const deleteTip = (tipId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.bulletinTip.delete({ where: { id: tipId } });
});
const resolvePost = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.bulletinPost.update({
        where: { id },
        data: { isResolved: true },
    });
});
exports.bulletinPostService = {
    createPost,
    getPosts,
    getSinglePost,
    createTip,
    getTips,
    deletePost,
    deleteTip,
    resolvePost,
};
