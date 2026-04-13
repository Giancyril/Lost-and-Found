import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getMatchNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.matchNotification.findMany({
      orderBy: { sentAt: "desc" },
      take: 100,
      include: {
        lostItem: {
          select: {
            id:          true,
            lostItemName: true,
            location:    true,
            date:        true,
            schoolEmail: true,
            reporterName: true,
            category:    { select: { name: true } },
          },
        },
        foundItem: {
          select: {
            id:           true,
            foundItemName: true,
            location:     true,
            date:         true,
            img:          true,
            category:     { select: { name: true } },
          },
        },
      },
    });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("[MatchLog] Failed to fetch match notifications:", error);
    res.status(500).json({ success: false, message: "Failed to fetch match notifications" });
  }
};