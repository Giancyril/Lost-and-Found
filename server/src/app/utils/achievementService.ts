import prisma from "../config/prisma";

export const ACHIEVEMENTS = {
  // 🟦 Found Item Badges (Turned in to Office)
  FIRST_FOUND_ITEM: { key: "FIRST_FOUND_ITEM", name: "Press F to Pay Respects", description: "Turned in your first found item to the SAS office", icon: "🏹", tier: "BRONZE", category: "found", xp: 25 },
  FOUND_3_ITEMS: { key: "FOUND_3_ITEMS", name: "Eagle Vision", description: "Turned in 3 found items in a single week", icon: "🦅", tier: "SILVER", category: "found", xp: 100 },
  FOUND_5_ITEMS: { key: "FOUND_5_ITEMS", name: "Good Samaritan", description: "Turned in 5 found items to the SAS office", icon: "🤝", tier: "SILVER", category: "found", xp: 150 },
  FOUND_10_ITEMS: { key: "FOUND_10_ITEMS", name: "Campus Witcher", description: "Turned in 10 found items to the SAS office", icon: "🛡️", tier: "GOLD", category: "found", xp: 250 },
  FOUND_25_ITEMS: { key: "FOUND_25_ITEMS", name: "Legendary Loot Hunter", description: "Turned in 25 found items to the SAS archives", icon: "💎", tier: "PLATINUM", category: "found", xp: 500 },
  FOUND_50_ITEMS: { key: "FOUND_50_ITEMS", name: "Hero of Time", description: "Turned in 50 items and saved the day!", icon: "👑", tier: "LEGEND", category: "found", xp: 1000 },
  FOUND_100: { key: "FOUND_100", name: "God of Found Items", description: "Turned in 100 items to the SAS office", icon: "🔱", tier: "LEGEND", category: "found", xp: 5000 },
  SPEED_FINDER: { key: "SPEED_FINDER", name: "Sanic Speed", description: "Turn in an item within 1hr of it being reported lost", icon: "⚡", tier: "SILVER", category: "found", xp: 100 },
  CATEGORY_MASTER: { key: "CATEGORY_MASTER", name: "Class Master", description: "Reported found items across 5 different categories", icon: "📂", tier: "GOLD", category: "found", xp: 250 },
  SCAVENGER_HUNT: { key: "SCAVENGER_HUNT", name: "Scavenger King", description: "Reported found items across 10 different categories", icon: "🎒", tier: "PLATINUM", category: "found", xp: 500 },
  TRUSTED_SOURCE: { key: "TRUSTED_SOURCE", name: "Trusted Source", description: "Have 10 approved reports with zero deletions", icon: "🛡️", tier: "GOLD", category: "found", xp: 500 },
  BORN_TO_FIND: { key: "BORN_TO_FIND", name: "Born to Find", description: "Turn in an item within 24 hours of account creation", icon: "👶", tier: "BRONZE", category: "found", xp: 100 },
  CAMPUS_WALKER: { key: "CAMPUS_WALKER", name: "Campus Walker", description: "Turned in found items from 5 different campus areas", icon: "🚶", tier: "GOLD", category: "found", xp: 500 },

  // 🟥 Lost Item Badges
  FIRST_LOST_REPORT: { key: "FIRST_LOST_REPORT", name: "Inventory Empty", description: "Submit your first lost item report", icon: "📦", tier: "BRONZE", category: "lost", xp: 25 },
  LOST_5_ITEMS: { key: "LOST_5_ITEMS", name: "Persistent Reporter", description: "Submit 5 lost item reports", icon: "🔄", tier: "BRONZE", category: "lost", xp: 50 },
  LOST_10_ITEMS: { key: "LOST_10_ITEMS", name: "Dark Souls Veteran", description: "Submit 10 lost item reports", icon: "💀", tier: "SILVER", category: "lost", xp: 150 },
  LOST_25_ITEMS: { key: "LOST_25_ITEMS", name: "You Died (A Lot)", description: "Submit 25 lost item reports", icon: "🔴", tier: "GOLD", category: "lost", xp: 300 },
  LOST_50: { key: "LOST_50", name: "Forgetful Legend", description: "Submit 50 lost item reports", icon: "🧠", tier: "LEGEND", category: "lost", xp: 1000 },
  REUNITED: { key: "REUNITED", name: "Second Chance", description: "Have a lost item marked as found", icon: "💞", tier: "GOLD", category: "lost", xp: 200 },
  LUCKY_STUDENT: { key: "LUCKY_STUDENT", name: "Luck 100", description: "Have 3 lost items found", icon: "🍀", tier: "PLATINUM", category: "lost", xp: 500 },
  NEVER_GIVE_UP: { key: "NEVER_GIVE_UP", name: "Determination", description: "Report a lost item after 30 days of losing it", icon: "🔥", tier: "SILVER", category: "lost", xp: 100 },

  // 🟩 Claim Badges
  FIRST_CLAIM: { key: "FIRST_CLAIM", name: "New Recruit", description: "Submit your first claim for a found item", icon: "🙋", tier: "BRONZE", category: "claim", xp: 25 },
  FIRST_CLAIM_APPROVED: { key: "FIRST_CLAIM_APPROVED", name: "Verified Owner", description: "Have your first claim approved by SAS", icon: "📜", tier: "SILVER", category: "claim", xp: 100 },
  CLAIMS_5_APPROVED: { key: "CLAIMS_5_APPROVED", name: "Empire Builder", description: "Have 5 claims approved", icon: "✅", tier: "GOLD", category: "claim", xp: 250 },
  CLAIMS_10_APPROVED: { key: "CLAIMS_10_APPROVED", name: "Prestige Master", description: "Have 10 claims approved", icon: "🌟", tier: "PLATINUM", category: "claim", xp: 500 },
  CLAIM_MASTER: { key: "CLAIM_MASTER", name: "Master of Claims", description: "Have 20 approved claims", icon: "👑", tier: "LEGEND", category: "claim", xp: 2000 },
  CLEAN_RECORD: { key: "CLEAN_RECORD", name: "Flawless Victory", description: "0 rejected claims after 5 submissions", icon: "🏆", tier: "GOLD", category: "claim", xp: 300 },
  NO_QUESTIONS_ASKED: { key: "NO_QUESTIONS_ASKED", name: "The Negotiator", description: "Have a claim approved with 100% accuracy score", icon: "🤝", tier: "GOLD", category: "claim", xp: 250 },
  PROOF_PROVIDER: { key: "PROOF_PROVIDER", name: "Detective Mind", description: "Submit high-detail features in a claim", icon: "📑", tier: "SILVER", category: "claim", xp: 75 },
  QUICK_RECOVERY: { key: "QUICK_RECOVERY", name: "Flash Recovery", description: "Claim your lost item within 30 minutes of it being found", icon: "🏃", tier: "GOLD", category: "claim", xp: 500 },
  PATIENT_CLAIMANT: { key: "PATIENT_CLAIMANT", name: "The Patient One", description: "Have a claim approved after 7 days of pending status", icon: "⏳", tier: "SILVER", category: "claim", xp: 100 },

  // 🟨 Points & Leaderboard Badges
  POINT_50: { key: "POINT_50", name: "XP Farmer", description: "Earn 50 total points", icon: "🚜", tier: "BRONZE", category: "points", xp: 50 },
  POINT_200: { key: "POINT_200", name: "Mid-Laner", description: "Earn 200 total points", icon: "⚔️", tier: "SILVER", category: "points", xp: 150 },
  POINT_500: { key: "POINT_500", name: "Carry Player", description: "Earn 500 total points", icon: "🔋", tier: "GOLD", category: "points", xp: 300 },
  POINT_1000: { key: "POINT_1000", name: "Final Boss", description: "Earn 1000 total points", icon: "👹", tier: "PLATINUM", category: "points", xp: 500 },
  POINT_2500: { key: "POINT_2500", name: "Point Millionaire", description: "Reach 2500 total points", icon: "💎", tier: "PLATINUM", category: "points", xp: 1000 },
  POINT_5000: { key: "POINT_5000", name: "Challenger Tier", description: "Earn 5000 total points", icon: "🏆", tier: "LEGEND", category: "points", xp: 2000 },
  TOP_10_LEADERBOARD: { key: "TOP_10_LEADERBOARD", name: "Grandmaster", description: "Reach top 10 on the leaderboard", icon: "🏅", tier: "SILVER", category: "points", xp: 200 },
  TOP_3_LEADERBOARD: { key: "TOP_3_LEADERBOARD", name: "The Podium", description: "Reach top 3 on the leaderboard", icon: "🥉", tier: "GOLD", category: "points", xp: 500 },
  RANK_1_LEADERBOARD: { key: "RANK_1_LEADERBOARD", name: "Apex Champion", description: "Reach #1 on the leaderboard", icon: "🥇", tier: "LEGEND", category: "points", xp: 1000 },
  POINT_HUSTLER: { key: "POINT_HUSTLER", name: "Hustle & Flow", description: "Earn 100 points in one day", icon: "💰", tier: "SILVER", category: "points", xp: 100 },

  // 🟣 Community Badges
  CONVERSATIONALIST: { key: "CONVERSATIONALIST", name: "NPC Interaction", description: "Leave your first comment", icon: "🗣️", tier: "BRONZE", category: "community", xp: 25 },
  HELPER: { key: "HELPER", name: "Side Quest Expert", description: "Leave 10 helpful comments", icon: "🗺️", tier: "SILVER", category: "community", xp: 100 },
  COMMUNITY_PILLAR: { key: "COMMUNITY_PILLAR", name: "Guild Master", description: "Leave 50 comments", icon: "🏰", tier: "GOLD", category: "community", xp: 250 },
  SOCIAL_INFLUENCER: { key: "SOCIAL_INFLUENCER", name: "Social Star", description: "Receive 10 replies to your comments", icon: "⭐", tier: "GOLD", category: "community", xp: 500 },
  GOOD_CRITIC: { key: "GOOD_CRITIC", name: "Taste Maker", description: "Upvote 5 helpful comments", icon: "👍", tier: "SILVER", category: "community", xp: 100 },
  STEALTH_100: { key: "STEALTH_100", name: "Phantom", description: "Submit an anonymous comment", icon: "👻", tier: "BRONZE", category: "community", xp: 25 },
  COMMENT_100: { key: "COMMENT_100", name: "Chatterbox", description: "Leave 100 total comments", icon: "🗣️", tier: "PLATINUM", category: "community", xp: 1000 },
  SOCIAL_GOD: { key: "SOCIAL_GOD", name: "Social Deity", description: "Receive 50 total upvotes on your comments", icon: "🛐", tier: "LEGEND", category: "community", xp: 2000 },
  FEEDBACK_GIVER: { key: "FEEDBACK_GIVER", name: "Voice of the People", description: "Submit your first feedback report", icon: "📣", tier: "SILVER", category: "community", xp: 100 },
  KIND_STRANGER: { key: "KIND_STRANGER", name: "Kind Stranger", description: "Leave a helpful comment on someone else's lost item", icon: "🌟", tier: "BRONZE", category: "community", xp: 50 },

  // 🔵 Streak & Time Badges
  DAY_ONE: { key: "DAY_ONE", name: "Waking Up in a Wagon", description: "First login to the system", icon: "🐴", tier: "BRONZE", category: "streak", xp: 25 },
  STREAK_3: { key: "STREAK_3", name: "Triple Threat", description: "3 day login streak", icon: "🔥", tier: "BRONZE", category: "streak", xp: 30 },
  WEEK_WARRIOR: { key: "WEEK_WARRIOR", name: "7 Days to Die", description: "Login 7 days in a row", icon: "💀", tier: "SILVER", category: "streak", xp: 150 },
  STREAK_14: { key: "STREAK_14", name: "Fortnightly", description: "14 day login streak", icon: "🏰", tier: "SILVER", category: "streak", xp: 200 },
  MONTHLY_DEVOTEE: { key: "MONTHLY_DEVOTEE", name: "No Life Status", description: "Active for 30 consecutive days", icon: "🖥️", tier: "GOLD", category: "streak", xp: 500 },
  SEMESTER_CHAMPION: { key: "SEMESTER_CHAMPION", name: "Ultimate Grinder", description: "Active for a full semester", icon: "🎮", tier: "PLATINUM", category: "streak", xp: 1000 },
  EARLY_BIRD: { key: "EARLY_BIRD", name: "Morning Grind", description: "Submit an item before 8AM", icon: "🐦", tier: "BRONZE", category: "streak", xp: 50 },
  NIGHT_OWL: { key: "NIGHT_OWL", name: "Bravo Six, Going Dark", description: "Submit an item after 9PM", icon: "🦉", tier: "BRONZE", category: "streak", xp: 50 },
  CAMPUS_VETERAN: { key: "CAMPUS_VETERAN", name: "The Elder", description: "Keep your account active for 6 months", icon: "🎖️", tier: "GOLD", category: "streak", xp: 750 },
  WEEKEND_WARRIOR: { key: "WEEKEND_WARRIOR", name: "Weekend Quest", description: "Submit a report on a Saturday or Sunday", icon: "⛺", tier: "SILVER", category: "streak", xp: 100 },

  // ⚫ Special & Secret Badges
  THE_CHOSEN_ONE: { key: "THE_CHOSEN_ONE", name: "The Chosen One", description: "Be the very first user to register", icon: "✨", tier: "LEGEND", category: "special", xp: 5000, secret: true },
  DETECTIVE_MODE: { key: "DETECTIVE_MODE", name: "Sherlock", description: "Use AI Search 10 times", icon: "🕶️", tier: "SILVER", category: "special", xp: 150 },
  MAP_EXPLORER: { key: "MAP_EXPLORER", name: "Gotta Map 'Em All", description: "Use Indoor Map 5 times", icon: "🌍", tier: "BRONZE", category: "special", xp: 50 },
  SPEEDRUNNER: { key: "SPEEDRUNNER", name: "Any% Glitchless", description: "Submit found item in under 2 minutes", icon: "🏃", tier: "GOLD", category: "special", xp: 200 },
  COMPLETIONIST: { key: "COMPLETIONIST", name: "Full Sync", description: "Fill all profile fields", icon: "📑", tier: "SILVER", category: "special", xp: 100 },
  OLD_RELIABLE: { key: "OLD_RELIABLE", name: "Long Term Commitment", description: "Use the system for 6 months", icon: "🕰️", tier: "PLATINUM", category: "special", xp: 500 },
  LUCKY_7: { key: "LUCKY_7", name: "Jackpot", description: "Earn exactly 777 points", icon: "🎰", tier: "GOLD", category: "special", xp: 777, secret: true },
  HAT_TRICK: { key: "HAT_TRICK", name: "Triple Kill", description: "Turn in 3 items in one day", icon: "🎩", tier: "GOLD", category: "special", xp: 300 },
  QR_HUNTER: { key: "QR_HUNTER", name: "Scanner Pro", description: "Use barcode scanner 10 times", icon: "🔍", tier: "SILVER", category: "special", xp: 150 },
  AI_WHISPERER: { key: "AI_WHISPERER", name: "Artificial Intelligence", description: "Get a successful match from AI Search", icon: "🤖", tier: "GOLD", category: "special", xp: 200 },
  PERFECT_WEEK: { key: "PERFECT_WEEK", name: "Perfect Run", description: "Turn in an item every day for 7 days", icon: "🌈", tier: "PLATINUM", category: "special", xp: 1000 },
  COMEBACK_KID: { key: "COMEBACK_KID", name: "Respawned", description: "Return after 30 days of inactivity", icon: "🔙", tier: "BRONZE", category: "special", xp: 100 },
  WHALE_DONOR: { key: "WHALE_DONOR", name: "Generous Soul", description: "Report an item worth 500+ pts", icon: "💖", tier: "PLATINUM", category: "special", xp: 500 },
  MVP_STATUS: { key: "MVP_STATUS", name: "Department MVP", description: "Be top scorer in your department", icon: "🎖️", tier: "LEGEND", category: "special", xp: 1000 },
  CAKE_IS_A_LIE: { key: "CAKE_IS_A_LIE", name: "The Cake is a Lie", description: "Try to claim an item that was already claimed", icon: "🍰", tier: "GOLD", category: "special", xp: 500, secret: true },
  FUS_RO_DAH: { key: "FUS_RO_DAH", name: "Unstoppable Force", description: "Submit reports from 3 different campus locations", icon: "🐲", tier: "PLATINUM", category: "special", xp: 750, secret: true },
  WRECK_IT: { key: "WRECK_IT", name: "Wreck-It Ralph", description: "Have 3 claims rejected in a row", icon: "🧱", tier: "SILVER", category: "special", xp: 10, secret: true },
  EASTER_EGG: { key: "EASTER_EGG", name: "Egg Hunter", description: "Click a hidden UI element", icon: "🥚", tier: "BRONZE", category: "special", xp: 100, secret: true },
  PACIFIST_RUN: { key: "PACIFIST_RUN", name: "Pacifist", description: "Turn in 10 items without ever losing one", icon: "🕊️", tier: "PLATINUM", category: "special", xp: 1000, secret: true },
  MODEL_CITIZEN: { key: "MODEL_CITIZEN", name: "Fashion Souls", description: "Upload your first profile picture", icon: "📸", tier: "BRONZE", category: "special", xp: 50 },
  QR_APPRENTICE: { key: "QR_APPRENTICE", name: "Cyberpunk", description: "Use the QR scanner for the first time", icon: "📱", tier: "BRONZE", category: "special", xp: 50 },
  SECURITY_FIRST: { key: "SECURITY_FIRST", name: "Cyber Secure", description: "Update your account password", icon: "🔐", tier: "BRONZE", category: "special", xp: 50 },
  SILENT_OBSERVER: { key: "SILENT_OBSERVER", name: "Lurker", description: "View 20 different items", icon: "👁️", tier: "BRONZE", category: "special", xp: 50 },
  TECH_SAVVY: { key: "TECH_SAVVY", name: "Cross-Platform", description: "Login from 2 different devices", icon: "💻", tier: "SILVER", category: "special", xp: 100 },
  WINDOW_SHOPPER: { key: "WINDOW_SHOPPER", name: "Explorer", description: "View items in 5 different categories", icon: "🛒", tier: "SILVER", category: "special", xp: 100 },
  ACCESS_DENIED: { key: "ACCESS_DENIED", name: "403 Forbidden", description: "Try to enter a restricted portal area", icon: "🚫", tier: "SILVER", category: "special", xp: 200, secret: true },
  WITCHING_HOUR: { key: "WITCHING_HOUR", name: "Midnight Quest", description: "Submit a report at exactly 12:00 AM", icon: "🕛", tier: "GOLD", category: "special", xp: 1000, secret: true },
  GLITCH_MATRIX: { key: "GLITCH_MATRIX", name: "Matrix Break", description: "Found a hidden developer credit", icon: "👾", tier: "PLATINUM", category: "special", xp: 2000, secret: true },
  THE_ARCHITECT: { key: "THE_ARCHITECT", name: "World Builder", description: "View the system documentation or help guide", icon: "📐", tier: "BRONZE", category: "special", xp: 100, secret: true },
  SECRET_CODE: { key: "SECRET_CODE", name: "Konami Code", description: "Entered a secret sequence in the dashboard", icon: "🎮", tier: "GOLD", category: "special", xp: 500, secret: true },
  DARK_MODE_LOVER: { key: "DARK_MODE_LOVER", name: "Creature of the Night", description: "Use the system in dark mode for 10 hours", icon: "🌙", tier: "SILVER", category: "special", xp: 100 },
  HELP_GUIDE_READER: { key: "HELP_GUIDE_READER", name: "Student Handbook", description: "Read the entire help guide", icon: "📖", tier: "BRONZE", category: "special", xp: 50 },
  TICKET_MASTER: { key: "TICKET_MASTER", name: "Support Hero", description: "Resolve your first support ticket", icon: "🎫", tier: "GOLD", category: "special", xp: 300 },
  PROFILE_WARRIOR: { key: "PROFILE_WARRIOR", name: "Identity Shift", description: "Change your profile name or username once", icon: "🎭", tier: "BRONZE", category: "special", xp: 50 },
  MASTER_EXPLORER: { key: "MASTER_EXPLORER", name: "World Traveler", description: "View every single page on the student dashboard", icon: "🗺️", tier: "GOLD", category: "special", xp: 1000 },
  LOOT_ENTHUSIAST: { key: "LOOT_ENTHUSIAST", name: "Loot Enthusiast", description: "Turn in an item that awards exactly 100 points", icon: "🎁", tier: "BRONZE", category: "found", xp: 100 },
  TRUE_HERO: { key: "TRUE_HERO", name: "True Hero", description: "Complete a full year of honesty on campus", icon: "🎖️", tier: "LEGEND", category: "streak", xp: 5000 },

  // 🎯 THE FINAL 100th BADGE
  PLATINUM_GOD: { key: "PLATINUM_GOD", name: "Platinum God", description: "Unlock 100% of all other achievements", icon: "🧿", tier: "LEGEND", category: "special", xp: 10000, secret: true },
} as const;

