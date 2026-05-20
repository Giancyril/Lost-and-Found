const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "../.env" });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing!");
    return;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  console.log("Listing models...");
  
  // Actually, we can use the genAI's API or just query using fetch to be 100% robust.
  // Let's do a direct fetch to the listModels API endpoint using our API key.
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      console.log("Available models:");
      data.models.forEach(m => {
        console.log(`- ${m.name} (${m.displayName}) - Supported methods: ${m.supportedGenerationMethods.join(", ")}`);
      });
    } else {
      console.log("Response:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels().catch(console.error);
