import { StatusCodes } from "http-status-codes";
import AppError from "../../global/error";

const SHEET_ID = "1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI";
const MASTERLIST_SHEET_NAME = "Copy of Master List";
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(MASTERLIST_SHEET_NAME)}`;

// ── Normalize ID — strip dashes/spaces so "2024-1521" matches "20241521" ──────
const normalizeId = (s: string) => s.replace(/[-\s]/g, "").toLowerCase().trim();

// ── Parse Google Sheets Gviz JSON response ────────────────────────────────────
const parseGvizResponse = (data: string) => {
  const jsonStr = data.substring(data.indexOf("(") + 1, data.lastIndexOf(")"));
  const json = JSON.parse(jsonStr);
  const rows = json.table.rows;
  return rows
    .filter((row: any) => row.c && row.c[0]?.v)
    .map((row: any) => ({
      id:         String(row.c[0]?.v ?? "").trim(),
      email:      String(row.c[1]?.v ?? "").trim(),
      name:       String(row.c[2]?.v ?? "").trim(),
      department: String(row.c[3]?.v ?? "").trim(),
    }));
};

// ── Fetch and parse masterlist ────────────────────────────────────────────────
const fetchMasterlist = async () => {
  try {
    const response = await fetch(GVIZ_URL);
    if (!response.ok) {
      throw new AppError(
        StatusCodes.SERVICE_UNAVAILABLE,
        `Google Sheets error (${response.status}). Ensure the sheet is shared publicly.`
      );
    }
    const text = await response.text();
    return parseGvizResponse(text);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch student masterlist from Google Sheets."
    );
  }
};

// ── Get student by ID (Column A) ──────────────────────────────────────────────
const getStudentById = async (id: string) => {
  const masterlist = await fetchMasterlist();
  const searchId   = normalizeId(id);

  const student = masterlist.find(
    (s: any) => normalizeId(s.id) === searchId
  );

  if (!student) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      `Student with ID "${id}" not found in Masterlist.`
    );
  }

  return student;
};

// ── Get student by Name and/or Email ─────────────────────────────────────────
const getStudentByDetails = async (name: string, email: string) => {
  const masterlist = await fetchMasterlist();

  const searchName  = (name  || "").toLowerCase().trim();
  const searchEmail = (email || "").toLowerCase().trim();
  const searchId    = normalizeId(searchEmail.split("@")[0]); // e.g. "20221270"

  const normalizeName = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean).sort().join(" ");

  const normalizedSearch = normalizeName(searchName);

  // ── Score each student ────────────────────────────────────────────────────
  const scored = masterlist.map((s: any) => {
    let score    = 0;
    const rowId    = normalizeId(s.id);
    const rowEmail = s.email.toLowerCase();
    const rowName  = s.name.toLowerCase();

    // Email / ID match — high priority
    if (searchEmail) {
      if (rowEmail === searchEmail || rowId === searchId || rowEmail === searchId) {
        score += 100;
      }
    }

    // Name fuzzy match
    if (searchName) {
      const normalizedRow = normalizeName(rowName);
      const terms   = searchName.split(/\s+/).filter(Boolean);
      const matches = terms.filter(t => rowName.includes(t)).length;

      if (normalizedRow === normalizedSearch) score += 60;
      else if (matches === terms.length)      score += 50;
      else if (matches > 0)                   score += (matches / terms.length) * 30;
    }

    return { student: s, score };
  });

  const best = scored
    .filter((c: any) => c.score > 0)
    .sort((a: any, b: any) => b.score - a.score)[0];

  if (!best) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Student not found in the Masterlist. Please check the name or email."
    );
  }

  return best.student;
};

// ── createOrUpdateStudent — managed via Google Sheets directly ────────────────
const createOrUpdateStudent = async (_data: any) => {
  throw new AppError(
    StatusCodes.METHOD_NOT_ALLOWED,
    "Manage student masterlist directly in Google Sheets."
  );
};

export const studentService = {
  getStudentById,
  getStudentByDetails,
  createOrUpdateStudent,
};