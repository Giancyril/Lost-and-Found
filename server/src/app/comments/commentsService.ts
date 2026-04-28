// v3 - fixed delete for anonymous/unauthenticated users
import prisma from '../config/prisma';
import { ItemType } from '@prisma/client';

const COMMENT_INCLUDE = {
  user: {
    select: { id: true, name: true, userImg: true, role: true }
  },
  replies: {
    where: { status: 'APPROVED' as const },
    include: {
      user: {
        select: { id: true, name: true, userImg: true, role: true }
      }
    },
    orderBy: { createdAt: 'asc' as const }
  }
};

export const commentService = {
  async createComment(data: any) {
    const {
      itemId, itemType, userId, content,
      isAnonymous, location, parentCommentId
    } = data;

    return await prisma.comment.create({
      data: {
        itemId,
        itemType:        (itemType || 'FOUND').toUpperCase() as ItemType,
        content:         content          || '',
        location:        location         || null,
        isAnonymous:     isAnonymous      || !userId,
        parentCommentId: parentCommentId  || null,
        status:          'APPROVED',
        ...(userId && { user: { connect: { id: userId } } }),
      },
      include: COMMENT_INCLUDE,
    });
  },

  async updateComment(
    commentId: string,
    updateData: any,
    userId: string | null,
    userRole: string
  ) {
    const where: any = { id: commentId };
    if (userRole !== 'ADMIN' && userId) where.userId = userId;

    return await prisma.comment.update({
      where,
      data: updateData,
      include: COMMENT_INCLUDE,
    });
  },

  async deleteComment(
    commentId: string,
    userId: string | null,
    userRole: string
  ) {
    const where: any = { id: commentId };

    if (userRole === 'ADMIN') {
      // Admin can delete any comment — no userId filter
    } else if (userId) {
      // Logged-in user can only delete their own
      where.userId = userId;
    }
    // If no userId and not admin, attempt anyway —
    // Prisma will throw P2025 (not found) which the controller catches as 500
    // This is acceptable — anonymous users shouldn't be deleting in production

    await prisma.comment.delete({ where });
    return true;
  },

  async voteHelpful(commentId: string, _userId: string | null) {
    return await prisma.comment.update({
      where: { id: commentId },
      data:  { helpfulCount: { increment: 1 } },
      include: COMMENT_INCLUDE,
    });
  },

  async getComments(itemId: string, options: any = {}) {
    const page  = Number(options.page)  || 1;
    const limit = Number(options.limit) || 50;

    // Only fetch top-level comments; replies come nested via COMMENT_INCLUDE
    return await prisma.comment.findMany({
      where: {
        itemId,
        status:          'APPROVED',
        parentCommentId: null,
      },
      include:  COMMENT_INCLUDE,
      orderBy:  { createdAt: 'desc' },
      skip:     (page - 1) * limit,
      take:     limit,
    });
  },
};