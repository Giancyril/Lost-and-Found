// src/modules/points/points.service.ts

import prisma from "../../config/prisma";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";
import { calculateStreak } from "../../utils/achievementService";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

// ── Point values per action ───────────────────────────────────────────────────
export const POINT_VALUES: Record<string, number> = {
  FOUND_ITEM_REPORTED: 50,
  CLAIM_APPROVED:      30,
  HELPFUL_COMMENT:     10,
  STREAK_BONUS:        50,
  STREAK_MILESTONE_7:  100,
  STREAK_MILESTONE_30: 300,
  STREAK_MILESTONE_100:1000,
};

// ── Get active boost multiplier ─────────────────────────────────────────────── 
export const getActiveBoostMultiplier = async (): Promise<{ multiplier: number; event: any | null }> => {
  const now = new Date();
  const event = await prisma.xPBoostEvent.findFirst({
    where: {
      isActive:  true,
      startDate: { lte: now },
      endDate:   { gte: now },
    },
  });
  return { multiplier: event?.multiplier ?? 1.0, event };
};

// ── Award points to a user (with boost support) ───────────────────────────────
const award = async (userId: string, reason: string, refId?: string) => {
  const baseAmount = POINT_VALUES[reason];
  if (!baseAmount) {
    throw new AppError(StatusCodes.BAD_REQUEST, `Unknown point reason: ${reason}`);
  }

  // ✅ CRITICAL SECURITY: Prevent points farming
  // Check if points have already been awarded for this specific action
  if (refId) {
    const existingAward = await prisma.points.findFirst({
      where: {
        userId,
        reason,
        refId,
        amount: { gt: 0 }, // Only check positive awards, not revocations
      },
    });

    if (existingAward) {
      console.warn(`[Points] Duplicate award attempt blocked: ${reason} for refId ${refId} by user ${userId}`);
      return existingAward; // Return existing record, don't award again
    }
  }

  // Apply boost multiplier (streak bonuses are NOT boosted — only actions are)
  const isStreakReason = reason.startsWith("STREAK");
  let amount = baseAmount;
  if (!isStreakReason) {
    const { multiplier } = await getActiveBoostMultiplier();
    amount = Math.round(baseAmount * multiplier);
  }

  // Create the Points record and bump totalPoints atomically
  const [pointRecord] = await prisma.$transaction([
    prisma.points.create({
      data: { userId, amount, reason, refId },
    }),
    prisma.user.update({
      where: { id: userId },
      data:  { totalPoints: { increment: amount } },
    }),
  ]);

  return pointRecord;
};

// ── Revoke points (e.g. claim rejected after approval) ───────────────────────
const revoke = async (userId: string, reason: string, refId?: string) => {
  const amount = POINT_VALUES[reason];
  if (!amount) return;

  await prisma.$transaction([
    prisma.points.create({
      data: { userId, amount: -amount, reason: `REVOKED_${reason}`, refId },
    }),
    prisma.user.update({
      where: { id: userId },
      data:  { totalPoints: { decrement: amount } },
    }),
  ]);
};

// ── Record login + award streak ─────────────────────────────────────────────── 
// Call this from your auth.controller login handler
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
    if (lastLogin.getTime() === today.getTime()) {
      // Already logged in today — no change
      return;
    } else if (lastLogin.getTime() === yesterday.getTime()) {
      // Consecutive day — increment
      newStreak = user.loginStreak + 1;
    }
    // else: streak broken — reset to 1
  }

  await prisma.user.update({
    where: { id: userId },
    data:  { loginStreak: newStreak, lastLoginDate: new Date() },
  });

  // Award streak milestone XP (idempotent via refId)
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

  // Award daily streak bonus (≥3 days)
  if (newStreak >= 3) {
    const todayStr = today.toISOString().split("T")[0];
    await award(userId, "STREAK_BONUS", `streak-daily-${todayStr}`);
  }
};

// ── Weighted leaderboard score (decay older points) ─────────────────────────── 
// Points from the last 30 days count fully.
// Points 31–90 days old count at 70%.
// Points older than 90 days count at 40%.
const getWeightedScore = async (userId: string): Promise<number> => {
  const now = new Date();
  const d30  = new Date(now.getTime() - 30  * 86_400_000);
  const d90  = new Date(now.getTime() - 90  * 86_400_000);

  const [recent, mid, old] = await Promise.all([
    prisma.points.aggregate({
      where:   { userId, amount: { gt: 0 }, createdAt: { gte: d30 } },
      _sum:    { amount: true },
    }),
    prisma.points.aggregate({
      where:   { userId, amount: { gt: 0 }, createdAt: { gte: d90, lt: d30 } },
      _sum:    { amount: true },
    }),
    prisma.points.aggregate({
      where:   { userId, amount: { gt: 0 }, createdAt: { lt: d90 } },
      _sum:    { amount: true },
    }),
  ]);

  const recentAmount = (recent._sum as any)?.amount || 0;
  const midAmount = (mid._sum as any)?.amount || 0;
  const oldAmount = (old._sum as any)?.amount || 0;

  return (
    recentAmount * 1.0 +
    midAmount * 0.7 +
    oldAmount * 0.4
  );
};

// ── Get points history for the logged-in user ─────────────────────────────────
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

// ── Leaderboard (all-time, weighted, weekly, monthly) ────────────────────────
const getLeaderboard = async (type: "alltime" | "weighted" | "weekly" | "monthly" = "alltime") => {
  if (type === "alltime") {
    return prisma.user.findMany({
      where:   { totalPoints: { gt: 0 }, role: "USER", isDeleted: false },
      orderBy: { totalPoints: "desc" },
      take:    50,
      select: {
        id:          true,
        name:        true,
        totalPoints: true,
        userImg:     true,
        schoolId:    true,
        loginStreak: true,
      },
    });
  }

  // For weekly/monthly: sum points in date range
  const since = type === "weekly"
    ? startOfWeek(new Date(), { weekStartsOn: 1 })   // Monday
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
    select: { id: true, name: true, totalPoints: true, userImg: true, schoolId: true, loginStreak: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  return rows
    .filter((r: any) => userMap[r.userId])
    .map((r: any) => ({
      ...userMap[r.userId],
      periodPoints: r._sum?.amount ?? 0,
    }));
};

// ── Weighted leaderboard (for "freshness" tab) ──────────────────────────────── 
const getWeightedLeaderboard = async () => {
  const users = await prisma.user.findMany({
    where:   { role: "USER", isDeleted: false, totalPoints: { gt: 0 } },
    select:  { id: true, name: true, totalPoints: true, userImg: true, schoolId: true, loginStreak: true },
    take:    100,
    orderBy: { totalPoints: "desc" },
  });

  const withScores = await Promise.all(
    users.map(async u => ({
      ...u,
      weightedScore: Math.round(await getWeightedScore(u.id)),
    }))
  );

  return withScores
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 50);
};

// ── Boost event management (admin) ────────────────────────────────────────────
const createBoostEvent = async (data: {
  name: string;
  multiplier: number;
  startDate: Date;
  endDate: Date;
}) => {
  return prisma.xPBoostEvent.create({ data });
};

const getBoostEvents = async () => {
  return prisma.xPBoostEvent.findMany({
    orderBy: { createdAt: "desc" },
    take:    20,
  });
};

const deactivateBoostEvent = async (id: string) => {
  return prisma.xPBoostEvent.update({
    where: { id },
    data:  { isActive: false },
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
};