import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiSearchService } from "../aiSearch/aiSearch.service";
import prisma from "../../config/prisma";
import { JwtPayload } from "jsonwebtoken";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

// ── Intent detection ──────────────────────────────────────────────────────────
type Intent =
  | "SEARCH_ITEM"
  | "HOW_TO"
  | "STATUS_CHECK"
  | "CLAIM_QUESTION"
  | "URGENT"
  | "GREETING"
  | "SMALLTALK"
  | "UNCLEAR";

const detectIntents = (text: string): Set<Intent> => {
  const t = text.toLowerCase();
  const intents = new Set<Intent>();

  // Broader search detection — catches more item descriptions
  const actionWords = /\b(lost|missing|found|looking for|seen|left behind|dropped|forgot|left my|lose|find|search|where is|where are|any|have you|did anyone|does anyone)\b/;
  const itemWords = /\b(bag|wallet|phone|id|card|umbrella|laptop|keys|key|book|notebook|charger|glasses|watch|airpods|headphones|backpack|jacket|sweater|tumbler|bottle|item|thing|stuff|ring|necklace|earrings|shoes|cap|hat|folder|flash drive|usb|tablet|ipad|calculator|pen|pencil|case|pouch|lanyard|uniform|jersey)\b/;

  if (actionWords.test(t) && itemWords.test(t)) intents.add("SEARCH_ITEM");
  // Also catch bare item mentions without explicit action words
  if (!intents.has("SEARCH_ITEM") && itemWords.test(t) && t.split(" ").length < 12) intents.add("SEARCH_ITEM");

  if (/\b(how|what (do|should|can) i|steps|process|guide|where do i|how to|how do|what is the procedure|what are the steps)\b/.test(t)) intents.add("HOW_TO");
  if (/\b(status|update|check|tracking|report id|what happened|approved|pending|rejected|my claim|my report|any news|any update)\b/.test(t)) intents.add("STATUS_CHECK");
  if (/\b(claim|retrieve|get back|pick up|collect|proof|ownership|handoff|meeting|arrange|schedule)\b/.test(t)) intents.add("CLAIM_QUESTION");
  if (/\b(urgent|emergency|asap|immediately|right now|right away|very important|need it now|passport|medication|medicine|please help|i really need)\b/.test(t)) intents.add("URGENT");
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|sup|yo|howdy|what's up|wassup)[^a-z]*$/i.test(t.trim())) intents.add("GREETING");
  if (/\b(who are you|what are you|your name|tell me about yourself|what can you do|thank|awesome|great|okay|cool|nice|got it|i see|understood|makes sense)\b/.test(t)) intents.add("SMALLTALK");

  if (intents.size === 0) intents.add("UNCLEAR");
  return intents;
};

// ── Extract clean search query ────────────────────────────────────────────────
const extractSearchQuery = (text: string): string => {
  return text
    .replace(/\b(can you|please|help me|find|search for|looking for|i lost|i found|have you seen|do you have|is there a|i left my|i dropped my|i forgot my|check if|any sign of|did anyone find|does anyone have|where is my|where are my)\b/gi, "")
    .replace(/[?!.,]/g, "")
    .trim()
    .slice(0, 150);
};

// ── Expand query with synonyms for better matching ────────────────────────────
const expandQuery = (query: string): string => {
  const synonyms: Record<string, string> = {
    "cellphone": "phone mobile cellphone smartphone",
    "mobile": "phone mobile cellphone smartphone",
    "specs": "glasses eyeglasses spectacles",
    "eyeglasses": "glasses eyeglasses spectacles specs",
    "purse": "wallet purse coin purse pouch",
    "bag": "bag backpack satchel tote",
    "earphones": "earphones earbuds headphones airpods",
    "usb": "usb flash drive thumb drive",
    "id card": "id card identification student id",
    "calculator": "calculator scientific calculator",
  };

  let expanded = query.toLowerCase();
  for (const [key, value] of Object.entries(synonyms)) {
    if (expanded.includes(key)) {
      expanded = `${expanded} ${value}`;
    }
  }
  return expanded.slice(0, 200);
};

