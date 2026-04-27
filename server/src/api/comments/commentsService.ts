import prisma from '../../app/config/prisma';
import { ItemType } from '@prisma/client';

export const commentService = {
  async createComment(data: any) {
    const { itemId, itemType, userId, content, isAnonymous, location } = data;

    return await prisma.comment.create({
      data: {
        itemId,
        itemType: (itemType || 'FOUND').toUpperCase() as ItemType,
        userId: userId || null,
        content: content || '',
        location: location || null,
        isAnonymous: isAnonymous || !userId,
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            userImg: true,
            role: true
          }
        }
      }
    });
  },

  async updateComment(commentId: string, updateData: any, userId: string, userRole: string) {
    const where: any = { id: commentId };
    if (userRole !== 'ADMIN') {
      where.userId = userId;
    }

    return await prisma.comment.update({
      where,
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            userImg: true,
            role: true
          }
        }
      }
    });
  },

  async deleteComment(commentId: string, userId: string, userRole: string) {
    const where: any = { id: commentId };
    if (userRole !== 'ADMIN') {
      where.userId = userId;
    }

    await prisma.comment.delete({ where });
    return true;
  },

  async voteHelpful(commentId: string, userId: string) {
    return await prisma.comment.update({
      where: { id: commentId },
      data: {
        helpfulCount: {
          increment: 1
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            userImg: true,
            role: true
          }
        }
      }
    });
  },

  async getComments(itemId: string, options: any = {}) {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        id, "itemId", "itemType", content, "isAnonymous", 
        "helpfulCount", status, "createdAt", "userId", location
      FROM comments
      WHERE "itemId" = ${itemId}
        AND status = 'APPROVED'
      ORDER BY "createdAt" DESC
      LIMIT 50
    `;
    return result;
  } catch (error: any) {
    console.error('RAW QUERY ERROR:', error?.message);
    throw error;
  }
},
};