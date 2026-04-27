import prisma from '../../app/config/prisma';
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
  // commentsService.ts

async createComment(data: any) {
  const {
    itemId, itemType, userId, content,
    isAnonymous, location, parentCommentId
  } = data;

  const normalizedType = (itemType || 'FOUND').toUpperCase() as ItemType;

  return await prisma.comment.create({
    data: {
      itemType: normalizedType,
      userId:          userId      || null,
      content:         content     || '',
      location:        location    || null,
      isAnonymous:     isAnonymous || !userId,
      parentCommentId: parentCommentId || null,
      status: 'APPROVED',

      // ✅ Connect only the matching relation — NOT itemId directly
      ...(normalizedType === 'FOUND'
        ? { foundItem: { connect: { id: itemId } } }
        : { lostItem:  { connect: { id: itemId } } }
      ),
    },
    include: COMMENT_INCLUDE
  });
},

  async updateComment(
    commentId: string, updateData: any,
    userId: string,    userRole: string
  ) {
    const where: any = { id: commentId };
    if (userRole !== 'ADMIN') where.userId = userId;

    return await prisma.comment.update({
      where,
      data: updateData,
      include: COMMENT_INCLUDE
    });
  },

  async deleteComment(
    commentId: string,
    userId: string,
    userRole: string
  ) {
    const where: any = { id: commentId };
    if (userRole !== 'ADMIN') where.userId = userId;

    await prisma.comment.delete({ where });
    return true;
  },

  async voteHelpful(commentId: string, _userId: string) {
    return await prisma.comment.update({
      where: { id: commentId },
      data:  { helpfulCount: { increment: 1 } },
      include: COMMENT_INCLUDE
    });
  },

  async getComments(itemId: string, options: any = {}) {
    const page  = Number(options.page)  || 1;
    const limit = Number(options.limit) || 50;

    // Only fetch TOP-LEVEL comments; replies come nested via include
    return await prisma.comment.findMany({
      where: {
        itemId,
        status: 'APPROVED',
        parentCommentId: null        
      },
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
    });
  },
};