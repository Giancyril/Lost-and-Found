"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const student_controller_1 = require("./student.controller");
const auth_1 = __importDefault(require("../../midddlewares/auth"));
const router = express_1.default.Router();
router.get("/debug/masterlist", student_controller_1.studentController.debugMasterlist);
router.get("/details", student_controller_1.studentController.getStudentByDetails);
router.get("/validate-registration", student_controller_1.studentController.validateRegistration);
// ── Existing ──────────────────────────────────────────────────────────────────
router.get("/:id", student_controller_1.studentController.getStudentById);
router.post("/upsert", (0, auth_1.default)(), student_controller_1.studentController.upsertStudent);
exports.studentRoutes = router;
