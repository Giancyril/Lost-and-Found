// src/modules/points/points.service.ts

import prisma from "../../config/prisma";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";
import { calculateStreak } from "../../utils/achievementService";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

export const POINT_VALUES: Record<string, number> = {
  FOUND_ITEM_REPORTED:  50,
  CLAIM_APPROVED:       30,
  HELPFUL_COMMENT:      10,
  STREAK_BONUS:         50,
  STREAK_MILESTONE_7:   100,
  STREAK_MILESTONE_30:  300,
  STREAK_MILESTONE_100: 1000,
};

// ── Daily cap — max positive award transactions per user per day ──────────────
const DAILY_AWARD_CAP = 10;

// ── Suspicious threshold — flag if daily total exceeds N × campus average ─────
const SUSPICIOUS_MULTIPLIER = 3;

// ── Get active boost multiplier ───────────────────────────────────────────────
export const getActiveBoostMultiplier = async (): Promise<{ multiplier: number; event: any | null }> => {
  const now = new Date();
  const event = await prisma.xPBoostEvent.findFirst({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
  });
  return { multiplier: event?.multiplier ?? 1.0, event };
};

// ── Compute today's average points awarded across all active users ────────────
// Used to set a dynamic suspicious threshold rather than a hardcoded number.
const getDailyAveragePoints = async (): Promise<number> => {
  const today = startOfDay(new Date());
  const result = await prisma.points.aggregate({
    where:  { createdAt: { gte: today }, amount: { gt: 0 } },
    _sum:   { amount: true },
    _count: { userId: true },
  });

  const totalPoints    = (result._sum as any)?.amount  ?? 0;
  const distinctResult = await prisma.points.groupBy({
    by:    ["userId"],
    where: { createdAt: { gte: today }, amount: { gt: 0 } },
  });
  const activeUsers = distinctResult.length;

  if (activeUsers === 0) return 0;
  return totalPoints / activeUsers;
};

// ── Flag a user for suspicious activity ───────────────────────────────────────
const flagUser = async (
  userId:       string,
  reason:       string,
  dailyTotal:   number,
  avgPoints:    number,
) => {
  // Only flag once — don't spam if already flagged today
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { isFlagged: true, flaggedAt: true, name: true, username: true },
  });

  const alreadyFlaggedToday =
    user?.isFlagged &&
    user?.flaggedAt &&
    startOfDay(user.flaggedAt).getTime() === startOfDay(new Date()).getTime();

  if (alreadyFlaggedToday) return;

  await prisma.user.update({
    where: { id: userId },
    data:  {
      isFlagged:  true,
      flagReason: reason,
      flaggedAt:  new Date(),
    },
  });

  // Write to SystemAuditLog so admins can see it in the audit panel
  await prisma.systemAuditLog.create({
    data: {
      entityType:   "User",
      entityId:     userId,
      action:       "SUSPICIOUS_POINTS_ACTIVITY",
      newData:      JSON.stringify({
        dailyTotal,
        campusAverage: Math.round(avgPoints),
        multiplier:    (dailyTotal / Math.max(avgPoints, 1)).toFixed(2),
        reason,
        flaggedAt:     new Date().toISOString(),
      }),
      performedBy:  "System",
      performedById: null,
    },
  });

  console.warn(
    `[Security] User ${userId} flagged — daily total: ${dailyTotal} pts, ` +
    `campus avg: ${Math.round(avgPoints)} pts, multiplier: ${(dailyTotal / Math.max(avgPoints, 1)).toFixed(2)}×`
  );
};

// ── Award points (with daily cap + suspicious activity detection) ─────────────
const award = async (userId: string, reason: string, refId?: string) => {
  const baseAmount = POINT_VALUES[reason];
  if (!baseAmount) {
    throw new AppError(StatusCodes.BAD_REQUEST, `Unknown point reason: ${reason}`);
  }

  // ── Duplicate guard (existing) ────────────────────────────────────────────
  if (refId) {
    const existingAward = await prisma.points.findFirst({
      where: { userId, reason, refId, amount: { gt: 0 } },
    });

    if (existingAward) {
      console.warn(`[Points] Duplicate blocked: ${reason} refId=${refId} user=${userId}`);
      return existingAward;
    }
  }

  const today = startOfDay(new Date());

  // ── Daily cap check ───────────────────────────────────────────────────────
  // Streak bonuses and milestone rewards are exempt — they're already
  // idempotent via refId and capping them would break streak incentives.
  const isStreakReason = reason.startsWith("STREAK");
  if (!isStreakReason) {
    const todayCount = await prisma.points.count({
      where: {
        userId,
        createdAt: { gte: today },
        amount:    { gt: 0 },
      },
    });

    if (todayCount >= DAILY_AWARD_CAP) {
      console.warn(`[Points] Daily cap hit — user=${userId} already has ${todayCount} positive awards today`);
      
      // Write a soft-block audit entry so admins can see the cap firing
      await prisma.systemAuditLog.create({
        data: {
          entityType:    "User",
          entityId:      userId,
          action:        "DAILY_CAP_HIT",
          newData:       JSON.stringify({ reason, refId, todayCount, cap: DAILY_AWARD_CAP }),
          performedBy:   "System",
          performedById: null,
        },
      });

      return null; // silent block — user sees nothing
    }
  }

  // ── Apply boost multiplier ────────────────────────────────────────────────
  let amount = baseAmount;
  if (!isStreakReason) {
    const { multiplier } = await getActiveBoostMultiplier();
    amount = Math.round(baseAmount * multiplier);
  }

  // ── Write the award ───────────────────────────────────────────────────────
  const [pointRecord] = await prisma.$transaction([
    prisma.points.create({ data: { userId, amount, reason, refId } }),
    prisma.user.update({
      where: { id: userId },
      data:  { totalPoints: { increment: amount } },
    }),
  ]);

  // ── Suspicious activity check (runs after award, non-blocking) ───────────
  // Only check for action-based awards, not streak bonuses.
  if (!isStreakReason) {
    // Fire-and-forget — don't await so it never slows down the response
    checkSuspiciousActivity(userId).catch(err =>
      console.error("[Security] Suspicious activity check failed:", err)
    );
  }

  return pointRecord;
};

