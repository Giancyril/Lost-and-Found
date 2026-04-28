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
const axios_1 = __importDefault(require("axios"));
/**
 * SEEDING SCRIPT: Import Student Masterlist
 * Instructions:
 * 1. Export your Google Sheet as a JSON array or copy-paste your data into the 'students' array below.
 * 2. Run this script: npx ts-node src/app/modules/student/seedScript.ts
 */
const API_URL = "http://localhost:5000/api/students/upsert";
const AUTH_TOKEN = "YOUR_ADMIN_TOKEN_HERE"; // Get this from localStorage or Login response
const students = [
    // Example data format from your Sheet
    { id: "20250101", name: "John Doe", email: "johndoe@nbsc.edu.ph", department: "BSIT" },
    { id: "20250102", name: "Jane Smith", email: "janesmith@nbsc.edu.ph", department: "BSBA" },
    // ... paste your 1000+ rows here
];
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Starting seeding of ${students.length} students...`);
        for (const student of students) {
            try {
                yield axios_1.default.post(API_URL, student, {
                    headers: { Authorization: AUTH_TOKEN }
                });
                console.log(`✅ Seeded: ${student.name}`);
            }
            catch (err) {
                console.error(`❌ Failed: ${student.name} - ${err.message}`);
            }
        }
        console.log("Seeding complete!");
    });
}
// seed(); // Uncomment to run
