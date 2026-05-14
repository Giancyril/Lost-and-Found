import { Request, Response } from "express";
import prisma from "../../config/prisma";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";

const getAchievements = async (req: Request, res: Response) => {
  try {
    const achievements = await (prisma as any).achievement.findMany({
      include: {
        _count: {
          select: { userAchievements: true },
        },
      },
      orderBy: { category: "asc" },
    });

    const totalUsers = await (prisma as any).user.count({ where: { role: "USER", isDeleted: false } });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Achievements fetched successfully",
      data: { achievements, totalUsers },
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

export const achievementController = {
  getAchievements,
  getMyAchievements,
  getUnseenAchievements,
  markAchievementsSeen,
  getAllUserAchievements,
  togglePinAchievement,
};
