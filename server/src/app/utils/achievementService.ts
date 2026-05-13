import prisma from "../config/prisma";

export const ACHIEVEMENTS = {
  // 🟦 Found Item Badges
  FIRST_FOUND_ITEM: {
    key: "FIRST_FOUND_ITEM",
    name: "First Responder",
    description: "Submitted your first found item report",
    icon: "🎯",
    tier: "BRONZE",
    category: "found",
    xp: 25,
  },
  FOUND_5_ITEMS: {
    key: "FOUND_5_ITEMS",
    name: "Good Samaritan",
    description: "Submitted 5 found item reports",
    icon: "🤝",
    tier: "SILVER",
    category: "found",
    xp: 75,
  },
  FOUND_10_ITEMS: {
    key: "FOUND_10_ITEMS",
    name: "Campus Guardian",
    description: "Submitted 10 found item reports",
    icon: "🛡️",
    tier: "GOLD",
    category: "found",
    xp: 150,
  },
  FOUND_25_ITEMS: {
    key: "FOUND_25_ITEMS",
    name: "Lost & Found Hero",
    description: "Submitted 25 found item reports",
    icon: "🏆",
    tier: "PLATINUM",
    category: "found",
    xp: 300,
  },
  FOUND_50_ITEMS: {
    key: "FOUND_50_ITEMS",
    name: "NBSC Legend",
    description: "Submitted 50 found item reports",
    icon: "👑",
    tier: "LEGEND",
    category: "found",
    xp: 1000,
  },
  SPEED_FINDER: {
    key: "SPEED_FINDER",
    name: "Speed Finder",
    description: "Submit found item within 1hr of losing report",
    icon: "⚡",
    tier: "SILVER",
    category: "found",
    xp: 100,
  },
  EAGLE_EYE: {
    key: "EAGLE_EYE",
    name: "Eagle Eye",
    description: "Submit 3 found items in one week",
    icon: "🦅",
    tier: "GOLD",
    category: "found",
    xp: 200,
  },
  CATEGORY_MASTER: {
    key: "CATEGORY_MASTER",
    name: "Category Master",
    description: "Submit found items in 5 different categories",
    icon: "📂",
    tier: "GOLD",
    category: "found",
    xp: 250,
  },

  // 🟥 Lost Item Badges
  FIRST_LOST_REPORT: {
    key: "FIRST_LOST_REPORT",
    name: "First Report",
    description: "Submit first lost item report",
    icon: "📝",
    tier: "BRONZE",
    category: "lost",
    xp: 25,
  },
  LOST_10_ITEMS: {
    key: "LOST_10_ITEMS",
    name: "Persistent",
    description: "Submit 10 lost item reports",
    icon: "🔄",
    tier: "SILVER",
    category: "lost",
    xp: 100,
  },
  LOST_25_ITEMS: {
    key: "LOST_25_ITEMS",
    name: "Never Give Up",
    description: "Submit 25 lost item reports",
    icon: "🔥",
    tier: "GOLD",
    category: "lost",
    xp: 250,
  },
  REUNITED: {
    key: "REUNITED",
    name: "Reunited",
    description: "Have a lost item marked as found",
    icon: "💞",
    tier: "GOLD",
    category: "lost",
    xp: 150,
  },
  LUCKY_STUDENT: {
    key: "LUCKY_STUDENT",
    name: "Lucky Student",
    description: "Have 3 lost items found",
    icon: "🍀",
    tier: "PLATINUM",
    category: "lost",
    xp: 500,
  },

  // 🟩 Claim Badges
  FIRST_CLAIM: {
    key: "FIRST_CLAIM",
    name: "Claimer",
    description: "Submit first claim",
    icon: "🙋",
    tier: "BRONZE",
    category: "claim",
    xp: 25,
  },
  FIRST_CLAIM_APPROVED: {
    key: "FIRST_CLAIM_APPROVED",
    name: "Proof Provider",
    description: "Have first claim approved",
    icon: "📑",
    tier: "SILVER",
    category: "claim",
    xp: 75,
  },
  CLAIMS_5_APPROVED: {
    key: "CLAIMS_5_APPROVED",
    name: "Verified Owner",
    description: "Have 5 claims approved",
    icon: "✅",
    tier: "GOLD",
    category: "claim",
    xp: 200,
  },
  CLAIMS_10_APPROVED: {
    key: "CLAIMS_10_APPROVED",
    name: "Master Claimer",
    description: "Have 10 claims approved",
    icon: "💎",
    tier: "PLATINUM",
    category: "claim",
    xp: 500,
  },
  CLEAN_RECORD: {
    key: "CLEAN_RECORD",
    name: "Clean Record",
    description: "0 rejected claims after 5 submissions",
    icon: "📜",
    tier: "GOLD",
    category: "claim",
    xp: 300,
  },

  // 🟨 Points & Leaderboard Badges
  POINT_50: {
    key: "POINT_50",
    name: "Point Collector",
    description: "Earn 50 points",
    icon: "🪙",
    tier: "BRONZE",
    category: "points",
    xp: 50,
  },
  POINT_200: {
    key: "POINT_200",
    name: "Point Hustler",
    description: "Earn 200 points",
    icon: "💰",
    tier: "SILVER",
    category: "points",
    xp: 150,
  },
  POINT_500: {
    key: "POINT_500",
    name: "Point Machine",
    description: "Earn 500 points",
    icon: "🔋",
    tier: "GOLD",
    category: "points",
    xp: 300,
  },
  POINT_1000: {
    key: "POINT_1000",
    name: "Point Legend",
    description: "Earn 1000 points",
    icon: "🌟",
    tier: "PLATINUM",
    category: "points",
    xp: 500,
  },
  TOP_10_LEADERBOARD: {
    key: "TOP_10_LEADERBOARD",
    name: "Top 10",
    description: "Reach top 10 leaderboard",
    icon: "🏅",
    tier: "SILVER",
    category: "points",
    xp: 200,
  },
  TOP_3_LEADERBOARD: {
    key: "TOP_3_LEADERBOARD",
    name: "Top 3",
    description: "Reach top 3 leaderboard",
    icon: "🥉",
    tier: "GOLD",
    category: "points",
    xp: 500,
  },
  RANK_1_LEADERBOARD: {
    key: "RANK_1_LEADERBOARD",
    name: "#1 Ranker",
    description: "Reach #1 on leaderboard",
    icon: "🥇",
    tier: "LEGEND",
    category: "points",
    xp: 1000,
  },

  // 🟣 Community Badges
  CONVERSATIONALIST: {
    key: "CONVERSATIONALIST",
    name: "Conversationalist",
    description: "Leave first comment",
    icon: "💬",
    tier: "BRONZE",
    category: "community",
    xp: 25,
  },
  HELPER: {
    key: "HELPER",
    name: "Helper",
    description: "Leave 10 helpful comments",
    icon: "🤝",
    tier: "SILVER",
    category: "community",
    xp: 100,
  },
  COMMUNITY_PILLAR: {
    key: "COMMUNITY_PILLAR",
    name: "Community Pillar",
    description: "Leave 50 comments",
    icon: "🏛️",
    tier: "GOLD",
    category: "community",
    xp: 250,
  },
  TIP_MASTER: {
    key: "TIP_MASTER",
    name: "Tip Master",
    description: "Submit 10 bulletin board tips",
    icon: "💡",
    tier: "SILVER",
    category: "community",
    xp: 150,
  },
  BULLETIN_HERO: {
    key: "BULLETIN_HERO",
    name: "Bulletin Hero",
    description: "Resolve a bulletin post",
    icon: "🦸",
    tier: "GOLD",
    category: "community",
    xp: 200,
  },

  // 🔵 Streak & Time Badges
  DAY_ONE: {
    key: "DAY_ONE",
    name: "Day One",
    description: "First login",
    icon: "🌅",
    tier: "BRONZE",
    category: "streak",
    xp: 10,
  },
  WEEK_WARRIOR: {
    key: "WEEK_WARRIOR",
    name: "Week Warrior",
    description: "Login 7 days in a row",
    icon: "🗡️",
    tier: "SILVER",
    category: "streak",
    xp: 100,
  },
  MONTHLY_DEVOTEE: {
    key: "MONTHLY_DEVOTEE",
    name: "Monthly Devotee",
    description: "Active for 30 days",
    icon: "📅",
    tier: "GOLD",
    category: "streak",
    xp: 300,
  },
  SEMESTER_CHAMPION: {
    key: "SEMESTER_CHAMPION",
    name: "Semester Champion",
    description: "Active for a full semester",
    icon: "🎓",
    tier: "PLATINUM",
    category: "streak",
    xp: 1000,
  },
  EARLY_BIRD: {
    key: "EARLY_BIRD",
    name: "Early Bird",
    description: "Submit item before 8AM",
    icon: "🐦",
    tier: "BRONZE",
    category: "streak",
    xp: 50,
  },
  NIGHT_OWL: {
    key: "NIGHT_OWL",
    name: "Night Owl",
    description: "Submit item after 9PM",
    icon: "🦉",
    tier: "BRONZE",
    category: "streak",
    xp: 50,
  },

  // ⚫ Special & Secret Badges
  THE_CHOSEN_ONE: {
    key: "THE_CHOSEN_ONE",
    name: "The Chosen One",
    description: "Be the very first user to register",
    icon: "✨",
    tier: "LEGEND",
    category: "special",
    xp: 5000,
    secret: true,
  },
  PHANTOM: {
    key: "PHANTOM",
    name: "Phantom",
    description: "Submit anonymous comment",
    icon: "👻",
    tier: "BRONZE",
    category: "special",
    xp: 25,
  },
  SHERLOCK: {
    key: "SHERLOCK",
    name: "Sherlock",
    description: "Use AI Search 10 times",
    icon: "🔍",
    tier: "SILVER",
    category: "special",
    xp: 100,
  },
  MAP_EXPLORER: {
    key: "MAP_EXPLORER",
    name: "Map Explorer",
    description: "Use Indoor Map 5 times",
    icon: "🗺️",
    tier: "BRONZE",
    category: "special",
    xp: 50,
  },
  SPEEDRUNNER: {
    key: "SPEEDRUNNER",
    name: "Speedrunner",
    description: "Submit found item in under 2 minutes",
    icon: "🏃",
    tier: "GOLD",
    category: "special",
    xp: 200,
  },
  COMPLETIONIST: {
    key: "COMPLETIONIST",
    name: "Completionist",
    description: "Fill all profile fields",
    icon: "📋",
    tier: "SILVER",
    category: "special",
    xp: 100,
  },
  OLD_RELIABLE: {
    key: "OLD_RELIABLE",
    name: "Old Reliable",
    description: "Use the system for 6 months",
    icon: "🕰️",
    tier: "PLATINUM",
    category: "special",
    xp: 500,
  },
  LUCKY_7: {
    key: "LUCKY_7",
    name: "Lucky 7",
    description: "Earn exactly 777 points at any time",
    icon: "🎰",
    tier: "GOLD",
    category: "special",
    xp: 777,
    secret: true,
  },
  HAT_TRICK: {
    key: "HAT_TRICK",
    name: "Hat Trick",
    description: "Submit 3 found items in one day",
    icon: "🎩",
    tier: "GOLD",
    category: "special",
    xp: 300,
  },
  SCANNER_PRO: {
    key: "SCANNER_PRO",
    name: "Scanner Pro",
    description: "Use barcode scanner 10 times",
    icon: "🔳",
    tier: "SILVER",
    category: "special",
    xp: 150,
  },
  AI_WHISPERER: {
    key: "AI_WHISPERER",
    name: "AI Whisperer",
    description: "Get a match from AI Search",
    icon: "🤖",
    tier: "GOLD",
    category: "special",
    xp: 200,
  },
  PERFECT_WEEK: {
    key: "PERFECT_WEEK",
    name: "Perfect Week",
    description: "Submit found item every day for 7 days",
    icon: "🌈",
    tier: "PLATINUM",
    category: "special",
    xp: 700,
  },
  COMEBACK_KID: {
    key: "COMEBACK_KID",
    name: "Comeback Kid",
    description: "Return after 30 days of inactivity",
    icon: "🔙",
    tier: "BRONZE",
    category: "special",
    xp: 50,
  },
  GENEROUS_SOUL: {
    key: "GENEROUS_SOUL",
    name: "Generous Soul",
    description: "Report found item worth 500+ pts equivalent",
    icon: "💖",
    tier: "PLATINUM",
    category: "special",
    xp: 500,
  },
  CLASS_OF_CHAMPIONS: {
    key: "CLASS_OF_CHAMPIONS",
    name: "Class of Champions",
    description: "Be top scorer in your department",
    icon: "🎖️",
    tier: "LEGEND",
    category: "special",
    xp: 1000,
  },
} as const;

