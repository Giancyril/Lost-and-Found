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
exports.studentController = void 0;
const http_status_codes_1 = require("http-status-codes");
const response_1 = __importDefault(require("../../global/response"));
const student_service_1 = require("./student.service");
const SHEET_ID = "1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI";
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Copy%20of%20Master%20List`;
const getStudentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield student_service_1.studentService.getStudentById(req.params.id);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Student retrieved successfully",
            data: result,
        });
    }
    catch (err) {
        (0, response_1.default)(res, {
            statusCode: (_a = err.statusCode) !== null && _a !== void 0 ? _a : 400,
            success: false,
            message: err.message,
            data: null,
        });
    }
});
const getStudentByDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { name, email } = req.query;
        const result = yield student_service_1.studentService.getStudentByDetails(name || "", email || "");
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Student retrieved successfully",
            data: result,
        });
    }
    catch (err) {
        (0, response_1.default)(res, {
            statusCode: (_b = err.statusCode) !== null && _b !== void 0 ? _b : 400,
            success: false,
            message: err.message,
            data: null,
        });
    }
});
const upsertStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const result = yield student_service_1.studentService.createOrUpdateStudent(req.body);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.CREATED,
            success: true,
            message: "Student data saved successfully",
            data: result,
        });
    }
    catch (err) {
        (0, response_1.default)(res, {
            statusCode: (_c = err.statusCode) !== null && _c !== void 0 ? _c : 400,
            success: false,
            message: err.message,
            data: null,
        });
    }
});
// ── Debug endpoint — remove after fixing ─────────────────────────────────────
const debugMasterlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch(GVIZ_URL);
        const text = yield response.text();
        const jsonStr = text.substring(text.indexOf("(") + 1, text.lastIndexOf(")"));
        const json = JSON.parse(jsonStr);
        const first5 = json.table.rows.slice(0, 5).map((row) => {
            var _a, _b, _c, _d, _e, _f;
            return ({
                col0_raw: (_a = row.c[0]) === null || _a === void 0 ? void 0 : _a.v,
                col0_normalized: String((_c = (_b = row.c[0]) === null || _b === void 0 ? void 0 : _b.v) !== null && _c !== void 0 ? _c : "").replace(/[-\s]/g, "").toLowerCase().trim(),
                col1_email: (_d = row.c[1]) === null || _d === void 0 ? void 0 : _d.v,
                col2_name: (_e = row.c[2]) === null || _e === void 0 ? void 0 : _e.v,
                col3_department: (_f = row.c[3]) === null || _f === void 0 ? void 0 : _f.v,
            });
        });
        res.json({ total: json.table.rows.length, first5 });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.studentController = {
    getStudentById,
    getStudentByDetails,
    upsertStudent,
    debugMasterlist,
};
