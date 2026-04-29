// src/modules/points/points.service.ts
// Drop this in your backend alongside your other module folders.

import prisma from "../../config/prisma";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";

// ── Point values per action ───────────────────────────────────────────────────
export const POINT_VALUES: Record<string, number> = {
  FOUND_ITEM_REPORTED: 50,
  CLAIM_APPROVED:      30,
  HELPFUL_COMMENT:     10,
};

// ── Award points to a user ────────────────────────────────────────────────────
const award = async (userId: string, reason: string, refId?: string) => {
  const amount = POINT_VALUES[reason];
  if (!amount) {
    throw new AppError(StatusCodes.BAD_REQUEST, `Unknown point reason: ${reason}`);
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

// ── Get points history for the logged-in user ─────────────────────────────────
const getMyPoints = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { totalPoints: true, name: true },
  });

  const history = await prisma.points.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    take:    50,
  });

  return { totalPoints: user?.totalPoints ?? 0, history };
};

// ── Leaderboard — top 10 students by totalPoints ─────────────────────────────
const getLeaderboard = async () => {
  return prisma.user.findMany({
    where:   { totalPoints: { gt: 0 } },
    orderBy: { totalPoints: 'desc' },
    take:    10,
    select:  { id: true, name: true, totalPoints: true, userImg: true },
  });
};

export const pointsService = {
  award,
  revoke,
  getMyPoints,
  getLeaderboard,
};