export const seedAchievements = async () => {
  for (const ach of Object.values(ACHIEVEMENTS)) {
    await (prisma as any).achievement.upsert({
      where: { key: ach.key },
      update: {},
      create: ach,
    });
  }
};

export const awardAchievement = async (userId: string, key: string) => {
  const achievement = await (prisma as any).achievement.findUnique({ where: { key } });
  if (!achievement) return null;

  const existing = await (prisma as any).userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  });
  if (existing) return null;

  const userAchievement = await (prisma as any).userAchievement.create({
    data: { userId, achievementId: achievement.id, seen: false },
    include: { achievement: true },
  });

  if (achievement.xp > 0) {
    await (prisma as any).points.create({
      data: { userId, amount: achievement.xp, reason: `ACHIEVEMENT_${key}` },
    });
    
    // Update user total points
    await (prisma as any).user.update({
      where: { id: userId },
      data: { totalPoints: { increment: achievement.xp } }
    });
  }

  return userAchievement;
};

export const checkFoundItemAchievements = async (userId: string) => {
  const count = await (prisma as any).foundItem.count({ where: { userId } });
  const awarded = [];

  if (count >= 1) awarded.push(await awardAchievement(userId, "FIRST_FOUND_ITEM"));
  if (count >= 5) awarded.push(await awardAchievement(userId, "FOUND_5_ITEMS"));
  if (count >= 10) awarded.push(await awardAchievement(userId, "FOUND_10_ITEMS"));
  if (count >= 25) awarded.push(await awardAchievement(userId, "FOUND_25_ITEMS"));
  if (count >= 50) awarded.push(await awardAchievement(userId, "FOUND_50_ITEMS"));

  return awarded.filter(Boolean);
};

