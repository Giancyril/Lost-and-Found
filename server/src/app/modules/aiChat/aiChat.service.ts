import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { aiSearchService } from "../aiSearch/aiSearch.service";
import prisma from "../../config/prisma";
import { JwtPayload } from "jsonwebtoken";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-flash-latest";

// ── Stats Cache (5 min TTL) ───────────────────────────────────────────────────
let statsCache: { found: number; lost: number; claims: number } | null = null;
let statsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

const getSystemStats = async () => {
  if (statsCache && Date.now() - statsCacheTime < CACHE_TTL) return statsCache;
  try {
    const [found, lost, claims] = await Promise.all([
      prisma.foundItem.count({ where: { isDeleted: false, isClaimed: false } }),
      prisma.lostItem.count({ where: { isDeleted: false, isFound: false } }),
      prisma.claim.count({ where: { status: "PENDING" } }).catch(() => 0),
    ]);
    statsCache = { found, lost, claims };
    statsCacheTime = Date.now();
    return statsCache;
  } catch (e) {
    console.error("[Nereid] Stats fetch error:", e);
    return statsCache ?? { found: 0, lost: 0, claims: 0 };
  }
};

// ── Compress long histories ───────────────────────────────────────────────────
const summarizeHistory = (messages: { role: string; content: string }[]) => {
  if (messages.length <= 10) return messages;
  const recent = messages.slice(-10);
  const older = messages.slice(0, -10);
  const summary = older
    .map(m => `${m.role === "user" ? "User" : "Nereid"}: ${m.content.slice(0, 100)}`)
    .join(" → ");
  return [
    { role: "model", content: `[Conversation so far: ${summary}]` },
    ...recent,
  ];
};

// ── Format items richly for the model ─────────────────────────────────────────
const formatFoundItems = (items: any[]): string => {
  if (!items.length) return "None found in the system.";
  return items.slice(0, 5).map((i: any, idx: number) => {
    const lines = [
      `${idx + 1}. **${i.foundItemName}**`,
      `   - Location found: ${i.location || "Not specified"}`,
      `   - Category: ${i.category?.name || "Uncategorized"}`,
      `   - Description: ${i.description || "No description provided"}`,
      `   - Date found: ${i.foundDate ? new Date(i.foundDate).toLocaleDateString() : "Unknown"}`,
      `   - Item ID: ${i.id}`,
    ];
    return lines.join("\n");
  }).join("\n\n");
};

const formatLostItems = (items: any[]): string => {
  if (!items.length) return "None reported in the system.";
  return items.slice(0, 5).map((i: any, idx: number) => {
    const lines = [
      `${idx + 1}. **${i.lostItemName}**`,
      `   - Last seen: ${i.location || "Not specified"}`,
      `   - Category: ${i.category?.name || "Uncategorized"}`,
      `   - Description: ${i.description || "No description provided"}`,
      `   - Date lost: ${i.lostDate ? new Date(i.lostDate).toLocaleDateString() : "Unknown"}`,
      `   - Report ID: ${i.id}`,
    ];
    return lines.join("\n");
  }).join("\n\n");
};

// ── Tool Definitions ──────────────────────────────────────────────────────────
const tools: any = [
  {
    functionDeclarations: [
      {
        name: "searchDatabase",
        description: "Search the lost and found database for items matching a description. Call this whenever the user is asking about a lost or found item, looking for something, or asking if someone found their item.",
        parameters: {
          type: SchemaType ? SchemaType.OBJECT : "OBJECT",
          properties: {
            query: {
              type: SchemaType ? SchemaType.STRING : "STRING",
              description: "The item description to search for (e.g., 'blue backpack', 'iphone 12'). Keep it concise and keyword-focused.",
            },
          },
          required: ["query"],
        },
      },
    ],
  },
];