export const seedAchievements = async () => {
  console.log("🌱 Clearing old achievements...");
  await prisma.achievement.deleteMany();
  
  console.log("🌱 Seeding achievements...");
  for (const [key, data] of Object.entries(ACHIEVEMENTS)) {
    await prisma.achievement.upsert({
      where: { key: data.key },
      update: { name: data.name, description: data.description, icon: data.icon, tier: data.tier as any, category: data.category, xp: data.xp, secret: (data as any).secret || false },
      create: { key: data.key, name: data.name, description: data.description, icon: data.icon, tier: data.tier as any, category: data.category, xp: data.xp, secret: (data as any).secret || false },
    });
  }
  console.log("✅ Achievements seeded!");
};

export const awardAchievement = async (userId: string, achievementKey: string) => {
  try {
    const achievementData = await prisma.achievement.findUnique({ where: { key: achievementKey } });
    if (!achievementData) return null;
    const existing = await prisma.userAchievement.findUnique({ where: { userId_achievementId: { userId, achievementId: achievementData.id } } });
    if (existing) return null;
    const userAchievement = await prisma.userAchievement.create({ data: { userId, achievementId: achievementData.id }, include: { achievement: true } });
    await prisma.user.update({ where: { id: userId }, data: { totalPoints: { increment: achievementData.xp } } });
    if (achievementKey !== "PLATINUM_GOD") {
      const totalAvailable = Object.keys(ACHIEVEMENTS).length - 1;
      const userTotal = await prisma.userAchievement.count({ where: { userId } });
      if (userTotal >= totalAvailable) { await awardAchievement(userId, "PLATINUM_GOD"); }
    }
    return userAchievement;
  } catch (error) { console.error("Error awarding achievement:", error); return null; }
};

