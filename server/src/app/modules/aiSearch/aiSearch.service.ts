import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../../config/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Gemini API calls
async function safeGenerate(model: any, prompt: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (err: any) {
      if (err.status === 503 && i < retries - 1) {
        console.warn(`Gemini overloaded. Retrying... attempt ${i + 1}`);
        await new Promise((res) => setTimeout(res, (i + 1) * 1000)); 
      } else {
        throw err;
      }
    }
  }
}

const aiSearchItems = async (searchQuery: string) => {
  console.log("User search:", searchQuery);
  try {
    // Fetch found items
    const foundItems = await prisma.foundItem.findMany({
      where: { isDeleted: false, isClaimed: false },
      include: {
        category: true,
        user: { select: { id: true, username: true, email: true } },
      },
    });

    // Fetch lost items
    const lostItems = await prisma.lostItem.findMany({
      where: { isDeleted: false, isFound: false },
      include: {
        category: true,
        user: { select: { id: true, username: true, email: true } },
      },
    });

    // Simplify data
    const foundItemsData = foundItems.map((item) => ({
      id: item.id,
      name: item.foundItemName,
      description: item.description,
      category: item.category?.name || "",
      location: item.location,
      date: item.date,
    }));

    const lostItemsData = lostItems.map((item) => ({
      id: item.id,
      name: item.lostItemName,
      description: item.description,
      category: item.category?.name || "",
      location: item.location,
      date: item.date,
    }));

    // Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an AI assistant helping people find lost and found items.

    User search query: "${searchQuery}"

    Found items database:
    ${JSON.stringify(foundItemsData, null, 2)}

    Lost items database:
    ${JSON.stringify(lostItemsData, null, 2)}

    Please analyze the search query and return the most relevant items from both databases that match the search query.
    Consider keywords in the item name, description, category, and location.

    Return your response as a JSON object with this exact structure:
    {
      "matches": {
        "foundItems": [array of matching found item IDs],
        "lostItems": [array of matching lost item IDs]
      },
      "reasoning": "Brief explanation of why these items match"
    }

    Only return the JSON object, no additional text.
    `;

    const result = await safeGenerate(model, prompt);
    const response = await result.response;
    let aiResponse = response.text().trim();

    aiResponse = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let aiResult;
    try {
      aiResult = JSON.parse(aiResponse);
    } catch (error) {
      console.error("Error parsing AI response:", error, aiResponse);
      return performSimpleSearch(searchQuery, foundItems, lostItems);
    }

    // Filter matched items
    const matchedFoundItems = foundItems.filter((item) =>
      aiResult.matches.foundItems.includes(item.id)
    );
    const matchedLostItems = lostItems.filter((item) =>
      aiResult.matches.lostItems.includes(item.id)
    );

    return {
      foundItems: matchedFoundItems,
      lostItems: matchedLostItems,
      reasoning: aiResult.reasoning,
      totalFound: matchedFoundItems.length,
      totalLost: matchedLostItems.length,
    };
  } catch (error) {
    console.error("AI Search Error:", error);
    // fallback to simple search
    const foundItems = await prisma.foundItem.findMany({
      where: { isDeleted: false, isClaimed: false },
      include: {
        category: true,
        user: { select: { id: true, username: true, email: true } },
      },
    });

    const lostItems = await prisma.lostItem.findMany({
      where: { isDeleted: false, isFound: false },
      include: {
        category: true,
        user: { select: { id: true, username: true, email: true } },
      },
    });

    return performSimpleSearch(searchQuery, foundItems, lostItems);
  }
};

// Fallback simple search function
const performSimpleSearch = (
  searchQuery: string,
  foundItems: any[],
  lostItems: any[]
) => {
  const query = searchQuery.toLowerCase();

  const matchedFoundItems = foundItems.filter(
    (item) =>
      item.foundItemName.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category?.name.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query)
  );

  const matchedLostItems = lostItems.filter(
    (item) =>
      item.lostItemName.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category?.name.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query)
  );

  return {
    foundItems: matchedFoundItems,
    lostItems: matchedLostItems,
    reasoning: "Simple text-based search results",
    totalFound: matchedFoundItems.length,
    totalLost: matchedLostItems.length,
  };
};

export const aiSearchService = {
  aiSearchItems,
};
