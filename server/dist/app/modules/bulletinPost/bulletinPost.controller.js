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
exports.bulletinPostController = void 0;
const http_status_codes_1 = require("http-status-codes");
const response_1 = __importDefault(require("../../global/response"));
const bulletinPost_service_1 = require("./bulletinPost.service");
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield bulletinPost_service_1.bulletinPostService.createPost(req.body);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.CREATED,
            success: true,
            message: "Post created successfully",
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
const getPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ── EGRESS FIX: cache public bulletin list for 60 seconds ─────────────────
        res.set("Cache-Control", "public, max-age=60");
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const searchTerm = req.query.searchTerm || "";
        const result = yield bulletinPost_service_1.bulletinPostService.getPosts({ page, limit, searchTerm });
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Posts retrieved successfully",
            meta: result.meta,
            data: result.data,
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
const createTip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield bulletinPost_service_1.bulletinPostService.createTip(req.params.id, req.body);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.CREATED,
            success: true,
            message: "Tip submitted successfully",
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
const getTips = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ── EGRESS FIX: cache tips list for 30 seconds ────────────────────────────
        res.set("Cache-Control", "public, max-age=30");
        const result = yield bulletinPost_service_1.bulletinPostService.getTips(req.params.id);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Tips retrieved successfully",
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
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield bulletinPost_service_1.bulletinPostService.deletePost(req.params.id);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Post deleted successfully",
            data: null,
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
const deleteTip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield bulletinPost_service_1.bulletinPostService.deleteTip(req.params.tipId);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Tip deleted successfully",
            data: null,
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
const resolvePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield bulletinPost_service_1.bulletinPostService.resolvePost(req.params.id);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Post marked as resolved",
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
exports.bulletinPostController = {
    createPost,
    getPosts,
    createTip,
    getTips,
    deletePost,
    deleteTip,
    resolvePost,
};
