import prisma from "../../config/prisma";

interface CreatePostData {
  itemName: string;
  description: string;
  location: string;
  dateLost: string;
  imageUrl?: string;
  reporterName?: string;
  contactHint?: string;
}

interface GetPostsParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
}

interface CreateTipData {
  details: string;
  location?: string;
}

const createPost = async (data: CreatePostData) => {
  return prisma.bulletinPost.create({
    data: {
      itemName:     data.itemName.trim(),
      description:  data.description,
      location:     data.location,
      dateLost:     new Date(data.dateLost),
      imageUrl:     data.imageUrl     ?? "",
      reporterName: data.reporterName ?? "",
      contactHint:  data.contactHint  ?? "",
    },
  });
};

const getPosts = async ({ page = 1, limit = 12, searchTerm = "" }: GetPostsParams) => {
  const skip = (page - 1) * limit;
  const where: any = { isDeleted: false };

  if (searchTerm) {
    where.OR = [
      { itemName:    { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
      { location:    { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.bulletinPost.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { tips: true } } },
    }),
    prisma.bulletinPost.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPage: Math.ceil(total / limit) },
  };
};

const createTip = async (postId: string, data: CreateTipData) => {
  return prisma.bulletinTip.create({
    data: {
      bulletinPostId: postId,
      details:        data.details,
      location:       data.location ?? "",
    },
  });
};

const getTips = async (postId: string) => {
  return prisma.bulletinTip.findMany({
    where: { bulletinPostId: postId },
    orderBy: { createdAt: "desc" },
  });
};

const deletePost = async (id: string) => {
  return prisma.bulletinPost.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

const deleteTip = async (tipId: string) => {
  return prisma.bulletinTip.delete({ where: { id: tipId } });
};

const resolvePost = async (id: string) => {
  return prisma.bulletinPost.update({
    where: { id },
    data: { isResolved: true },
  });
};

export const bulletinPostService = {
  createPost,
  getPosts,
  createTip,
  getTips,
  deletePost,
  deleteTip,
  resolvePost,
};
