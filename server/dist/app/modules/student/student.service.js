"use strict";
// student.service.ts
// Fix: return `department` as alias for `course` so all consumers
// (ReportLostItem, BarcodeScannerModal, handleFetchDetails) get the
// field they expect without any frontend changes.
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
const prisma_1 = __importDefault(require("../../config/prisma"));
const SHEET_ID = "1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI";
const MASTERLIST_SHEET = "Copy of Master List";
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(MASTERLIST_SHEET)}`;
// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeId = (s) => String(s !== null && s !== void 0 ? s : "").replace(/[-\s]/g, "").toLowerCase().trim();
/**
 * Parse one Gviz row.
 *
 * Sheet columns (confirmed from debugMasterlist + screenshot):
 *   A (0) – School ID   e.g. 20250122
 *   B (1) – Email       e.g. 20250122@nbsc.edu.ph
 *   C (2) – Full Name   e.g. ANIAN CULTURA DONALD FERDY
 *   D (3) – Course      e.g. Bachelor of Science in IT
 *   E (4) – Year Level  e.g. First Year
 *
 * We expose BOTH `course` and `department` (same value) so that:
 *   - ReportLostItem / BarcodeScannerModal  → use student.department
 *   - StudentRegister                       → uses student.course
 */
const parseRow = (row) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const id = String((_b = (_a = row.c[0]) === null || _a === void 0 ? void 0 : _a.v) !== null && _b !== void 0 ? _b : "").trim();
    const email = String((_d = (_c = row.c[1]) === null || _c === void 0 ? void 0 : _c.v) !== null && _d !== void 0 ? _d : "").trim();
    const name = String((_f = (_e = row.c[2]) === null || _e === void 0 ? void 0 : _e.v) !== null && _f !== void 0 ? _f : "").trim();
    const course = String((_h = (_g = row.c[3]) === null || _g === void 0 ? void 0 : _g.v) !== null && _h !== void 0 ? _h : "").trim();
    const yearLevel = String((_k = (_j = row.c[4]) === null || _j === void 0 ? void 0 : _j.v) !== null && _k !== void 0 ? _k : "").trim();
    return { id, email, name, course, department: course, yearLevel };
};
const parseGvizResponse = (data) => {
    const jsonStr = data.substring(data.indexOf("(") + 1, data.lastIndexOf(")"));
    const json = JSON.parse(jsonStr);
    return json.table.rows.filter(r => { var _a; return r.c && ((_a = r.c[0]) === null || _a === void 0 ? void 0 : _a.v); }).map(parseRow);
};
const fetchMasterlist = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch(GVIZ_URL);
        if (!response.ok) {
            throw new error_1.default(http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE, `Google Sheets error (${response.status}). Ensure the sheet is shared publicly.`);
        }
        return parseGvizResponse(yield response.text());
    }
    catch (err) {
        if (err instanceof error_1.default)
            throw err;
        throw new error_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch student masterlist from Google Sheets.");
    }
});
// ── Public service methods ────────────────────────────────────────────────────
const getStudentById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const masterlist = yield fetchMasterlist();
    const search = normalizeId(id);
    const student = masterlist.find(s => normalizeId(s.id) === search);
    if (!student) {
        throw new error_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `Student with ID "${id}" not found in Masterlist.`);
    }
    return student;
});
const getStudentByDetails = (name, email) => __awaiter(void 0, void 0, void 0, function* () {
    const masterlist = yield fetchMasterlist();
    const searchName = (name || "").toLowerCase().trim();
    const searchEmail = (email || "").toLowerCase().trim();
    // Extract numeric ID from email like "20221270@nbsc.edu.ph" → "20221270"
    const emailLocalPart = searchEmail.split("@")[0];
    const searchId = normalizeId(emailLocalPart);
    // ── Fast path: if email looks like an NBSC email or pure digits, try direct ID lookup first ──
    if (searchEmail && (searchEmail.includes("@nbsc.edu.ph") || /^\d{6,10}$/.test(emailLocalPart))) {
        const byId = masterlist.find(s => normalizeId(s.id) === searchId);
        if (byId)
            return byId;
        // Also try exact email match
        const byEmail = masterlist.find(s => s.email.toLowerCase() === searchEmail);
        if (byEmail)
            return byEmail;
    }
    const normalizeName = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/).filter(Boolean).sort().join(" ");
    const normalizedSearch = normalizeName(searchName);
    const scored = masterlist.map(s => {
        let score = 0;
        const rowId = normalizeId(s.id);
        const rowEmail = s.email.toLowerCase();
        const rowName = s.name.toLowerCase();
        // Email / ID signals
        if (searchEmail) {
            if (rowEmail === searchEmail)
                score += 100;
            if (rowId === searchId)
                score += 100;
        }
        // Name matching — each word in the search must appear in the row name
        if (searchName) {
            const normalizedRow = normalizeName(rowName);
            const terms = searchName.split(/\s+/).filter(Boolean);
            // Every search term present anywhere in the full name
            const matches = terms.filter(t => rowName.includes(t)).length;
            if (normalizedRow === normalizedSearch)
                score += 60;
            else if (matches === terms.length)
                score += 50;
            else if (matches > 0)
                score += Math.round((matches / terms.length) * 30);
        }
        return { student: s, score };
    });
    // Lower minimum threshold to 10 so partial name matches still work
    const best = scored.filter(c => c.score >= 10).sort((a, b) => b.score - a.score)[0];
    if (!best) {
        throw new error_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Student not found in Masterlist. Please check the name or email.");
    }
    return best.student;
});
const validateForRegistration = (schoolId) => __awaiter(void 0, void 0, void 0, function* () {
    const masterlist = yield fetchMasterlist();
    const search = normalizeId(schoolId);
    const student = masterlist.find(s => normalizeId(s.id) === search);
    if (!student) {
        throw new error_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "School ID not found in masterlist. Contact your registrar.");
    }
    const existing = yield prisma_1.default.user.findFirst({ where: { schoolId: student.id } });
    if (existing) {
        throw new error_1.default(http_status_codes_1.StatusCodes.CONFLICT, "An account with this School ID already exists. Please sign in.");
    }
    return {
        schoolId: student.id,
        name: student.name,
        email: student.email,
        course: student.course,
        department: student.department,
        yearLevel: student.yearLevel,
    };
});
const createOrUpdateStudent = (_data) => __awaiter(void 0, void 0, void 0, function* () {
    throw new error_1.default(http_status_codes_1.StatusCodes.METHOD_NOT_ALLOWED, "Manage the student masterlist directly in Google Sheets.");
});
exports.studentService = {
    getStudentById,
    getStudentByDetails,
    validateForRegistration,
    createOrUpdateStudent,
};
