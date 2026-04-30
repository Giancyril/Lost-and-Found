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
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsController = void 0;
const commentsService_1 = require("./commentsService");
exports.commentsController = {
    getComments(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { itemId } = req.params;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 50;
                // itemType is accepted from query but not used in filtering — safe to ignore
                const comments = yield commentsService_1.commentService.getComments(itemId, { page, limit });
                res.json(comments);
            }
            catch (error) {
                console.error('COMMENTS GET ERROR:', error === null || error === void 0 ? void 0 : error.message);
                res.status(500).json({ error: 'Failed to fetch comments', detail: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    },
    createComment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { itemId } = req.params;
                console.log('📥 createComment body:', req.body);
                console.log('📥 itemId param:', itemId);
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null;
                const userRole = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || 'USER';
                const comment = yield commentsService_1.commentService.createComment(Object.assign(Object.assign({}, req.body), { itemId,
                    userId,
                    userRole }));
                const io = req.app.get('io');
                if (io) {
                    io.to(`item-${itemId}`).emit('comment-added', comment);
                }
                res.status(201).json(comment);
            }
            catch (error) {
                console.error('❌ Error creating comment:', error === null || error === void 0 ? void 0 : error.message);
                console.error('❌ Full error:', error);
                res.status(500).json({ error: 'Failed to create comment', detail: error === null || error === void 0 ? void 0 : error.message });
            }
        });
    },
    updateComment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { commentId } = req.params;
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null;
                const userRole = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || 'USER';
                const updated = yield commentsService_1.commentService.updateComment(commentId, req.body.updateData, userId, userRole);
                res.json(updated);
            }
            catch (error) {
                console.error('Error updating comment:', error);
                res.status(500).json({ error: 'Failed to update comment' });
            }
        });
    },
    deleteComment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { commentId } = req.params;
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null; // null not ''
                const userRole = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || 'GUEST';
                yield commentsService_1.commentService.deleteComment(commentId, userId, userRole);
                // Broadcast deletion to other users in the room
                const io = req.app.get('io');
                if (io) {
                    const itemId = req.query.itemId;
                    if (itemId)
                        io.to(`item-${itemId}`).emit('comment-deleted', { commentId });
                }
                res.status(204).send();
            }
            catch (error) {
                console.error('Error deleting comment:', error);
                res.status(500).json({ error: 'Failed to delete comment' });
            }
        });
    },
    voteHelpful(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { commentId } = req.params;
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null;
                const updated = yield commentsService_1.commentService.voteHelpful(commentId, userId);
                res.json(updated);
            }
            catch (error) {
                console.error('Error voting helpful:', error);
                res.status(500).json({ error: 'Failed to vote helpful' });
            }
        });
    },
};