// ── Check if a user's daily total is suspiciously high ───────────────────────
const checkSuspiciousActivity = async (userId: string) => {
  const today = startOfDay(new Date());

  // Sum all positive points this user earned today
  const userDailyResult = await prisma.points.aggregate({
    where:  { userId, createdAt: { gte: today }, amount: { gt: 0 } },
    _sum:   { amount: true },
  });
  const userDailyTotal = (userDailyResult._sum as any)?.amount ?? 0;

  // Get campus-wide average for today
  const avgPoints = await getDailyAveragePoints();

  // Skip flagging if average is too low to be meaningful
  // (e.g. early morning when only 1–2 users have earned anything)
  if (avgPoints < 30) return;

  const threshold = avgPoints * SUSPICIOUS_MULTIPLIER;
  if (userDailyTotal >= threshold) {
    await flagUser(
      userId,
      `Earned ${userDailyTotal} pts today — ${SUSPICIOUS_MULTIPLIER}× campus average of ${Math.round(avgPoints)} pts`,
      userDailyTotal,
      avgPoints,
    );
  }
};

// ── Revoke points ─────────────────────────────────────────────────────────────
const revoke = async (userId: string, reason: string, refId?: string) => {
  const amount = POINT_VALUES[reason];
  if (!amount) return;

  await prisma.$transaction([
    prisma.points.create({ data: { userId, amount: -amount, reason: `REVOKED_${reason}`, refId } }),
    prisma.user.update({ where: { id: userId }, data: { totalPoints: { decrement: amount } } }),
  ]);
};

// ── Record login streak ───────────────────────────────────────────────────────
export const recordLoginStreak = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { loginStreak: true, lastLoginDate: true },
  });
  if (!user) return;

  const today     = startOfDay(new Date());
  const yesterday = startOfDay(new Date(Date.now() - 86_400_000));
  const lastLogin = user.lastLoginDate ? startOfDay(user.lastLoginDate) : null;

  let newStreak = 1;
  if (lastLogin) {
    if (lastLogin.getTime() === today.getTime()) return; // already logged in today
    if (lastLogin.getTime() === yesterday.getTime()) newStreak = user.loginStreak + 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data:  { loginStreak: newStreak, lastLoginDate: new Date() },
  });

  const milestones: Array<[number, string]> = [
    [7,   "STREAK_MILESTONE_7"],
    [30,  "STREAK_MILESTONE_30"],
    [100, "STREAK_MILESTONE_100"],
  ];

  for (const [days, reason] of milestones) {
    if (newStreak === days) {
      await award(userId, reason, `streak-${days}-${today.toISOString().split("T")[0]}`);
    }
  }

  if (newStreak >= 3) {
    const todayStr = today.toISOString().split("T")[0];
    await award(userId, "STREAK_BONUS", `streak-daily-${todayStr}`);
  }
};

// ── Weighted score (for freshness leaderboard) ────────────────────────────────
const getWeightedScore = async (userId: string): Promise<number> => {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86_400_000);
  const d90 = new Date(now.getTime() - 90 * 86_400_000);

  const [recent, mid, old] = await Promise.all([
    prisma.points.aggregate({ where: { userId, amount: { gt: 0 }, createdAt: { gte: d30 } }, _sum: { amount: true } }),
    prisma.points.aggregate({ where: { userId, amount: { gt: 0 }, createdAt: { gte: d90, lt: d30 } }, _sum: { amount: true } }),
    prisma.points.aggregate({ where: { userId, amount: { gt: 0 }, createdAt: { lt: d90 } }, _sum: { amount: true } }),
  ]);

  return (
    ((recent._sum as any)?.amount || 0) * 1.0 +
    ((mid._sum as any)?.amount || 0) * 0.7 +
    ((old._sum as any)?.amount || 0) * 0.4
  );
};

