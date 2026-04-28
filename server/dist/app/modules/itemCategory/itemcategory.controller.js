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
exports.itemcategoryController = void 0;
const response_1 = __importDefault(require("../../global/response"));
const http_status_codes_1 = require("http-status-codes");
const itemCategory_service_1 = require("./itemCategory.service");
const createItemCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = req.body;
        const result = yield itemCategory_service_1.itemcategoryService.createItemCategory(item);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.CREATED,
            success: true,
            message: "Item category created successfully",
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
const getItemCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield itemCategory_service_1.itemcategoryService.getItemCategory();
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Item category retrieved successfully",
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
const updateItemCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = req.body;
        const result = yield itemCategory_service_1.itemcategoryService.updateItemCategory(id, data);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Item category updated successfully",
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
const deleteItemCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield itemCategory_service_1.itemcategoryService.deleteItemCategory(id);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Item category deleted successfully",
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
exports.itemcategoryController = {
    createItemCategory,
    getItemCategory,
    updateItemCategory,
    deleteItemCategory,
};
