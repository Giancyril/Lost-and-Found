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
exports.sendClaimApprovedEmail = exports.sendLostItemEmail = void 0;
const mailer_1 = require("./mailer");
const emailTemplates_1 = require("./emailTemplates");
const response_1 = __importDefault(require("../global/response"));
const http_status_codes_1 = require("http-status-codes");
const sendLostItemEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { smtp, recipient } = req.body;
        if (!recipient || !recipient.toEmail) {
            return (0, response_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, success: false, message: "Recipient email is required", data: null });
        }
        const fromName = (smtp === null || smtp === void 0 ? void 0 : smtp.fromName) || process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";
        console.log("[email] sendLostItemEmail → to:", recipient === null || recipient === void 0 ? void 0 : recipient.toEmail, "| SENDGRID_KEY set:", !!process.env.SENDGRID_API_KEY);
        const template = (0, emailTemplates_1.lostItemReportedTemplate)({
            reporterName: recipient.reporterName,
            itemName: recipient.itemName,
            location: recipient.location,
            date: recipient.date,
            description: recipient.description,
        });
        yield (0, mailer_1.sendEmail)({
            fromName,
            fromEmail: process.env.SMTP_FROM_EMAIL || "mijaresgiancyril@gmail.com",
            toEmail: recipient.toEmail,
            subject: template.subject,
            html: template.html,
        });
        (0, response_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.OK, success: true, message: "Lost item report email sent successfully", data: null });
    }
    catch (error) {
        console.error("[email] sendLostItemEmail error:", error === null || error === void 0 ? void 0 : error.message, error === null || error === void 0 ? void 0 : error.code, (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.body);
        (0, response_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, success: false, message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to send email", data: null });
    }
});
exports.sendLostItemEmail = sendLostItemEmail;
const sendClaimApprovedEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { smtp, recipient } = req.body;
        if (!recipient || !recipient.toEmail) {
            return (0, response_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, success: false, message: "Recipient email is required", data: null });
        }
        const fromName = (smtp === null || smtp === void 0 ? void 0 : smtp.fromName) || process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";
        console.log("[email] sendClaimApprovedEmail → to:", recipient === null || recipient === void 0 ? void 0 : recipient.toEmail, "| SENDGRID_KEY set:", !!process.env.SENDGRID_API_KEY);
        const template = (0, emailTemplates_1.itemClaimedTemplate)({
            claimantName: recipient.claimantName,
            itemName: recipient.itemName,
            location: recipient.location,
            claimDate: recipient.claimDate,
            contactNumber: recipient.contactNumber,
        });
        yield (0, mailer_1.sendEmail)({
            fromName,
            fromEmail: process.env.SMTP_FROM_EMAIL || "mijaresgiancyril@gmail.com",
            toEmail: recipient.toEmail,
            subject: template.subject,
            html: template.html,
        });
        (0, response_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.OK, success: true, message: "Claim approved email sent successfully", data: null });
    }
    catch (error) {
        console.error("[email] sendClaimApprovedEmail error:", error === null || error === void 0 ? void 0 : error.message, error === null || error === void 0 ? void 0 : error.code, (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.body);
        (0, response_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, success: false, message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to send email", data: null });
    }
});
exports.sendClaimApprovedEmail = sendClaimApprovedEmail;
