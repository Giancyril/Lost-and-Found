import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { studentService } from "./student.service";

const SHEET_ID = "1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI";
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Copy%20of%20Master%20List`;

const getStudentById = async (req: Request, res: Response) => {
  try {
    const result = await studentService.getStudentById(req.params.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Student retrieved successfully",
      data: result,
    });
  } catch (err: any) {
    sendResponse(res, {
      statusCode: err.statusCode ?? 400,
      success: false,
      message: err.message,
      data: null,
    });
  }
};

const getStudentByDetails = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.query as { name?: string; email?: string };
    const result = await studentService.getStudentByDetails(name || "", email || "");
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Student retrieved successfully",
      data: result,
    });
  } catch (err: any) {
    sendResponse(res, {
      statusCode: err.statusCode ?? 400,
      success: false,
      message: err.message,
      data: null,
    });
  }
};

const upsertStudent = async (req: Request, res: Response) => {
  try {
    const result = await studentService.createOrUpdateStudent(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Student data saved successfully",
      data: result,
    });
  } catch (err: any) {
    sendResponse(res, {
      statusCode: err.statusCode ?? 400,
      success: false,
      message: err.message,
      data: null,
    });
  }
};

// ── Debug endpoint — remove after fixing ─────────────────────────────────────
const debugMasterlist = async (req: Request, res: Response) => {
  try {
    const response = await fetch(GVIZ_URL);
    const text     = await response.text();
    const jsonStr  = text.substring(text.indexOf("(") + 1, text.lastIndexOf(")"));
    const json     = JSON.parse(jsonStr);

    const first5 = json.table.rows.slice(0, 5).map((row: any) => ({
      col0_raw:        row.c[0]?.v,
      col0_normalized: String(row.c[0]?.v ?? "").replace(/[-\s]/g, "").toLowerCase().trim(),
      col1_email:      row.c[1]?.v,
      col2_name:       row.c[2]?.v,
      col3_department: row.c[3]?.v,
    }));

    res.json({ total: json.table.rows.length, first5 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const studentController = {
  getStudentById,
  getStudentByDetails,
  upsertStudent,
  debugMasterlist,
};