export const checkLostItemAchievements = async (userId: string) => {
  const count = await (prisma as any).lostItem.count({ where: { userId } });
  const awarded = [];

  if (count >= 1) awarded.push(await awardAchievement(userId, "FIRST_LOST_REPORT"));
  if (count >= 10) awarded.push(await awardAchievement(userId, "LOST_10_ITEMS"));
  if (count >= 25) awarded.push(await awardAchievement(userId, "LOST_25_ITEMS"));

  return awarded.filter(Boolean);
};

export const checkClaimAchievements = async (userId: string) => {
  const allClaims = await (prisma as any).claim.findMany({ where: { userId } });
  const approvedCount = allClaims.filter((c: any) => c.status === "APPROVED").length;
  const awarded = [];

  if (allClaims.length >= 1) awarded.push(await awardAchievement(userId, "FIRST_CLAIM"));
  if (approvedCount >= 1) awarded.push(await awardAchievement(userId, "FIRST_CLAIM_APPROVED"));
  if (approvedCount >= 5) awarded.push(await awardAchievement(userId, "CLAIMS_5_APPROVED"));
  if (approvedCount >= 10) awarded.push(await awardAchievement(userId, "CLAIMS_10_APPROVED"));

  if (allClaims.length >= 5 && allClaims.every((c: any) => c.status !== "REJECTED")) {
    awarded.push(await awardAchievement(userId, "CLEAN_RECORD"));
  }

  return awarded.filter(Boolean);
};

export const checkPointAchievements = async (userId: string) => {
  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user) return [];
  const points = user.totalPoints;
  const awarded = [];

  if (points >= 50) awarded.push(await awardAchievement(userId, "POINT_50"));
  if (points >= 200) awarded.push(await awardAchievement(userId, "POINT_200"));
  if (points >= 500) awarded.push(await awardAchievement(userId, "POINT_500"));
  if (points >= 1000) awarded.push(await awardAchievement(userId, "POINT_1000"));

  return awarded.filter(Boolean);
};