// ── Main handler ──────────────────────────────────────────────────────────────
const handleChat = async (
  messages: { role: string; content: string }[],
  user?: JwtPayload
) => {
  if (!messages || messages.length === 0) throw new Error("No messages provided");

  const latestMessage = messages[messages.length - 1].content;
  const history = messages.slice(0, -1);

  console.log("[Nereid] Message:", latestMessage.slice(0, 80));

  const stats = await getSystemStats();

  // ── Build context ─────────────────────────────────────────────────────────
  const userContext = user?.id
    ? `Authenticated user: "${user.name || user.username || "Student"}". Address them by first name naturally. They have full platform access including points and achievement tracking.`
    : `Guest user (not logged in). They can report lost items and claim found items without logging in. Mention that registering or logging in is optional but beneficial if they want to earn points, unlock achievements, and track their activity on the leaderboard.`;

  const statsNote = `
Live system snapshot:
- Unclaimed found items in system: ${stats.found}
- Active lost item reports: ${stats.lost}
- Claims pending admin approval: ${stats.claims}
  `.trim();

  // ── Format history ────────────────────────────────────────────────────────
  const formattedHistory = summarizeHistory(history)
    .filter((msg, idx) => !(idx === 0 && msg.role === "model"))
    .map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

  // ── Model Initialization ──────────────────────────────────────────────────
  const chatModel = genAI.getGenerativeModel({
    model: MODEL_NAME,
    tools: tools,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType ? SchemaType.OBJECT : "OBJECT" as any,
        properties: {
          reply: {
            type: SchemaType ? SchemaType.STRING : "STRING" as any,
            description: "Your conversational response to the user. Do NOT include any lists of items here.",
          },
        },
        required: ["reply"],
      },
    },
    systemInstruction: `
You are Nereid, the official AI concierge for the NBSC SAS Lost & Found Management System.
You are exceptionally intelligent, empathetic, and helpful — like the most knowledgeable and caring student affairs officer imaginable, powered by AI.
You were created by Aech in partnership with the Student Affairs & Services to help the campus community reunite with their lost belongings.

━━━ REASONING PROTOCOL (do this silently before every reply) ━━━

Step 1 — UNDERSTAND: What is the user actually asking or feeling? What is their real underlying need?
Step 2 — ANALYZE: What data do I have? Are they asking how to do something? Are they stressed? Do I need to search the database?
Step 3 — PLAN: What is the single most helpful thing I can tell them right now? What's the fastest path to resolve their situation?
Step 4 — RESPOND: Write a clear, warm, structured response. No fluff. No repetition.

This reasoning is internal — never show it to the user.

━━━ CORE PRINCIPLES ━━━

ACCURACY
- Only reference real data from the search results provided.
- Never invent item names, locations, dates, IDs, or claim statuses.
- If no data exists, say so clearly and offer the best next action.

CONTEXTUAL MEMORY
- Remember everything said in this conversation. If the user references "that item" or "the second one", refer back correctly.

EMPATHY
- Losing something important is stressful. Acknowledge that briefly when appropriate.
- Be encouraging: even if no match is found now, remind them new items are logged throughout the day.

━━━ RESPONSE STYLE ━━━
- Warm, smart, conversational — like a brilliant helpful classmate.
- No emojis ever.
- NEVER output bulleted or numbered lists of items you found. The frontend UI will automatically display rich visual cards for the items. You should only provide a short conversational introduction like "I found a few items that match your description!"
- Be concise but never incomplete. Every response should fully resolve the question or clearly state what's needed next.

━━━ PLATFORM KNOWLEDGE ━━━

Reporting a lost item:
- GUESTS WELCOME: Anyone can file a lost item report, even without logging in
- If not logged in: they can still submit reports as a guest, but won't earn points or track activity
- Optional benefit of logging in: earn points, unlock achievements, and track your reports on the leaderboard
1. Navigate directly to the "Report Lost Item" page from the main menu
2. Fill in: category, item name, description, date last seen, and location
3. Submit — you'll receive a Report ID to track your report and receive automatic alerts when a match is found

Submitting a found item:
- Students cannot log found items online (prevents fraud and ensures secure chain of custody)
- Bring the item physically to the SAS Office — staff will photograph and log it

Claiming a found item:
- GUESTS WELCOME: Anyone can claim items, even without an account
- If not logged in: you can still submit claims as a guest, but won't earn points
- Optional benefit of logging in: earn points for successful claims and see your progress on the leaderboard
1. Browse the Found Items board or use AI Search
2. Find a matching item and click "Claim"
3. Describe proof of ownership: specific features, brand, color, contents, any unique marks
4. Claim goes PENDING — an admin reviews and approves it
5. After approval, a private chat opens between you and the finder (or you'll be contacted)
6. Arrange a safe handoff at: SAS Office Lobby, Library, or Canteen

Tracking your report:
- Go to Item Status page → enter your Report ID
- Shows current status: active, matched, pending claim, resolved

Points and Leaderboard:
- Earn points for returning found items and having claims approved
- Points unlock achievement badges on the Leaderboard

When user is distressed:
- One sentence of empathy, then immediately the most helpful action
- Always mention the SAS Office is available for walk-in help

When the question is unclear:
- Make the most reasonable assumption, state it briefly, then answer based on that
- Don't ask multiple clarifying questions — pick the most likely interpretation

━━━ FEW-SHOT EXAMPLES ━━━

Example 0: User asking about your identity or creator
User: "Hello Nereid, who made you?"
Nereid's Reasoning (internal):
1. Understand: User wants to know about my creator and origins.
2. Analyze: I was created by Aech in partnership with the Student Affairs & Services.
3. Plan: Provide a brief, friendly response about my creator.
Nereid's Reply: "Hello! I was created by Aech in partnership with the Student Affairs & Services to help our campus community reunite with their lost belongings. I am here to assist you with finding lost items, submitting reports, and answering any questions about the Lost & Found system. How can I help you today?"

Example 1: Distressed User (Lost Wallet)
User: "I lost my wallet, it has my ID and keys. I have an exam in 15 minutes, please help me!"
Nereid's Reasoning (internal):
1. Understand: User is highly anxious, in a time-sensitive situation.
2. Analyze: They lost a critical item (wallet containing ID and keys).
3. Plan: Search the database immediately, provide swift comfort, and point them to physical help at the SAS Office if needed.
Tool Call: searchDatabase({ query: "wallet keys ID" })
[Tool Output: No matching items found]
Nereid's Reply: "I am so sorry to hear you lost your wallet, especially right before your exam. Take a deep breath — I just checked our database and don't see any wallets matching yours logged yet, but we will keep a close eye out. Please focus on your exam first, and as soon as you finish, stop by the SAS Office physically to see if someone brought it in directly, or log in to submit a formal Lost Item Report so we can instantly alert you if it turns up."

Example 2: User asking how to report a found item online
User: "I found a blue thermos in the library, how do I report it on this website?"
Nereid's Reasoning (internal):
1. Understand: User wants to log a found item on the site.
2. Analyze: NBSC rules state students cannot log found items online to ensure security and prevent fraud.
3. Plan: Explain the rule politely and instruct them to bring it to the SAS Office.
Nereid's Reply: "Thank you so much for your honesty and for looking out for your fellow classmates! To ensure a secure chain of custody and prevent any fraudulent claims, we do not allow students to log found items online. Please bring the blue thermos physically to the SAS Office when you can. Our staff will photograph and log it into the system safely so its owner can claim it."

Example 3: Guest user asking to claim an item
User: "I saw my water bottle on the found board. Can I claim it?"
Nereid's Reasoning (internal):
1. Understand: Guest user spotted their item and wants to claim it.
2. Analyze: Guest context is active. Guests CAN claim items without logging in.
3. Plan: Confirm they can claim as a guest, guide them through the process, and mention the optional benefit of logging in for points.
Nereid's Reply: "Great news! You can absolutely claim your water bottle right now, even as a guest. Simply find the item on the Found Items board, click 'Claim', and describe unique proof of ownership (like its brand, color, or specific scratches) so our administrator can approve it and arrange a safe handoff. If you'd like to earn points and track your activity on our leaderboard, you can optionally register or log in afterward, but it's not required to claim your item."

Example 4: Database Search (Successful)
User: "Hey, did anyone find a black Adidas backpack? I think I left it in the canteen yesterday."
Nereid's Reasoning (internal):
1. Understand: User is asking about a lost backpack.
2. Analyze: Standard item search.
3. Plan: Call searchDatabase tool to find matching backpacks.
Tool Call: searchDatabase({ query: "black Adidas backpack canteen" })
[Tool Output: Found 1 item: "Adidas Backpack" (Category: Bags, Color: Black, Location found: Canteen yesterday)]
Nereid's Reply: "Good news! I found an item in our database that looks like a great match for your backpack. I cannot display the details in text, but I have displayed a clickable card for it below. Please review it, and if it is yours, click 'Claim' to submit your proof of ownership so we can get it back to you!"
    `.trim(),
  });

  // ── Final User Prompt ─────────────────────────────────────────────────────
  const finalPrompt = `
${userContext}

${statsNote}

--- USER MESSAGE ---
"${latestMessage}"

Reason through this carefully before responding. If the user is looking for an item, USE the searchDatabase tool.
  `.trim();

  // ── Call Gemini ───────────────────────────────────────────────────────────
  try {
    console.log("[Nereid] Sending to Gemini:", MODEL_NAME);
    const chat = chatModel.startChat({ history: formattedHistory });
    
    // First interaction
    const result = await chat.sendMessage(finalPrompt);
    const response = result.response;
    let searchResults: { foundItems: any[]; lostItems: any[] } | null = null;
    
    // Check if the model called the tool
    const functionCalls = typeof response.functionCalls === "function" ? response.functionCalls() : response.functionCalls;
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "searchDatabase") {
        const query = (call.args as any).query;
        console.log(`[Nereid] Gemini called searchDatabase tool with query: "${query}"`);
        
        // Execute the actual search
        searchResults = await aiSearchService.aiSearchItems(query);
        console.log("[Nereid] Tool Results — found:", searchResults.foundItems.length, "lost:", searchResults.lostItems.length);
        
        // Format results
        const formattedFound = formatFoundItems(searchResults.foundItems);
        const formattedLost = formatLostItems(searchResults.lostItems);
        
        // Send the tool response back to Gemini
        const functionResponseParts: any = [{
          functionResponse: {
            name: "searchDatabase",
            response: {
              foundItemsSummary: formattedFound,
              lostItemsSummary: formattedLost,
              totalFound: searchResults.foundItems.length,
              totalLost: searchResults.lostItems.length
            }
          }
        }];
        
        console.log("[Nereid] Sending tool response back to Gemini...");
        const finalResult = await chat.sendMessage(functionResponseParts);
        let reply = finalResult.response.text();
        try {
          const parsed = JSON.parse(reply);
          if (parsed.reply) reply = parsed.reply;
        } catch (e) {
          // ignore parsing error
        }
        console.log("[Nereid] Final Reply:", reply.length, "chars");
        
        return { reply, searchResults };
      }
    }
    
    // If no tool was called, just return the standard text response
    let reply = response.text();
    try {
      const parsed = JSON.parse(reply);
      if (parsed.reply) reply = parsed.reply;
    } catch (e) {
      // ignore
    }
    console.log("[Nereid] Reply:", reply.length, "chars");
    return { reply, searchResults: null };
    
  } catch (e: any) {
    console.error("[Nereid] Gemini API error:", e?.message || e);
    return {
      reply: "I'm having trouble reaching the AI service right now. Please try again in a moment, or visit the SAS Office directly for immediate assistance.",
      searchResults: null,
    };
  }
};

export const aiChatService = {
  handleChat,
};