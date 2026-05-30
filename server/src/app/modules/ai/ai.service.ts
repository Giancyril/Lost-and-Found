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

const generateContentWithRetry = async (genAI: any, prompt: any, options: any = {}, maxRetries = 3) => {
  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-pro"];
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName, ...options });
        const result = await model.generateContent(prompt);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AI] Attempt ${attempt + 1} with ${modelName} failed:`, error.message);
        if (error.message.includes("429") || error.message.includes("503")) {
          // Wait before retrying
          await new Promise(res => setTimeout(res, 1000 * (attempt + 1)));
          continue; // Try the next model
        }
        // For other errors, we might still want to try the next model just in case it's model-specific
        continue;
      }
    }
  }
  throw lastError;
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
      const contentType = response.headers["content-type"];
      if (typeof contentType === "string") {
        mimeType = contentType;
      }
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
      result = await generateContentWithRetry(genAI, [
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

/**
 * Analyzes the sentiment and material value of an item report to determine priority.
 */
const analyzeUrgency = async (name: string, description: string) => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    You are an AI moderator for a campus Lost and Found system called "Lost & Found NBSC".
    Analyze the following report and determine its urgency/priority.
    
    Item Name: "${name}"
    Description: "${description}"

    Criteria for HIGH/CRITICAL urgency:
    1. High-value items: Electronics (laptops, phones, tablets), high-end jewelry (rings, watches), wallets/cash, IDs/Passports/Legal documents.
    2. Emotional distress: The tone sounds extremely distressed, desperate, or mentions critical importance (e.g., "contains my thesis", "wedding ring", "last gift from family").
    3. Time-sensitivity: Mentions an immediate deadline or critical need for the item.

    Urgency Levels:
    - NORMAL: Regular items (water bottles, umbrellas, jackets, stationery).
    - HIGH: Expensive items (smartphones, average watches) or clearly upset tone.
    - CRITICAL: Life-changing items (passports, laptops with thesis, expensive medical devices) or extreme emotional breakdown.

    Output format (JSON only):
    {
      "urgencyScore": 0-100 (Integer),
      "urgencyLevel": "NORMAL" | "HIGH" | "CRITICAL",
      "urgencyReason": "Short explanation of why this priority was assigned"
    }

    Rules:
    - Return ONLY valid JSON.
    - Be objective but sensitive to emotional keywords.
    `;

    let result;
    try {
      result = await generateContentWithRetry(genAI, prompt);
    } catch (genError: any) {
      console.error("[AI] Gemini Urgency Analysis Error:", genError.message);
      return { urgencyScore: 0, urgencyLevel: "NORMAL", urgencyReason: "AI Service unavailable" };
    }

    const response = await result.response;
    let text = response.text().trim();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("[AI] Failed to parse Urgency AI response:", text);
      return { urgencyScore: 20, urgencyLevel: "NORMAL", urgencyReason: "Format error" };
    }
  } catch (error) {
    console.error("[AI] Urgency Analysis Pipeline Failure:", error);
    return { urgencyScore: 0, urgencyLevel: "NORMAL", urgencyReason: "System error" };
  }
};

/**
 * Analyzes a claim against the actual item description to detect fraud/guessing.
 */
