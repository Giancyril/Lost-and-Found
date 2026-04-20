import axios from "axios";

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

async function seed() {
  console.log(`Starting seeding of ${students.length} students...`);
  
  for (const student of students) {
    try {
      await axios.post(API_URL, student, {
        headers: { Authorization: AUTH_TOKEN }
      });
      console.log(`✅ Seeded: ${student.name}`);
    } catch (err: any) {
      console.error(`❌ Failed: ${student.name} - ${err.message}`);
    }
  }
  
  console.log("Seeding complete!");
}

// seed(); // Uncomment to run
