// student.service.ts
// Fix: return `department` as alias for `course` so all consumers
// (ReportLostItem, BarcodeScannerModal, handleFetchDetails) get the
// field they expect without any frontend changes.

import { StatusCodes } from "http-status-codes";
import AppError from "../../global/error";
import prisma from "../../config/prisma";

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
  const jsonStr = data.substring(data.indexOf("(") + 1, data.lastIndexOf(")"));
  const json    = JSON.parse(jsonStr);
  return (json.table.rows as any[]).filter(r => r.c && r.c[0]?.v).map(parseRow);
};

const fetchMasterlist = async () => {
  try {
    const response = await fetch(GVIZ_URL);
    if (!response.ok) {
      throw new AppError(
        StatusCodes.SERVICE_UNAVAILABLE,
        `Google Sheets error (${response.status}). Ensure the sheet is shared publicly.`
      );
    }
    return parseGvizResponse(await response.text());
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch student masterlist from Google Sheets."
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