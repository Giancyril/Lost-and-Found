import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../../config/prisma";
import axios from "axios";

let genAIInstance: GoogleGenerativeAI | null = null;

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[AI] Critical Error: GEMINI_API_KEY is missing from environment variables");
    throw new Error("AI Service configuration error: API Key missing");
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
};

/**
 * AI Service to handle image recognition and feature extraction
 */
const recognizeImage = async (imageSource: string | Buffer, mimeType = "image/jpeg") => {
  try {
    const genAI = getGenAI();

    let base64Data: string;

    // 1. Handle different image source types
    console.log("[AI] Image Source Type:", Buffer.isBuffer(imageSource) ? "Buffer" : typeof imageSource);
    console.log("[AI] MimeType:", mimeType);

    if (Buffer.isBuffer(imageSource)) {
      // Handle Buffer (from Multer)
      base64Data = imageSource.toString("base64");
    } else if (typeof imageSource === "string" && imageSource.startsWith("http")) {
      // Handle Public URL
      console.log("[AI] Fetching from URL:", imageSource);
      const response = await axios.get(imageSource, { responseType: "arraybuffer" });
      base64Data = Buffer.from(response.data, "binary").toString("base64");
      mimeType = response.headers["content-type"] || mimeType;
    } else if (typeof imageSource === "string") {
      // Handle Base64
      base64Data = imageSource.includes("base64,") 
        ? imageSource.split("base64,")[1] 
        : imageSource;
      
      if (imageSource.includes("data:")) {
        const match = imageSource.match(/data:([^;]+);/);
        if (match) mimeType = match[1];
      }
    } else {
      throw new Error("Invalid image source provided");
    }

    // 2. Fetch available categories from the database
    const categories = await prisma.itemCategory.findMany({
      where: {},
      select: { id: true, name: true }
    });
    console.log("[AI] Categories found:", categories.length);

    // 3. Initialize Gemini model (Updated to latest flash alias)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 4. Construct the prompt
    const prompt = `
    You are an AI assistant for a campus Lost and Found system called "Lost & Found NBSC".
    Analyze the uploaded image and provide metadata for reporting this item.
    
    Instructions:
    1. Identify what the item is (Item Name).
    2. Choose the BEST category from the provided list.
    3. Extract features like color, brand, and condition.
    4. Write a professional description for the report.

    Available Categories (List of {id, name}):
    ${JSON.stringify(categories)}

    Output format (JSON only):
    {
      "itemName": "Example: Blue Nike Backpack",
      "categoryId": "the-uuid-from-the-list",
      "categoryName": "the-name-from-the-list",
      "description": "A detailed description of the item...",
      "color": "Primary color",
      "condition": "Visible condition (e.g., New, Used, Scratched)",
      "confidence": 0.95
    }

    Rules:
    - Return ONLY valid JSON.
    - If the item is not clear, provide your best guess with a lower confidence score.
    - If no category matches well, pick "Other" if it exists, or the closest relevant one.
    `;

    // 5. Generate content
    let result;
    try {
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ]);
    } catch (genError: any) {
      console.error("[AI] Gemini API Generation Error:", genError.message);
      throw new Error(`AI generation failed: ${genError.message}`);
    }

    const response = await result.response;
    let text = "";
    try {
      text = response.text().trim();
    } catch (textError: any) {
      console.error("[AI] Failed to extract text from response:", textError.message);
      throw new Error("AI returned an empty or invalid response");
    }

    // 6. Clean and parse response
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      const aiResult = JSON.parse(text);
      return aiResult;
    } catch (parseError) {
      console.error("[AI] Failed to parse AI response. Raw Text:", text.substring(0, 500));
      throw new Error("AI returned invalid data format");
    }
  } catch (error: any) {
    console.error("[AI] Image Recognition Pipeline Failure:", {
      message: error?.message,
      stack: error?.stack,
      details: error?.response?.data || error
    });
    throw error;
  }
};

export const aiRecognitionService = {
  recognizeImage,
};