const analyzeClaimFraud = async (claimantFeatures: string, itemDescription: string, itemName: string) => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    You are a Fraud Detection AI for a campus Lost and Found system called "Lost & Found NBSC".
    A student is trying to claim a found item. They must provide "distinguishing features" to prove ownership.
    Compare their provided features against the actual item details recorded by the finder/admin.
    
    Actual Item Name: "${itemName}"
    Actual Item Description: "${itemDescription}"
    
    Claimant's Provided Features: "${claimantFeatures}"

    Criteria for Fraud/Guessing:
    1. Vague/Generic: "It's a blue bottle", "It has a screen". (High risk if the actual item has very distinct marks they missed).
    2. Contradictory: Claimant says it's red, actual item is blue.
    3. Spot On: Claimant mentions specific scratches, stickers, or serial numbers that match the description perfectly.

    Output format (JSON only):
    {
      "fraudScore": 0-100 (Integer, where 100 means obvious fraud/guessing and 0 means verified owner),
      "isHighRisk": true/false (Set true if fraudScore >= 70),
      "fraudReason": "A brief, 1-2 sentence explanation of why this score was assigned."
    }

    Rules:
    - Return ONLY valid JSON.
    - Be strict against generic guessing (e.g. someone just saying "iphone" for a phone).
    `;

    let result;
    try {
      result = await generateContentWithRetry(genAI, prompt);
    } catch (genError: any) {
      console.error("[AI] Gemini Claim Fraud Analysis Error:", genError.message);
      return { fraudScore: 0, isHighRisk: false, fraudReason: "AI Service unavailable" };
    }

    const response = await result.response;
    let text = response.text().trim();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("[AI] Failed to parse Fraud AI response:", text);
      return { fraudScore: 0, isHighRisk: false, fraudReason: "AI format error" };
    }
  } catch (error) {
    console.error("[AI] Fraud Analysis Pipeline Failure:", error);
    return { fraudScore: 0, isHighRisk: false, fraudReason: "System error" };
  }
};

/**
 * Transcribes and parses a voice recording into structured lost/found item metadata using Gemini.
 */
const parseVoice = async (audioBuffer: Buffer, mimeType = "audio/webm") => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    // Fetch categories for context matching
    const categories = await prisma.itemCategory.findMany({
      select: { id: true, name: true }
    });

    const base64Data = audioBuffer.toString("base64");

    // Defensive check to map octet-stream/generic binary to audio/webm
    let resolvedMimeType = mimeType;
    if (resolvedMimeType === "application/octet-stream" || !resolvedMimeType) {
      resolvedMimeType = "audio/webm";
    }

    const prompt = `
    You are an exceptionally smart AI speech assistant for a campus Lost and Found system called "Lost & Found NBSC".
    Listen to the audio recording carefully and transcribe it, then extract all details to report a lost or found item.
    
    Instructions:
    1. Transcribe the audio word-for-word literally in the "transcription" field. This is critical as it anchors your understanding.
    2. Identify the specific "itemName" (e.g. "Silver JBL Wireless Headphones", "Black Nike Backpack"). Be specific and concise.
    3. Match the item category with the best fitting category ID from the provided Available Categories list.
    4. Extract the specific campus "location" where the item was lost or found.
    5. Write a professional, detailed "description" of the item, including colors, brand, or markings mentioned in the recording.
    6. Extract primary "color" and "condition" if mentioned.

    Available Categories (List of {id, name}):
    ${JSON.stringify(categories)}
    
    Output format (JSON only):
    {
      "transcription": "Verbatim, full word-for-word transcript of everything spoken in the audio file.",
      "itemName": "extracted specific item name",
      "categoryId": "the-uuid-from-the-category-list",
      "categoryName": "the-name-from-the-category-list",
      "location": "extracted campus location",
      "description": "professional description based on the audio recording details",
      "color": "extracted primary color or empty string",
      "condition": "extracted condition or empty string",
      "confidence": 0.0 to 1.0
    }
    
    Examples of Perfect Voice-to-JSON Parsing:

    Example 1:
    - Voice Input: "I just found some silver wireless JBL headphones on the corner library table... they look almost brand new."
    - Expected Output:
    {
      "transcription": "I just found some silver wireless JBL headphones on the corner library table... they look almost brand new.",
      "itemName": "Silver JBL Wireless Headphones",
      "categoryId": "electronics-uuid",
      "categoryName": "Electronics",
      "location": "Library second floor corner table",
      "description": "A pair of silver wireless JBL headphones in almost brand-new condition, found on a corner table in the library.",
      "color": "Silver",
      "condition": "New",
      "confidence": 0.98
    }

    Example 2:
    - Voice Input: "Uh, yeah, I lost a blue thermos water bottle, it has some stickers on it. I think I left it in the SWDC Building Room 205."
    - Expected Output:
    {
      "transcription": "Uh, yeah, I lost a blue thermos water bottle, it has some stickers on it. I think I left it in the SWDC Building Room 205.",
      "itemName": "Blue Thermos Water Bottle",
      "categoryId": "personal-items-uuid",
      "categoryName": "Personal Items",
      "location": "SWDC Building Room 205",
      "description": "A blue thermos water bottle featuring various stickers, reported lost in SWDC Building Room 205.",
      "color": "Blue",
      "condition": "Used",
      "confidence": 0.95
    }

    Example 3:
    - Voice Input: "Hey, I found a black jacket on the bench outside the SAS Office. It's quite dusty and looks like a medium size."
    - Expected Output:
    {
      "transcription": "Hey, I found a black jacket on the bench outside the SAS Office. It's quite dusty and looks like a medium size.",
      "itemName": "Black Medium Jacket",
      "categoryId": "clothing-uuid",
      "categoryName": "Clothing",
      "location": "SAS Office (Bench outside)",
      "description": "A medium-sized black jacket found on the bench outside the SAS Office. The jacket appears dusty.",
      "color": "Black",
      "condition": "Used",
      "confidence": 0.96
    }

    Rules:
    - Return ONLY valid JSON.
    - If a field is not explicitly spoken in the audio, make a highly reasonable inference or keep it blank ("").
    - Pick the category that is the absolute closest match. If "Other" exists, pick it if no other categories match.
    `;

    const result = await generateContentWithRetry(genAI, [
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: resolvedMimeType
        }
      }
    ], {
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const response = await result.response;
    let text = response.text().trim();
    
    // Clean codeblock markers
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (parseError) {
      console.error("[AI] Voice Parsing JSON Parse Error. Raw text:", text);
      throw new Error("AI returned invalid JSON format for voice parsing");
    }
  } catch (error: any) {
    console.error("[AI] Voice parsing pipeline failure:", error);
    throw error;
  }
};

/**
 * Writes an inspiring, heartwarming, and professional recognition/spotlight story based on administrator notes/bullet points.
 */
const writeSpotlightStory = async (bulletPoints: string) => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `
    You are an exceptionally engaging, empathetic, and professional AI Story Writer for a campus Lost and Found platform called "Lost & Found NBSC".
    Your task is to write a heartwarming, beautifully engaging, and professional spotlight story/article based on the short bullet points or notes provided by the administrator.
    This story is to recognize and celebrate the outstanding civic values and integrity of the students involved (such as returning a lost item or showing honesty).

    Admin Notes/Bullet Points:
    "${bulletPoints}"

    Instructions:
    1. Write a compelling title that grabs attention (e.g., "Honesty in Action: How a Lost Wallet Found Its Way Home"). Do not include quotes in the title string.
    2. Write a beautifully structured narrative story that highlights integrity, trustworthiness, and community spirit. Make it feel heartwarming and premium.
    3. Keep the story within 120-220 words.
    4. The output must be JSON format only, containing two fields: "title" and "description".

    Output format (JSON only):
    {
      "title": "A beautifully written headline",
      "description": "The complete narrative story/article text..."
    }

    Rules:
    - Return ONLY valid JSON.
    - Write in an inspiring, professional, and appreciative tone.
    `;

    let result;
    try {
      result = await generateContentWithRetry(genAI, prompt, {
        generationConfig: {
          responseMimeType: "application/json"
        }
      });
    } catch (genError: any) {
      console.error("[AI] Gemini Story Writing Error:", genError.message);
      throw new Error(`Gemini AI service unavailable: ${genError.message}`);
    }

    const response = await result.response;
    let text = response.text().trim();
    
    // Clean any accidental markdown codeblock wrappers
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (parseError) {
      console.error("[AI] Failed to parse Spotlight Story AI response. Raw Text:", text);
      throw new Error("AI returned invalid JSON format");
    }
  } catch (error: any) {
    console.error("[AI] Story Writing Pipeline Failure:", error);
    throw error;
  }
};

export const aiRecognitionService = {
  recognizeImage,
  analyzeUrgency,
  analyzeClaimFraud,
  parseVoice,
  writeSpotlightStory,
};
