import express from "express";
import { studentController } from "./student.controller";
import auth from "../../midddlewares/auth";

const router = express.Router();

router.get("/debug/masterlist",        studentController.debugMasterlist);
router.get("/details",                 studentController.getStudentByDetails);

router.get("/validate-registration",   studentController.validateRegistration);

// ── Existing ──────────────────────────────────────────────────────────────────
router.get("/:id",                     studentController.getStudentById);
router.post("/upsert", auth(),         studentController.upsertStudent);

export const studentRoutes = router;