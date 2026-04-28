"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tipSubmissionLimiter = exports.postCreationLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rateLimitResponse = (_req, res) => {
    res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
};
exports.postCreationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    handler: rateLimitResponse,
    standardHeaders: true,
    legacyHeaders: false,
});
exports.tipSubmissionLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    handler: rateLimitResponse,
    standardHeaders: true,
    legacyHeaders: false,
});
