import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../../config/prisma";
import crypto from "crypto";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// ── Vector Search Configuration ───────────────────────────────────────────────
const SIMILARITY_THRESHOLD = 0.60;
const MAX_RESULTS = 5;

// ── In-Memory Embedding Cache ─────────────────────────────────────────────────
// Map structure: Item ID -> { hash: "md5_of_content", vector: [0.1, 0.4...] }
const embeddingCache = new Map<string, { hash: string; vector: number[] }>();

// ── Math: Cosine Similarity ───────────────────────────────────────────────────
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper to generate a text string for an item that captures its semantic meaning
const createItemString = (item: any, type: "found" | "lost") => {
  const name = type === "found" ? item.foundItemName : item.lostItemName;
  const category = item.category?.name || "Uncategorized";
  const desc = item.description || "";
  const loc = item.location || "";
  return `${category} | ${name} | ${desc} | ${loc}`.toLowerCase().trim();
};

const createHash = (content: string) => {
  return crypto.createHash("md5").update(content).digest("hex");
};

// Generates an embedding vector using the Gemini API
const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    const result = await embeddingModel.embedContent(text);
    const embedding = result.embedding;
    return embedding.values;
  } catch (error) {
    console.error("Failed to generate embedding for text:", text.slice(0, 50), error);
    return [];
  }
};

const aiSearchItems = async (searchQuery: string) => {
  console.log("[Semantic Search] Query:", searchQuery);
  
  try {
    // 1. Fetch active items from DB
    const [foundItems, lostItems] = await Promise.all([
      prisma.foundItem.findMany({
        where: { isDeleted: false, isClaimed: false },
        include: {
          category: true,
          user: { select: { id: true, username: true, email: true } },
        },
      }),
      prisma.lostItem.findMany({
        where: { isDeleted: false, isFound: false },
        include: {
          category: true,
          user: { select: { id: true, username: true, email: true } },
        },
      })
    ]);

    // 2. Generate embedding for the user's search query
    const queryEmbedding = await getEmbedding(searchQuery.toLowerCase().trim());
    if (queryEmbedding.length === 0) {
      throw new Error("Failed to generate embedding for the search query.");
    }

    // 3. Process Found Items
    const scoredFoundItems = [];
    for (const item of foundItems) {
      const content = createItemString(item, "found");
      const hash = createHash(content);
      
      let vector: number[] = [];
      const cached = embeddingCache.get(item.id);
      
      if (cached && cached.hash === hash && cached.vector.length > 0) {
        vector = cached.vector;
      } else {
        vector = await getEmbedding(content);
        if (vector.length > 0) {
          embeddingCache.set(item.id, { hash, vector });
        }
      }

      if (vector.length > 0) {
        const score = cosineSimilarity(queryEmbedding, vector);
        if (score >= SIMILARITY_THRESHOLD) {
          scoredFoundItems.push({ item, score });
        }
      }
    }

    // 3. Process Lost Items
    const scoredLostItems = [];
    for (const item of lostItems) {
      const content = createItemString(item, "lost");
      const hash = createHash(content);
      
      let vector: number[] = [];
      const cached = embeddingCache.get(item.id);
      
      if (cached && cached.hash === hash && cached.vector.length > 0) {
        vector = cached.vector;
      } else {
        vector = await getEmbedding(content);
        if (vector.length > 0) {
          embeddingCache.set(item.id, { hash, vector });
        }
      }

      if (vector.length > 0) {
        const score = cosineSimilarity(queryEmbedding, vector);
        if (score >= SIMILARITY_THRESHOLD) {
          scoredLostItems.push({ item, score });
        }
      }
    }

    // 4. Sort by score descending and take Top N
    scoredFoundItems.sort((a, b) => b.score - a.score);
    scoredLostItems.sort((a, b) => b.score - a.score);

    const matchedFoundItems = scoredFoundItems.slice(0, MAX_RESULTS).map(s => s.item);
    const matchedLostItems = scoredLostItems.slice(0, MAX_RESULTS).map(s => s.item);

    console.log(`[Semantic Search] Found ${matchedFoundItems.length} found items and ${matchedLostItems.length} lost items with similarity >= ${SIMILARITY_THRESHOLD}`);

    return {
      foundItems: matchedFoundItems,
      lostItems: matchedLostItems,
      reasoning: "Semantic embedding vector similarity search.",
      totalFound: matchedFoundItems.length,
      totalLost: matchedLostItems.length,
    };

  } catch (error) {
    console.error("AI Semantic Search Error:", error);
    // Fallback to simple text search if the embedding API fails
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

// Fallback simple keyword search function
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
    reasoning: "Fallback simple text-based search results",
    totalFound: matchedFoundItems.length,
    totalLost: matchedLostItems.length,
  };
};

export const aiSearchService = {
  aiSearchItems,
};
