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
    const { page = 1, limit = 50, status = 'APPROVED' } = options;

    return await prisma.comment.findMany({
      where: {
        itemId,
        status: status as any
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });
  }
};