// ── Detect follow-up questions ────────────────────────────────────────────────
const isFollowUp = (text: string, history: { role: string; content: string }[]): boolean => {
  const phrases = /\b(that one|the first|the second|the last|which one|tell me more|more details|more info|about it|about that|this item|the one|can i claim|how do i claim that|is it mine|where exactly|what does it look like|who found it|when was it found)\b/i;
  return phrases.test(text) && history.length > 2;
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

// ── Main handler ──────────────────────────────────────────────────────────────
const handleChat = async (
  messages: { role: string; content: string }[],
  user?: JwtPayload
) => {
  if (!messages || messages.length === 0) throw new Error("No messages provided");

  const latestMessage = messages[messages.length - 1].content;
  const history = messages.slice(0, -1);

  console.log("[Nereid] Message:", latestMessage.slice(0, 80));

  const intents = detectIntents(latestMessage);
  const shouldSearch = intents.has("SEARCH_ITEM") && !isFollowUp(latestMessage, history);
  const isUrgent = intents.has("URGENT");

  console.log("[Nereid] Intents:", [...intents].join(", "), "| Search:", shouldSearch);

  // ── Parallel: stats + search ──────────────────────────────────────────────
  let searchResults: { foundItems: any[]; lostItems: any[] } | null = null;
  let searchContext = "";

  const [stats] = await Promise.all([
    getSystemStats(),
    (async () => {
      if (!shouldSearch) return;
      try {
        const rawQuery = extractSearchQuery(latestMessage);
        const query = expandQuery(rawQuery);
        if (query.length < 2) return;

        console.log("[Nereid] Searching:", query.slice(0, 60));
        searchResults = await aiSearchService.aiSearchItems(query);
        console.log("[Nereid] Results — found:", searchResults.foundItems.length, "lost:", searchResults.lostItems.length);

        searchContext = `
FOUND ITEMS matching the search:
${formatFoundItems(searchResults.foundItems)}

LOST ITEM REPORTS matching the search:
${formatLostItems(searchResults.lostItems)}
        `.trim();
      } catch (e) {
        console.error("[Nereid] Search error:", e);
        searchContext = "Search failed due to a system error. Advise the user to browse the Found Items page manually or visit the SAS Office.";
      }
    })(),
  ]);

  // ── Build context ─────────────────────────────────────────────────────────
  const userContext = user?.id
    ? `Authenticated user: "${user.name || user.username || "Student"}". Address them by first name naturally. They have full platform access.`
    : `Guest user (not logged in). Remind them to register or log in if they want to report or claim items.`;

  const urgencyNote = isUrgent
    ? `\nPRIORITY — URGENT: Skip pleasantries. Give the fastest resolution path immediately. Mention the SAS Office is available for walk-in help right now.`
    : "";

  const followUpNote = isFollowUp(latestMessage, history)
    ? `\nCONTINUITY: The user is following up on something from earlier. Reference the conversation history to maintain context and don't repeat yourself.`
    : "";

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

  // ── Model ─────────────────────────────────────────────────────────────────
  const MODEL_NAME = "gemini-flash-latest";

  const chatModel = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: `
You are Nereid, the official AI concierge for the NBSC SAS Lost & Found Management System.
You are exceptionally intelligent, empathetic, and helpful — like the most knowledgeable and caring student affairs officer imaginable, powered by AI.

━━━ REASONING PROTOCOL (do this silently before every reply) ━━━

Step 1 — UNDERSTAND: What is the user actually asking or feeling? What is their real underlying need?
Step 2 — ANALYZE: What data do I have? Are there matching items? Are they asking how to do something? Are they stressed?
Step 3 — PLAN: What is the single most helpful thing I can tell them right now? What's the fastest path to resolve their situation?
Step 4 — RESPOND: Write a clear, warm, structured response. No fluff. No repetition.

This reasoning is internal — never show it to the user.

━━━ CORE PRINCIPLES ━━━

ACCURACY
- Only reference real data from the search results provided.
- Never invent item names, locations, dates, IDs, or claim statuses.
- If no data exists, say so clearly and offer the best next action.

SEMANTIC INTELLIGENCE
- Think beyond exact matches. "Blue pouch" could match "small blue coin purse". "Nokia" could match "old phone". Use common sense.
- If an item description is vague, acknowledge it and still try to match the closest result.
- For multiple matches, rank them by likelihood and explain why each might be relevant.

CONTEXTUAL MEMORY
- Remember everything said in this conversation. If the user references "that item" or "the second one", refer back correctly.
- Never ask the user to repeat information they already gave.
- If something was already answered, don't repeat it — build on it.

EMPATHY
- Losing something important is stressful. Acknowledge that briefly when appropriate.
- Be encouraging: even if no match is found now, remind them new items are logged throughout the day.
- Match the user's energy — if they're casual, be casual. If they're detailed, be thorough.

━━━ RESPONSE STYLE ━━━
- Warm, smart, conversational — like a brilliant helpful classmate.
- No emojis ever.
- Use **bold** for item names and key terms.
- Bullet points for options, numbered lists for steps.
- Short paragraphs with line breaks — never a wall of text.
- Be concise but never incomplete. Every response should fully resolve the question or clearly state what's needed next.

━━━ PLATFORM KNOWLEDGE ━━━

Reporting a lost item:
- LOGIN REQUIRED: Students must be registered and logged in to file a lost item report. Guests cannot submit reports.
- If not logged in: direct them to Log In or Register first before proceeding.
1. Once logged in, navigate directly to the "Report Lost Item" page from the main menu
2. Fill in: category, item name, description, date last seen, and location
3. Submit — you'll receive a Report ID to track your report and receive automatic alerts when a match is found

Submitting a found item:
- Students cannot log found items online (prevents fraud and ensures secure chain of custody)
- Bring the item physically to the SAS Office — staff will photograph and log it

Claiming a found item:
1. Browse the Found Items board or use AI Search
2. Find a matching item and click "Claim"
3. Describe proof of ownership: specific features, brand, color, contents, any unique marks
4. Claim goes PENDING — an admin reviews and approves it
5. After approval, a private chat opens between you and the finder
6. Arrange a safe handoff at: SAS Office Lobby, Library, or Canteen

Tracking your report:
- Go to Item Status page → enter your Report ID
- Shows current status: active, matched, pending claim, resolved

AI Search page:
- Accepts natural language: "blue backpack near the gym", "wallet with student ID inside"
- Finds semantically similar matches even without exact word matches

Points and Leaderboard:
- Earn points for returning found items and having claims approved
- Points unlock achievement badges on the Leaderboard

When search finds nothing:
- Say clearly that no matches are currently in the system
- Encourage them to file a lost item report — the system will automatically alert them when a matching found item is logged
- Remind them new items are added throughout the day so checking back helps

When user is distressed:
- One sentence of empathy, then immediately the most helpful action
- Always mention the SAS Office is available for walk-in help

When the question is unclear:
- Make the most reasonable assumption, state it briefly, then answer based on that
- Don't ask multiple clarifying questions — pick the most likely interpretation
    `.trim(),
  });

  // ── Final prompt ──────────────────────────────────────────────────────────
  const finalPrompt = `
${userContext}
${urgencyNote}
${followUpNote}

Active intents: ${[...intents].join(", ")}

${statsNote}

${searchContext
    ? `--- DATABASE SEARCH RESULTS ---\n${searchContext}\n\nIMPORTANT: Present these results naturally and conversationally. Do NOT show raw IDs, JSON, or technical formatting to the user. Reference item names and locations in a helpful, human way. If multiple items match, compare them and highlight the most likely match based on the user's description.`
    : "No database search was performed for this message."
  }

--- USER MESSAGE ---
"${latestMessage}"

Reason through this carefully before responding. Be genuinely helpful.
  `.trim();

  // ── Call Gemini ───────────────────────────────────────────────────────────
  try {
    console.log("[Nereid] Sending to Gemini:", MODEL_NAME);
    const chat = chatModel.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(finalPrompt);
    const reply = result.response.text();
    console.log("[Nereid] Reply:", reply.length, "chars");
    return { reply, searchResults };
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