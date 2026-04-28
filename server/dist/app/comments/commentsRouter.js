"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsRouter = void 0;
const express_1 = require("express");
const commentsController_1 = require("./commentsController");
const auth_1 = __importDefault(require("../midddlewares/auth"));
const express_rate_limit_1 = require("express-rate-limit");
const router = (0, express_1.Router)();
exports.commentsRouter = router;
// Rate limiting: 10 comments per minute per user
const commentRateLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many comments, please try again later'
});
// Get comments for a specific item (public)
router.get('/items/:itemId/comments', commentsController_1.commentsController.getComments);
// Create a new comment — auth optional (anon comments allowed)
router.post('/items/:itemId/comments', commentRateLimit, commentsController_1.commentsController.createComment);
// Update a comment (authenticated users only)
router.put('/comments/:commentId', (0, auth_1.default)(), commentsController_1.commentsController.updateComment);
// Delete a comment (authenticated users only)
router.delete('/comments/:commentId', (0, auth_1.default)(), commentsController_1.commentsController.deleteComment);
// Vote on a comment (authenticated users only)
router.post('/comments/:commentId/vote-helpful', (0, auth_1.default)(), commentsController_1.commentsController.voteHelpful);