// ── Achievement Checkers ──────────────────────────────────────────────────

export const checkFoundItemAchievements = async (userId: string) => {
  const count = await prisma.foundItem.count({ where: { userId } });
  if (count >= 1) await awardAchievement(userId, "FIRST_FOUND_ITEM");
  if (count >= 5) await awardAchievement(userId, "FOUND_5_ITEMS");
  if (count >= 10) await awardAchievement(userId, "FOUND_10_ITEMS");
  if (count >= 25) await awardAchievement(userId, "FOUND_25_ITEMS");
  if (count >= 50) await awardAchievement(userId, "FOUND_50_ITEMS");
  if (count >= 100) await awardAchievement(userId, "FOUND_100");
};

export const checkLostItemAchievements = async (userId: string) => {
  const count = await prisma.lostItem.count({ where: { userId } });
  if (count >= 1) await awardAchievement(userId, "FIRST_LOST_REPORT");
  if (count >= 5) await awardAchievement(userId, "LOST_5_ITEMS");
  if (count >= 10) await awardAchievement(userId, "LOST_10_ITEMS");
  if (count >= 25) await awardAchievement(userId, "LOST_25_ITEMS");
  if (count >= 50) await awardAchievement(userId, "LOST_50");
};

export const checkClaimAchievements = async (userId: string) => {
  const totalClaims = await prisma.claim.count({ where: { userId } });
  const approvedClaims = await prisma.claim.count({ where: { userId, status: "APPROVED" } });
  
  if (totalClaims >= 1) await awardAchievement(userId, "FIRST_CLAIM");
  if (approvedClaims >= 1) await awardAchievement(userId, "FIRST_CLAIM_APPROVED");
  if (approvedClaims >= 5) await awardAchievement(userId, "CLAIMS_5_APPROVED");
  if (approvedClaims >= 10) await awardAchievement(userId, "CLAIMS_10_APPROVED");
  if (approvedClaims >= 20) await awardAchievement(userId, "CLAIM_MASTER");
};

export const checkPointAchievements = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { totalPoints: true } });
  if (!user) return;
  const pts = user.totalPoints;
  if (pts >= 50) await awardAchievement(userId, "POINT_50");
  if (pts >= 200) await awardAchievement(userId, "POINT_200");
  if (pts >= 500) await awardAchievement(userId, "POINT_500");
  if (pts >= 1000) await awardAchievement(userId, "POINT_1000");
  if (pts >= 2500) await awardAchievement(userId, "POINT_2500");
  if (pts >= 5000) await awardAchievement(userId, "POINT_5000");
};

export const checkCommunityAchievements = async (userId: string) => {
  const count = await prisma.comment.count({ where: { userId } });
  if (count >= 1) await awardAchievement(userId, "CONVERSATIONALIST");
  if (count >= 10) await awardAchievement(userId, "HELPER");
  if (count >= 50) await awardAchievement(userId, "COMMUNITY_PILLAR");
  if (count >= 100) await awardAchievement(userId, "COMMENT_100");
};
