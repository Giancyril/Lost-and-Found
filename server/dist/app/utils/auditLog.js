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
exports.getAuditLogs = void 0;
const claim_service_1 = require("../modules/claim/claim.service");
const response_1 = __importDefault(require("../global/response"));
const http_status_codes_1 = require("http-status-codes");
const getAuditLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield claim_service_1.claimsService.getAuditLogs();
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Audit logs retrieved successfully",
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
exports.getAuditLogs = getAuditLogs;
