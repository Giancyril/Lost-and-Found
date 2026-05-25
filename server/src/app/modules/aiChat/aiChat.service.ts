import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiSearchService } from "../aiSearch/aiSearch.service";
import prisma from "../../config/prisma";
import { JwtPayload } from "jsonwebtoken";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const handleChat = async (messages: { role: string; content: string }[], user?: JwtPayload) => {
  if (!messages || messages.length === 0) throw new Error("No messages provided");
  
  const latestMessage = messages[messages.length - 1].content;

  // 1. Classify Intent
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const intentPrompt = `
  Analyze the following user message from a Lost and Found system: "${latestMessage}"
  Is the user searching for an item, or just chatting/asking general questions?
  Reply ONLY with JSON format, no backticks, no other text:
  {
    "intent": "search" | "general",
    "searchQuery": "if intent is search, extract the key search terms (e.g. blue bag library), else empty string"
  }
  `;

  let intentData = { intent: "general", searchQuery: "" };
  try {
    const intentResult = await model.generateContent(intentPrompt);
    const text = intentResult.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    intentData = JSON.parse(text);
  } catch (e) {
    console.error("Error parsing intent, falling back to general chat", e);
  }

  let searchContext = "";
  let searchResults = null;

  // 2. If search intent, perform search
  if (intentData.intent === "search" && intentData.searchQuery) {
    searchResults = await aiSearchService.aiSearchItems(intentData.searchQuery);
    
    const foundItemsStr = searchResults.foundItems.map((i: any) => `- ID: ${i.id}, Name: ${i.foundItemName}, Location: ${i.location}`).join("\n");
    const lostItemsStr = searchResults.lostItems.map((i: any) => `- ID: ${i.id}, Name: ${i.lostItemName}, Location: ${i.location}`).join("\n");

    searchContext = `
    Database Search Results for "${intentData.searchQuery}":
    Found Items in Database: 
    ${foundItemsStr || "None"}

    Lost Items in Database:
    ${lostItemsStr || "None"}
    `;
  }

  // 3. Generate conversational reply
  const chatModel = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction: `You are Nereid, the highly intelligent and friendly NBSC Lost & Found AI assistant.
Your goal is to help users find lost items, guide them through the platform, and provide real-time updates.
Always be concise, extremely polite, and use emojis naturally. 
CRITICAL: Always format your responses beautifully using Markdown! Use **bold text** for emphasis, bullet points for lists, and keep paragraphs short.
Do not hallucinate items that are not in the search results context. If there are no matches, kindly suggest they report the item.

System Guide (Use this to answer 'how-to' questions step-by-step instead of just telling them to visit the dashboard):
- To report a lost item: Navigate to the "Lost Items" page and click the "+ Report Lost Item" button. Fill out the details including category, description, and date lost.
- To submit a found item: You cannot log found items online yourself. If you found an item, please surrender it directly to the SAS (Student Affairs and Services) office so they can officially log it into the system and keep it secure.
- To claim an item: Browse the "Found Items" page. When you recognize your item, click the "Claim" button. You must provide proof of ownership (like specific distinguishing features).
- Chatting: Once a claim is submitted, you can chat with the reporter to coordinate returning the item.
- Points: You earn points and achievements for returning found items.`
  });

  // Convert messages to Gemini format (ensure history starts with user, or filter out initial model greeting)
  const rawHistory = messages.slice(0, -1);
  const formattedHistory = rawHistory
    .filter((msg, idx) => !(idx === 0 && msg.role === 'model')) // Remove initial model greeting if it's the first message
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

  const chat = chatModel.startChat({
    history: formattedHistory
  });

  // Fetch basic system stats to give the AI context about the database size
  const foundItemsCount = await prisma.foundItem.count({ where: { isDeleted: false, isClaimed: false } });
  const lostItemsCount = await prisma.lostItem.count({ where: { isDeleted: false, isFound: false } });
  
  const systemContext = `
  System Database Stats:
  - Unclaimed Found Items available: ${foundItemsCount}
  - Unresolved Lost Items reported: ${lostItemsCount}
  `;

  const userContext = user?.id ? `\nYou are currently talking to an authenticated user named ${user.name || user.username}. Address them nicely if appropriate.` : `\nYou are talking to a guest or student user.`;

  const finalPrompt = `
  User Message: ${latestMessage}
  ${userContext}
  ${systemContext}
  ${searchContext ? `\nContext from Database Search (DO NOT SHOW JSON to user, just summarize):\n${searchContext}` : ''}
  `;

  const result = await chat.sendMessage(finalPrompt);
  
  return {
    reply: result.response.text(),
    searchResults: searchResults
  };
};

export const aiChatService = {
  handleChat
};
