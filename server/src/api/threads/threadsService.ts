import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const threadsService = {
  async getAllThreads() {
    return prisma.discussionThread.findMany({
      include: {
        creator: { select: { id: true, name: true, role: true } }, // ✅ was 'user'
        replies: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async createThread(threadData: any) {
    return prisma.discussionThread.create({
      data: {
        title: threadData.title,
        createdBy: threadData.userId,
        category: threadData.category,
      },
      include: {
        creator: { select: { id: true, name: true, role: true } } // ✅ was 'user'
      }
    });
  },

  async getThreadById(threadId: string) {
    return prisma.discussionThread.findUnique({
      where: { id: threadId },
      include: {
        creator: { select: { id: true, name: true, role: true } }, // ✅ was 'user'
        replies: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  },

  async updateThread(threadId: string, updateData: any) {
    return prisma.discussionThread.update({
      where: { id: threadId },
      data: updateData
    });
  },

  async deleteThread(threadId: string) {
    return prisma.discussionThread.delete({ where: { id: threadId } });
  },

  async getThreadReplies(threadId: string) {
    return prisma.threadReply.findMany({
      where: { threadId },
      include: {
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  },

  async createReply(replyData: any) {
    return prisma.threadReply.create({
      data: {
        content: replyData.content,
        threadId: replyData.threadId,
        userId: replyData.userId
      },
      include: {
        user: { select: { id: true, name: true, role: true } }
      }
    });
  }
};