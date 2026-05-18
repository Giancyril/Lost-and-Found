import { Request, Response } from "express";
import prisma from "../../config/prisma";

export const gratitudeController = {
  // Create a digital thank-you note and award rewards points to the hero student
  createNote: async (req: Request, res: Response): Promise<void> => {
    try {
      const senderId = (req as any).user.id;
      const { receiverId, itemId, message, badgeType } = req.body;

      if (!receiverId || !message || !badgeType) {
        res.status(400).json({
          success: false,
          message: "Receiver ID, message, and badge type are required.",
        });
        return;
      }

      if (senderId === receiverId) {
        res.status(400).json({
          success: false,
          message: "You cannot send a thank-you note to yourself.",
        });
        return;
      }

      // Check if a gratitude note already exists for this item to prevent duplicate rewards
      if (itemId) {
        const existingNote = await prisma.gratitudeNote.findFirst({
          where: { senderId, receiverId, itemId },
        });

        if (existingNote) {
          res.status(400).json({
            success: false,
            message: "You have already sent a thank-you note for this item.",
          });
          return;
        }
      }

      // Start transaction: Create gratitude note, record points log, and update user's total points (+50 XP!)
      const result = await prisma.$transaction(async (tx) => {
        const note = await tx.gratitudeNote.create({
          data: {
            senderId,
            receiverId,
            itemId,
            message,
            badgeType,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                userImg: true,
              },
            },
          },
        });

        // Award 50 points to the hero student
        const pointsLog = await tx.points.create({
          data: {
            userId: receiverId,
            amount: 50,
            reason: `Received a Thank-You Note: "${message.substring(0, 30)}..."`,
            refId: note.id,
          },
        });

        // Increment totalPoints in user model
        await tx.user.update({
          where: { id: receiverId },
          data: {
            totalPoints: {
              increment: 50,
            },
          },
        });

        return { note, pointsLog };
      });

      res.status(201).json({
        success: true,
        message: "Thank-you note sent successfully! 50 Points awarded to the hero finder.",
        data: result.note,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create thank-you note.",
      });
    }
  },

  // Get all gratitude notes received by a specific user
  getUserReceivedNotes: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const notes = await prisma.gratitudeNote.findMany({
        where: { receiverId: userId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              userImg: true,
              schoolId: true,
              course: true,
              yearLevel: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({
        success: true,
        data: notes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch gratitude notes.",
      });
    }
  },

  // Get stats for a student profile (total thank-you notes received, points, etc.)
  getHeroStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          userImg: true,
          schoolId: true,
          course: true,
          yearLevel: true,
          totalPoints: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found.",
        });
        return;
      }

      // Count received gratitude notes
      const notesCount = await prisma.gratitudeNote.count({
        where: { receiverId: userId },
      });

      // Fetch badge distributions
      const badgeGroups = await prisma.gratitudeNote.groupBy({
        by: ["badgeType"],
        where: { receiverId: userId },
        _count: {
          id: true,
        },
      }) as any[];

      res.status(200).json({
        success: true,
        data: {
          user,
          totalGratitudeNotes: notesCount,
          badgeBreakdown: badgeGroups.map((group) => ({
            badge: group.badgeType,
            count: group._count.id,
          })),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch hero stats.",
      });
    }
  },
};
