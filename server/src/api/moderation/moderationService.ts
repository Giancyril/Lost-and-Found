import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPendingItems = async () => {
  return await prisma.comment.findMany({
    where: {
      status: 'PENDING'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      },
      foundItem: {
        select: {
          id: true,
          foundItemName: true,
          location: true
        }
      },
      lostItem: {
        select: {
          id: true,
          lostItemName: true,
          location: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const approveComment = async (commentId: string) => {
  return await prisma.comment.update({
    where: { id: commentId },
    data: {
      status: 'APPROVED'
    }
  });
};

export const rejectComment = async (commentId: string, reason?: string) => {
  return await prisma.comment.update({
    where: { id: commentId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason || 'Rejected by moderator'
    }
  });
};

export const getModerationStats = async () => {
  const stats = await prisma.comment.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  });

  return stats.reduce((acc, stat) => {
    acc[stat.status] = stat._count.id;
    return acc;
  }, {} as Record<string, number>);
};

export const getModerationLogs = async () => {
  return await prisma.comment.findMany({
    where: {
      status: {
        in: ['APPROVED', 'REJECTED']
      }
    },
    select: {
      id: true,
      content: true,
      status: true,
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};
