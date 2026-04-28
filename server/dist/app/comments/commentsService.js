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
exports.commentService = void 0;
// v2 - fixed FK constraint
const prisma_1 = __importDefault(require("../config/prisma"));
const COMMENT_INCLUDE = {
    user: {
        select: { id: true, name: true, userImg: true, role: true }
    },
    replies: {
        where: { status: 'APPROVED' },
        include: {
            user: {
                select: { id: true, name: true, userImg: true, role: true }
            }
        },
        orderBy: { createdAt: 'asc' }
    }
};
exports.commentService = {
    // commentsService.ts
    createComment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { itemId, itemType, userId, content, isAnonymous, location, parentCommentId } = data;
            const normalizedType = (itemType || 'FOUND').toUpperCase();
            return yield prisma_1.default.comment.create({
                data: Object.assign(Object.assign(Object.assign({ itemType: normalizedType, content: content || '', location: location || null, isAnonymous: isAnonymous || !userId, status: 'APPROVED' }, (parentCommentId && {
                    parent: { connect: { id: parentCommentId } }
                })), (userId && {
                    user: { connect: { id: userId } }
                })), (normalizedType === 'FOUND'
                    ? { foundItem: { connect: { id: itemId } } }
                    : { lostItem: { connect: { id: itemId } } })),
                include: COMMENT_INCLUDE,
            });
        });
    },
    updateComment(commentId, updateData, userId, userRole) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = { id: commentId };
            if (userRole !== 'ADMIN')
                where.userId = userId;
            return yield prisma_1.default.comment.update({
                where,
                data: updateData,
                include: COMMENT_INCLUDE
            });
        });
    },
    deleteComment(commentId, userId, userRole) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = { id: commentId };
            if (userRole !== 'ADMIN')
                where.userId = userId;
            yield prisma_1.default.comment.delete({ where });
            return true;
        });
    },
    voteHelpful(commentId, _userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.comment.update({
                where: { id: commentId },
                data: { helpfulCount: { increment: 1 } },
                include: COMMENT_INCLUDE
            });
        });
    },
    getComments(itemId_1) {
        return __awaiter(this, arguments, void 0, function* (itemId, options = {}) {
            const page = Number(options.page) || 1;
            const limit = Number(options.limit) || 50;
            // Only fetch TOP-LEVEL comments; replies come nested via include
            return yield prisma_1.default.comment.findMany({
                where: {
                    itemId,
                    status: 'APPROVED',
                    parentCommentId: null
                },
                include: COMMENT_INCLUDE,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            });
        });
    },
};
