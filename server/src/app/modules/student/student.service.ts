// student.service.ts
// Fix: return `department` as alias for `course` so all consumers
// (ReportLostItem, BarcodeScannerModal, handleFetchDetails) get the
// field they expect without any frontend changes.

import { StatusCodes } from "http-status-codes";
import AppError from "../../global/error";
import prisma from "../../config/prisma";
import axios from "axios";

const SHEET_ID         = "1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI";
const MASTERLIST_SHEET = "Copy of Master List";
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(MASTERLIST_SHEET)}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalizeId = (s: string) =>
  String(s ?? "").replace(/[-\s]/g, "").toLowerCase().trim();

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
const parseRow = (row: any) => {
  const id        = String(row.c[0]?.v ?? "").trim();
  const email     = String(row.c[1]?.v ?? "").trim();
  const name      = String(row.c[2]?.v ?? "").trim();
  const course    = String(row.c[3]?.v ?? "").trim();
  const yearLevel = String(row.c[4]?.v ?? "").trim();
  return { id, email, name, course, department: course, yearLevel };
};

const parseGvizResponse = (data: string) => {
  try {
    const startIdx = data.indexOf("(");
    const endIdx = data.lastIndexOf(")");
    
    if (startIdx === -1 || endIdx === -1) {
      console.error("[Masterlist] Invalid Gviz response format. Raw data starts with:", data.substring(0, 100));
      throw new Error("Invalid Gviz response format (missing parentheses)");
    }

    const jsonStr = data.substring(startIdx + 1, endIdx);
    const json    = JSON.parse(jsonStr);
    
    if (!json.table || !json.table.rows) {
      console.error("[Masterlist] Unexpected JSON structure:", JSON.stringify(json).substring(0, 200));
      throw new Error("Gviz response missing table/rows");
    }

    return (json.table.rows as any[]).filter(r => r.c && r.c[0]?.v).map(parseRow);
  } catch (err: any) {
    console.error("[Masterlist] Parsing Failure:", err.message);
    throw err;
  }
};

const fetchMasterlist = async () => {
  try {
    console.log("[Masterlist] Fetching from:", GVIZ_URL);
    const response = await axios.get(GVIZ_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10s timeout
    });
    
    if (response.status !== 200) {
      console.error("[Masterlist] Google Sheets HTTP Error:", response.status, response.statusText);
      throw new AppError(
        StatusCodes.SERVICE_UNAVAILABLE,
        `Google Sheets error (${response.status}). Check if the sheet is public.`
      );
    }

    return parseGvizResponse(response.data);
  } catch (err: any) {
    console.error("[Masterlist] Pipeline Failure:", {
      message: err.message,
      url: GVIZ_URL
    });
    if (err instanceof AppError) throw err;
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to fetch student masterlist: ${err.message}`
    );
  }
};

// ── Public service methods ────────────────────────────────────────────────────

const getStudentById = async (id: string) => {
  const masterlist = await fetchMasterlist();
  const search     = normalizeId(id);
  const student    = masterlist.find(s => normalizeId(s.id) === search);
  if (!student) {
    throw new AppError(StatusCodes.NOT_FOUND, `Student with ID "${id}" not found in Masterlist.`);
  }
  return student;
};

const getStudentByDetails = async (name: string, email: string) => {
  const masterlist  = await fetchMasterlist();
  const searchName  = (name  || "").toLowerCase().trim();
  const searchEmail = (email || "").toLowerCase().trim();

  // Extract numeric ID from email like "20221270@nbsc.edu.ph" → "20221270"
  const emailLocalPart = searchEmail.split("@")[0];
  const searchId       = normalizeId(emailLocalPart);

  // ── Fast path: if email looks like an NBSC email or pure digits, try direct ID lookup first ──
  if (searchEmail && (searchEmail.includes("@nbsc.edu.ph") || /^\d{6,10}$/.test(emailLocalPart))) {
    const byId = masterlist.find(s => normalizeId(s.id) === searchId);
    if (byId) return byId;
    // Also try exact email match
    const byEmail = masterlist.find(s => s.email.toLowerCase() === searchEmail);
    if (byEmail) return byEmail;
  }

  const normalizeName = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/).filter(Boolean).sort().join(" ");

  const normalizedSearch = normalizeName(searchName);

  const scored = masterlist.map(s => {
    let score      = 0;
    const rowId    = normalizeId(s.id);
    const rowEmail = s.email.toLowerCase();
    const rowName  = s.name.toLowerCase();

    // Email / ID signals
    if (searchEmail) {
      if (rowEmail === searchEmail)   score += 100;
      if (rowId    === searchId)      score += 100;
    }

    // Name matching — each word in the search must appear in the row name
    if (searchName) {
      const normalizedRow = normalizeName(rowName);
      const terms   = searchName.split(/\s+/).filter(Boolean);
      // Every search term present anywhere in the full name
      const matches = terms.filter(t => rowName.includes(t)).length;

      if (normalizedRow === normalizedSearch) score += 60;
      else if (matches === terms.length)      score += 50;
      else if (matches > 0)                   score += Math.round((matches / terms.length) * 30);
    }

    return { student: s, score };
  });

  // Lower minimum threshold to 10 so partial name matches still work
  const best = scored.filter(c => c.score >= 10).sort((a, b) => b.score - a.score)[0];
  if (!best) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Student not found in Masterlist. Please check the name or email."
    );
  }
  return best.student;
};

const validateForRegistration = async (schoolId: string) => {
  const masterlist = await fetchMasterlist();
  const search     = normalizeId(schoolId);
  const student    = masterlist.find(s => normalizeId(s.id) === search);

  if (!student) {
    throw new AppError(StatusCodes.NOT_FOUND, "School ID not found in masterlist. Contact your registrar.");
  }

  const existing = await prisma.user.findFirst({ where: { schoolId: student.id } });
  if (existing) {
    throw new AppError(StatusCodes.CONFLICT, "An account with this School ID already exists. Please sign in.");
  }

  return {
    schoolId:   student.id,
    name:       student.name,
    email:      student.email,
    course:     student.course,
    department: student.department,
    yearLevel:  student.yearLevel,
  };
};

const createOrUpdateStudent = async (_data: any) => {
  throw new AppError(StatusCodes.METHOD_NOT_ALLOWED, "Manage the student masterlist directly in Google Sheets.");
};

export const studentService = {
  getStudentById,
  getStudentByDetails,
  validateForRegistration,
  createOrUpdateStudent,
};