// ── Get my points ─────────────────────────────────────────────────────────────
const getMyPoints = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { totalPoints: true, name: true, loginStreak: true, lastLoginDate: true },
  });

  const history = await prisma.points.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    take:    50,
  });

  const streak = await calculateStreak(userId);
  const { event: boostEvent } = await getActiveBoostMultiplier();

  return {
    totalPoints:   user?.totalPoints  ?? 0,
    name:          user?.name         ?? "",
    loginStreak:   user?.loginStreak  ?? 0,
    lastLoginDate: user?.lastLoginDate ?? null,
    history,
    streak,
    boostEvent,
  };
};

// ── Leaderboard ───────────────────────────────────────────────────────────────
const getLeaderboard = async (type: "alltime" | "weighted" | "weekly" | "monthly" = "alltime") => {
  if (type === "alltime") {
    return prisma.user.findMany({
      where:   { totalPoints: { gt: 0 }, role: "USER", isDeleted: false },
      orderBy: { totalPoints: "desc" },
      take:    50,
      select:  {
        id: true, name: true, totalPoints: true,
        userImg: true, schoolId: true, loginStreak: true, rankSnapshot: true,
      },
    });
  }

  const since = type === "weekly"
    ? startOfWeek(new Date(), { weekStartsOn: 1 })
    : startOfMonth(new Date());

  const rows = await prisma.points.groupBy({
    by:      ["userId"],
    where:   { amount: { gt: 0 }, createdAt: { gte: since } },
    _sum:    { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take:    50,
  });

  if (rows.length === 0) return [];

  const userIds = rows.map((r: any) => r.userId);
  const users   = await prisma.user.findMany({
    where:  { id: { in: userIds }, isDeleted: false },
    select: { id: true, name: true, totalPoints: true, userImg: true, schoolId: true, loginStreak: true, rankSnapshot: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  return rows
    .filter((r: any) => userMap[r.userId])
    .map((r: any) => ({ ...userMap[r.userId], periodPoints: (r._sum as any)?.amount ?? 0 }));
};

// ── Weighted leaderboard ──────────────────────────────────────────────────────
const getWeightedLeaderboard = async () => {
  const users = await prisma.user.findMany({
    where:   { role: "USER", isDeleted: false, totalPoints: { gt: 0 } },
    select:  { id: true, name: true, totalPoints: true, userImg: true, schoolId: true, loginStreak: true, rankSnapshot: true },
    take:    100,
    orderBy: { totalPoints: "desc" },
  });

  const withScores = await Promise.all(
    users.map(async u => ({ ...u, weightedScore: Math.round(await getWeightedScore(u.id)) }))
  );

  return withScores.sort((a, b) => b.weightedScore - a.weightedScore).slice(0, 50);
};

// ── Get my exact rank (works outside top 50) ──────────────────────────────────
const getMyRank = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { totalPoints: true, rankSnapshot: true, name: true },
  });

  if (!user) return null;

  const rank = await prisma.user.count({
    where: { totalPoints: { gt: user.totalPoints }, role: "USER", isDeleted: false },
  }) + 1;

  const delta = user.rankSnapshot != null ? user.rankSnapshot - rank : null;

  return { rank, totalPoints: user.totalPoints, name: user.name, rankSnapshot: user.rankSnapshot, delta };
};

// ── Snapshot today's ranks ────────────────────────────────────────────────────
export const snapshotRanks = async () => {
  const users = await prisma.user.findMany({
    where:   { role: "USER", isDeleted: false, totalPoints: { gt: 0 } },
    orderBy: { totalPoints: "desc" },
    select:  { id: true },
  });

  for (let i = 0; i < users.length; i++) {
    await prisma.user.update({
      where: { id: users[i].id },
      data:  { rankSnapshot: i + 1 },
    });
  }

  console.log(`[Snapshot] Ranks saved for ${users.length} users`);
};

// ── Boost event management ────────────────────────────────────────────────────
const createBoostEvent = async (data: { name: string; multiplier: number; startDate: Date; endDate: Date }) => {
  return prisma.xPBoostEvent.create({ data });
};

const getBoostEvents = async () => {
  return prisma.xPBoostEvent.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
};

const deactivateBoostEvent = async (id: string) => {
  return prisma.xPBoostEvent.update({ where: { id }, data: { isActive: false } });
};

// ── Admin: get flagged users ──────────────────────────────────────────────────
const getFlaggedUsers = async () => {
  return prisma.user.findMany({
    where:   { isFlagged: true, isDeleted: false },
    orderBy: { flaggedAt: "desc" },
    select:  {
      id: true, name: true, username: true, email: true, schoolId: true,
      totalPoints: true, isFlagged: true, flagReason: true, flaggedAt: true,
    },
  });
};

// ── Admin: clear a flag after review ─────────────────────────────────────────
const clearFlag = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data:  { isFlagged: false, flagReason: null, flaggedAt: null },
  });
};

export const pointsService = {
  award,
  revoke,
  getMyPoints,
  getLeaderboard,
  getWeightedLeaderboard,
  recordLoginStreak,
  getActiveBoostMultiplier,
  createBoostEvent,
  getBoostEvents,
  deactivateBoostEvent,
  getMyRank,
  snapshotRanks,
  getFlaggedUsers,
  clearFlag,
};
