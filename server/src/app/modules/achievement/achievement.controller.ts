import { Request, Response } from "express";
import prisma from "../../config/prisma";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";
import { ACHIEVEMENTS, awardAchievement, seedAchievements, computeProgress, calculateStreak } from "../../utils/achievementService";

const getAchievements = async (req: Request, res: Response) => {
  try {
    // Self-healing: Ensure all achievements are seeded, specifically checking for secret ones and tier updates
    const eggExists = await (prisma as any).achievement.findFirst({ where: { key: "EASTER_EGG" } });
    const dbCount = await (prisma as any).achievement.count();
    const defCount = Object.keys(ACHIEVEMENTS).length;
    
    // Force re-seed if egg is missing, count is off, OR if the egg is not yet LEGEND
    if (!eggExists || dbCount < defCount || eggExists.tier !== "LEGEND") {
      console.log("🌱 Achievements out of sync, missing badges, or requiring tier updates. Re-seeding...");
      // Explicitly update the Egg Hunter if it exists but is wrong
      if (eggExists && eggExists.tier !== "LEGEND") {
        await (prisma as any).achievement.update({
          where: { id: eggExists.id },
          data: { tier: "LEGEND" }
        });
      }
      await seedAchievements();
    }

    const achievements = await (prisma as any).achievement.findMany({
      include: {
        _count: {
          select: { userAchievements: true },
        },
      },
      orderBy: { category: "asc" },
    });

    const totalUsers = await (prisma as any).user.count({ where: { role: "USER", isDeleted: false } });

    // Compute progress for logged-in user
    const userId = (req as any).user?.id;
    let achievementsWithProgress = achievements;
    
    if (userId) {
      const streak = await calculateStreak(userId);
      achievementsWithProgress = await Promise.all(
        achievements.map(async (ach: any) => {
          const progress = await computeProgress(userId, ach.key);
          return {
            ...ach,
            progress: progress || null,
            currentStreak: ach.category === "streak" ? streak.currentStreak : undefined,
          };
        })
      );
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Achievements fetched successfully",
      data: { achievements: achievementsWithProgress, totalUsers },
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
      data: null,
    });
  }
};

const getMyAchievements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const myAchievements = await (prisma as any).userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: [
        { isPinned: "desc" },
        { unlockedAt: "desc" }
      ],
    });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User achievements fetched successfully",
      data: myAchievements,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
      data: null,
    });
  }
};

const togglePinAchievement = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { achievementId } = req.params;

    const userAchievement = await (prisma as any).userAchievement.findUnique({
      where: {
        userId_achievementId: { userId, achievementId }
      }
    });

    if (!userAchievement) {
      return sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: "Achievement not unlocked yet",
        data: null,
      });
    }

    // Max 6 pinned achievements
    if (!userAchievement.isPinned) {
      const pinnedCount = await (prisma as any).userAchievement.count({
        where: { userId, isPinned: true }
      });
      if (pinnedCount >= 6) {
        return sendResponse(res, {
          statusCode: StatusCodes.BAD_REQUEST,
          success: false,
          message: "You can only showcase up to 6 achievements",
          data: null,
        });
      }
    }

    const updated = await (prisma as any).userAchievement.update({
      where: { id: userAchievement.id },
      data: { isPinned: !userAchievement.isPinned },
      include: { achievement: true }
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: updated.isPinned ? "Achievement added to showcase" : "Achievement removed from showcase",
      data: updated,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
      data: null,
    });
  }
};

const getUnseenAchievements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const unseen = await (prisma as any).userAchievement.findMany({
      where: { userId, seen: false },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Unseen achievements fetched successfully",
      data: unseen,
    });
  } catch (error: any) {
    // Graceful fallback: if the `seen` column doesn't exist yet in the DB
    // (pending migration), return an empty array so the UI doesn't break.
    if (
      error?.message?.includes("seen") ||
      error?.code === "P2025" ||
      error?.code?.startsWith("P")
    ) {
      return sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "No unseen achievements",
        data: [],
      });
    }
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
      data: null,
    });
  }
};

const markAchievementsSeen = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await (prisma as any).userAchievement.updateMany({
      where: { userId, seen: false },
      data: { seen: true },
    });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Achievements marked as seen",
      data: null,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
      data: null,
    });
  }
};

const getAllUserAchievements = async (req: Request, res: Response) => {
  try {
    // Admin view: top achievement earners
    const topEarners = await (prisma as any).user.findMany({
      take: 10,
      orderBy: {
        userAchievements: {
          _count: "desc",
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        userImg: true,
        _count: {
          select: { userAchievements: true },
        },
      },
    });

    const achievementStats = await (prisma as any).achievement.findMany({
      include: {
        _count: {
          select: { userAchievements: true },
        },
      },
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Achievement stats fetched successfully",
      data: { topEarners, achievementStats },
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
      data: null,
    });
  }
};

const unlockSecretAchievement = async (req: Request, res: Response) => {
  try {
    const { secretKey } = req.body;
    const userId = (req as any).user.id;

    const VALID_SECRETS = ["EASTER_EGG"];

    if (!secretKey || !VALID_SECRETS.includes(secretKey)) {
      return res.status(400).json({ success: false, message: "Invalid secret key" });
    }

    let result = await awardAchievement(userId, secretKey);
    
    // If null, it might already be unlocked. Let's find and return it to trigger the modal.
    if (!result) {
      const achievementData = await (prisma as any).achievement.findFirst({ where: { key: secretKey } });
      if (achievementData) {
        result = await (prisma as any).userAchievement.findUnique({
          where: { userId_achievementId: { userId, achievementId: achievementData.id } },
          include: { achievement: true }
        });
      }
    }

    if (!result) {
      return res.status(400).json({ success: false, message: "Achievement invalid or not found" });
    }

    res.status(200).json({
      success: true,
      message: "Secret achievement unlocked!",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const achievementController = {
  getAchievements,
  getMyAchievements,
  getUnseenAchievements,
  markAchievementsSeen,
  getAllUserAchievements,
  togglePinAchievement,
  unlockSecretAchievement,
};
