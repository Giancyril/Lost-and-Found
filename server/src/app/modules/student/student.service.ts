// student.service.ts — full updated file
// Changes from original:
//   - Added yearLevel column (col E) parsing
//   - Added validateForRegistration() which checks masterlist + DB duplicate
// Everything else is unchanged.

import { StatusCodes } from "http-status-codes";
import AppError from "../../global/error";
import prisma from "../../config/prisma";

const SHEET_ID = "1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI";
const MASTERLIST_SHEET_NAME = "Copy of Master List";
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(MASTERLIST_SHEET_NAME)}`;

const normalizeId = (s: string) => s.replace(/[-\s]/g, "").toLowerCase().trim();

const parseGvizResponse = (data: string) => {
  const jsonStr = data.substring(data.indexOf("(") + 1, data.lastIndexOf(")"));
  const json    = JSON.parse(jsonStr);
  return json.table.rows
    .filter((row: any) => row.c && row.c[0]?.v)
    .map((row: any) => ({
      id:        String(row.c[0]?.v ?? "").trim(),  // col A — School ID
      email:     String(row.c[1]?.v ?? "").trim(),  // col B — email
      name:      String(row.c[2]?.v ?? "").trim(),  // col C — full name
      course:    String(row.c[3]?.v ?? "").trim(),  // col D — course / department
      yearLevel: String(row.c[4]?.v ?? "").trim(),  // col E — year level
    }));
};

const fetchMasterlist = async () => {
  try {
    console.log("[Student] Fetching masterlist from:", GVIZ_URL);
    const response = await fetch(GVIZ_URL);
    console.log("[Student] Sheet response status:", response.status);
    if (!response.ok) {
      throw new AppError(
        StatusCodes.SERVICE_UNAVAILABLE,
        `Google Sheets error (${response.status}). Ensure the sheet is shared publicly.`
      );
    }
    const text = await response.text();
    console.log("[Student] Raw response preview:", text.substring(0, 200));
    return parseGvizResponse(text);
  } catch (error: any) {
    console.error("[Student] fetchMasterlist error:", error.message);
    if (error instanceof AppError) throw error;
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch student masterlist from Google Sheets."
    );
  }
};

const getStudentById = async (id: string) => {
  const masterlist = await fetchMasterlist();
  const searchId   = normalizeId(id);
  const student    = masterlist.find((s: any) => normalizeId(s.id) === searchId);

  if (!student) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      `Student with ID "${id}" not found in Masterlist.`
    );
  }

  return student;
};

const getStudentByDetails = async (name: string, email: string) => {
  const masterlist  = await fetchMasterlist();
  const searchName  = (name  || "").toLowerCase().trim();
  const searchEmail = (email || "").toLowerCase().trim();
  const searchId    = normalizeId(searchEmail.split("@")[0]);

  const normalizeName = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean).sort().join(" ");

  const normalizedSearch = normalizeName(searchName);

  const scored = masterlist.map((s: any) => {
    let score      = 0;
    const rowId    = normalizeId(s.id);
    const rowEmail = s.email.toLowerCase();
    const rowName  = s.name.toLowerCase();

    if (searchEmail) {
      if (rowEmail === searchEmail || rowId === searchId || rowEmail === searchId) score += 100;
    }
    if (searchName) {
      const normalizedRow = normalizeName(rowName);
      const terms   = searchName.split(/\s+/).filter(Boolean);
      const matches = terms.filter((t: string) => rowName.includes(t)).length;
      if (normalizedRow === normalizedSearch)  score += 60;
      else if (matches === terms.length)       score += 50;
      else if (matches > 0)                    score += (matches / terms.length) * 30;
    }
    return { student: s, score };
  });

  const best = scored
    .filter((c: any) => c.score > 0)
    .sort((a: any, b: any) => b.score - a.score)[0];

  if (!best) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Student not found in Masterlist. Please check the name or email."
    );
  }

  return best.student;
};

// ── Validate School ID for registration ───────────────────────────────────────
// 1. Looks up the schoolId in the Google Sheet masterlist
// 2. Checks if a User with that schoolId already exists in the DB
// 3. Returns student data if valid, throws if not found or duplicate
const validateForRegistration = async (schoolId: string) => {
  const masterlist = await fetchMasterlist();
  const searchId   = normalizeId(schoolId);
  const student    = masterlist.find((s: any) => normalizeId(s.id) === searchId);

  if (!student) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "School ID not found in masterlist. Contact your registrar."
    );
  }

  const existing = await prisma.user.findFirst({
    where: { schoolId: student.id },
  });

  if (existing) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "An account with this School ID already exists. Please sign in."
    );
  }

  return {
    schoolId:  student.id,
    name:      student.name,
    email:     student.email,
    course:    student.course,
    yearLevel: student.yearLevel,
  };
};

const createOrUpdateStudent = async (_data: any) => {
  throw new AppError(
    StatusCodes.METHOD_NOT_ALLOWED,
    "Manage the student masterlist directly in Google Sheets."
  );
};

export const studentService = {
  getStudentById,
  getStudentByDetails,
  validateForRegistration,
  createOrUpdateStudent,
};