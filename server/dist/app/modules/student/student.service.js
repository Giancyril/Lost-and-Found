"use strict";
// student.service.ts
// Fix: return `department` as alias for `course` so all consumers
// (ReportLostItem, BarcodeScannerModal, handleFetchDetails) get the
// field they expect without any frontend changes.
//
// Cache upgrade: fetchMasterlist() now checks Redis first (< 5 ms).
// Gviz is only hit on a cache miss (cold start or expired TTL).
// The background sync job (masterlist.sync.ts) keeps Redis warm every 6 h.
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
const axios_1 = __importDefault(require("axios"));
const masterlist_cache_1 = require("./masterlist.cache");
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
    try {
        const startIdx = data.indexOf("(");
        const endIdx = data.lastIndexOf(")");
        if (startIdx === -1 || endIdx === -1) {
            console.error("[Masterlist] Invalid Gviz response format. Raw data starts with:", data.substring(0, 100));
            throw new Error("Invalid Gviz response format (missing parentheses)");
        }
        const jsonStr = data.substring(startIdx + 1, endIdx);
        const json = JSON.parse(jsonStr);
        if (!json.table || !json.table.rows) {
            console.error("[Masterlist] Unexpected JSON structure:", JSON.stringify(json).substring(0, 200));
            throw new Error("Gviz response missing table/rows");
        }
        return json.table.rows.filter(r => { var _a; return r.c && ((_a = r.c[0]) === null || _a === void 0 ? void 0 : _a.v); }).map(parseRow);
    }
    catch (err) {
        console.error("[Masterlist] Parsing Failure:", err.message);
        throw err;
    }
};
// ── Masterlist fetcher (cache-first) ─────────────────────────────────────────
/**
 * Returns the full student masterlist.
 *
 * Priority:
 *   1. Redis cache  → sub-5 ms, works during Sheets outages
 *   2. Gviz (live)  → fallback on cache miss or Redis unavailability
 *
 * All existing Gviz logic (axios, User-Agent header, 10s timeout,
 * parseGvizResponse error handling) is preserved unchanged.
 */
const fetchMasterlist = () => __awaiter(void 0, void 0, void 0, function* () {
    // ── 1. Try Redis cache ──────────────────────────────────────────────────────
    try {
        const cached = yield (0, masterlist_cache_1.getMasterlistCache)();
        if (cached && cached.length > 0) {
            console.log(`[Masterlist] Cache hit – ${cached.length} students`);
            return cached;
        }
        console.log("[Masterlist] Cache miss – falling back to Gviz");
    }
    catch (cacheErr) {
        // Redis is down / unreachable — degrade gracefully to Gviz
        console.warn("[Masterlist] Redis unavailable, falling back to Gviz:", cacheErr);
    }
    // ── 2. Fallback: Gviz (Google Sheets) ───────────────────────────────────────
    try {
        console.log("[Masterlist] Fetching from:", GVIZ_URL);
        const response = yield axios_1.default.get(GVIZ_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
            timeout: 10000, // 10s timeout
        });
        if (response.status !== 200) {
            console.error("[Masterlist] Google Sheets HTTP Error:", response.status, response.statusText);
            throw new error_1.default(http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE, `Google Sheets error (${response.status}). Check if the sheet is public.`);
        }
        return parseGvizResponse(response.data);
    }
    catch (err) {
        console.error("[Masterlist] Pipeline Failure:", {
            message: err.message,
            url: GVIZ_URL,
        });
        if (err instanceof error_1.default)
            throw err;
        throw new error_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to fetch student masterlist: ${err.message}`);
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
    let searchName = (name || "").toLowerCase().trim();
    let searchEmail = (email || "").toLowerCase().trim();
    // Robust check: If name looks like an email or student ID, and searchEmail is empty, swap/fix them!
    // This gracefully handles browser auto-fill/user-input mixups where the email/ID is pasted into the "Your Name" input.
    if (searchName && !searchEmail) {
        const isEmail = searchName.includes("@");
        const isId = /^\d{6,12}$|^\d{4}-\d{2}-\d{2}$/.test(searchName.replace(/[-\s]/g, ""));
        if (isEmail || isId) {
            searchEmail = searchName;
            searchName = "";
        }
    }
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
