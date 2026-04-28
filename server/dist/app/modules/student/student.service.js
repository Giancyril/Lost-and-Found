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
exports.studentService = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_1 = __importDefault(require("../../global/error"));
const SHEET_ID = "1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI";
const MASTERLIST_SHEET_NAME = "Copy of Master List";
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(MASTERLIST_SHEET_NAME)}`;
// ── Normalize ID — strip dashes/spaces so "2024-1521" matches "20241521" ──────
const normalizeId = (s) => s.replace(/[-\s]/g, "").toLowerCase().trim();
// ── Parse Google Sheets Gviz JSON response ────────────────────────────────────
const parseGvizResponse = (data) => {
    const jsonStr = data.substring(data.indexOf("(") + 1, data.lastIndexOf(")"));
    const json = JSON.parse(jsonStr);
    const rows = json.table.rows;
    return rows
        .filter((row) => { var _a; return row.c && ((_a = row.c[0]) === null || _a === void 0 ? void 0 : _a.v); })
        .map((row) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return ({
            id: String((_b = (_a = row.c[0]) === null || _a === void 0 ? void 0 : _a.v) !== null && _b !== void 0 ? _b : "").trim(),
            email: String((_d = (_c = row.c[1]) === null || _c === void 0 ? void 0 : _c.v) !== null && _d !== void 0 ? _d : "").trim(),
            name: String((_f = (_e = row.c[2]) === null || _e === void 0 ? void 0 : _e.v) !== null && _f !== void 0 ? _f : "").trim(),
            department: String((_h = (_g = row.c[3]) === null || _g === void 0 ? void 0 : _g.v) !== null && _h !== void 0 ? _h : "").trim(),
        });
    });
};
// ── Fetch and parse masterlist ────────────────────────────────────────────────
const fetchMasterlist = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch(GVIZ_URL);
        if (!response.ok) {
            throw new error_1.default(http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE, `Google Sheets error (${response.status}). Ensure the sheet is shared publicly.`);
        }
        const text = yield response.text();
        return parseGvizResponse(text);
    }
    catch (error) {
        if (error instanceof error_1.default)
            throw error;
        throw new error_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch student masterlist from Google Sheets.");
    }
});
// ── Get student by ID (Column A) ──────────────────────────────────────────────
const getStudentById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const masterlist = yield fetchMasterlist();
    const searchId = normalizeId(id);
    const student = masterlist.find((s) => normalizeId(s.id) === searchId);
    if (!student) {
        throw new error_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `Student with ID "${id}" not found in Masterlist.`);
    }
    return student;
});
// ── Get student by Name and/or Email ─────────────────────────────────────────
const getStudentByDetails = (name, email) => __awaiter(void 0, void 0, void 0, function* () {
    const masterlist = yield fetchMasterlist();
    const searchName = (name || "").toLowerCase().trim();
    const searchEmail = (email || "").toLowerCase().trim();
    const searchId = normalizeId(searchEmail.split("@")[0]); // e.g. "20221270"
    const normalizeName = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean).sort().join(" ");
    const normalizedSearch = normalizeName(searchName);
    // ── Score each student ────────────────────────────────────────────────────
    const scored = masterlist.map((s) => {
        let score = 0;
        const rowId = normalizeId(s.id);
        const rowEmail = s.email.toLowerCase();
        const rowName = s.name.toLowerCase();
        // Email / ID match — high priority
        if (searchEmail) {
            if (rowEmail === searchEmail || rowId === searchId || rowEmail === searchId) {
                score += 100;
            }
        }
        // Name fuzzy match
        if (searchName) {
            const normalizedRow = normalizeName(rowName);
            const terms = searchName.split(/\s+/).filter(Boolean);
            const matches = terms.filter(t => rowName.includes(t)).length;
            if (normalizedRow === normalizedSearch)
                score += 60;
            else if (matches === terms.length)
                score += 50;
            else if (matches > 0)
                score += (matches / terms.length) * 30;
        }
        return { student: s, score };
    });
    const best = scored
        .filter((c) => c.score > 0)
        .sort((a, b) => b.score - a.score)[0];
    if (!best) {
        throw new error_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Student not found in the Masterlist. Please check the name or email.");
    }
    return best.student;
});
// ── createOrUpdateStudent — managed via Google Sheets directly ────────────────
const createOrUpdateStudent = (_data) => __awaiter(void 0, void 0, void 0, function* () {
    throw new error_1.default(http_status_codes_1.StatusCodes.METHOD_NOT_ALLOWED, "Manage student masterlist directly in Google Sheets.");
});
exports.studentService = {
    getStudentById,
    getStudentByDetails,
    createOrUpdateStudent,
};
