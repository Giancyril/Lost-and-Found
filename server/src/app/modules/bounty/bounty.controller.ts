import { Request, Response } from "express";
import prisma from "../../config/prisma";
import { generateWeeklyBounties, incrementBountyProgress } from "./bounty.service";

const getActiveBounties = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Self-healing: if no active bounties, generate them
    let activeBounties = await prisma.bounty.findMany({
      where: { isActive: true }
    });

    if (activeBounties.length === 0) {
      await generateWeeklyBounties();
      activeBounties = await prisma.bounty.findMany({
        where: { isActive: true }
      });
    }

    const bountyIds = activeBounties.map((b: any) => b.id);

    const userProgress = await prisma.userBountyProgress.findMany({
      where: {
        userId: user.id,
        bountyId: { in: bountyIds }
      }
    });

    const bountiesWithProgress = activeBounties.map((bounty: any) => {
      const progress = userProgress.find((p: any) => p.bountyId === bounty.id);
      return {
        ...bounty,
        currentCount: progress ? progress.currentCount : 0,
        isCompleted: progress ? progress.isCompleted : false
      };
    });

    res.status(200).json({
      success: true,
      message: "Active bounties fetched successfully",
      data: bountiesWithProgress
    });
  } catch (error) {
    console.error("Error fetching bounties:", error);
    res.status(500).json({ success: false, message: "Failed to fetch bounties", error });
  }
};

const recordMapVirtualView = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await incrementBountyProgress(userId, "VIEW_MAP");
    res.status(200).json({
      success: true,
      message: "Map view recorded and bounty progress updated",
    });
  } catch (error) {
    console.error("Error recording map view:", error);
    res.status(500).json({ success: false, message: "Failed to record map view", error });
  }
};

export const bountyController = {
  getActiveBounties,
  recordMapVirtualView
};
