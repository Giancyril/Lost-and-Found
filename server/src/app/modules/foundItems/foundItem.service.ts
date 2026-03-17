import { FoundItem, Prisma } from "@prisma/client";
import { TFilter } from "../../global/interface";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../../config/prisma";

const createFoundItem = async (
  data: FoundItem & { lostItemId?: string; reporterName?: string },
  userId?: string
) => {
  const createData: any = {
    categoryId: data.categoryId,
    description: data.description,
    date: data.date,
    claimProcess: data.claimProcess || "Visit the SAS office with valid ID to claim this item.",
    img: data.img,
    foundItemName: data.foundItemName,
    location: data.location,
    reporterName: data.reporterName || "",
  };
  if (userId) createData.userId = userId;

  const result = await prisma.foundItem.create({
    data: createData,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      category: true,
    },
  });

  if (data.lostItemId) {
    await prisma.lostItem.update({
      where: { id: data.lostItemId },
      data: { isFound: true },
    });
  }

  return result;
};

const getFoundItem = async (data: TFilter) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "foundItemName",
    sortOrder = "asc",
    foundItemName,
  } = data;

  const whereConditions: Prisma.FoundItemWhereInput = {
    isDeleted: false,
    isArchived: false, // ← exclude archived from public feed
  };

  if (foundItemName) {
    whereConditions.foundItemName = {
      contains: foundItemName,
      mode: "insensitive",
    };
  }
  if (searchTerm) {
    whereConditions.OR = [
      { foundItemName: { contains: searchTerm, mode: "insensitive" } },
      { location: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const result = await prisma.foundItem.findMany({
    where: whereConditions,
    orderBy: { [sortBy]: sortOrder },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      category: true,
    },
  });

  return result;
};

const getSingleFoundItem = async (id: string) => {
  const result = await prisma.foundItem.findFirst({
    where: { id, isDeleted: false },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
        },
      },
      category: true,
    },
  });
  return result;
};

const getMyFoundItem = async (user: JwtPayload) => {
  const result = await prisma.foundItem.findMany({
    where: { userId: user.id, isDeleted: false },
    include: { user: true, category: true },
  });
  return result;
};

const editMyFoundItem = async (data: any) => {
  const updateData: any = {};
  if (data?.foundItemName) updateData.foundItemName = data.foundItemName;
  if (data?.location) updateData.location = data.location;
  if (data?.date) updateData.date = data.date;
  if (data?.description) updateData.description = data.description;
  if (data?.reporterName !== undefined) updateData.reporterName = data.reporterName;

  const result = await prisma.foundItem.update({
    where: { id: data.id },
    data: updateData,
  });
  return result;
};

const deleteMyFoundItem = async (id: string) => {
  const result = await prisma.foundItem.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return result;
};

// ── Archive / Restore ─────────────────────────────────────────────────────────

const archiveFoundItem = async (id: string) => {
  const result = await prisma.foundItem.update({
    where: { id },
    data: { isArchived: true, archivedAt: new Date() },
  });
  return result;
};

const restoreFoundItem = async (id: string) => {
  const result = await prisma.foundItem.update({
    where: { id },
    data: { isArchived: false, archivedAt: null },
  });
  return result;
};

const getArchivedFoundItems = async () => {
  const result = await prisma.foundItem.findMany({
    where: { isDeleted: false, isArchived: true },
    orderBy: { archivedAt: "desc" },
    include: {
      user: {
        select: { id: true, username: true, email: true },
      },
      category: true,
      claim: {
        select: { id: true, status: true, claimantName: true },
      },
    },
  });
  return result;
};

// ── Auto-flag: found items unclaimed for 30+ days ─────────────────────────────
const getStalFoundItems = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.foundItem.findMany({
    where: {
      isDeleted: false,
      isArchived: false,
      isClaimed: false,
      createdAt: { lte: thirtyDaysAgo },
    },
    include: { category: true },
  });
  return result;
};

export const foundItemService = {
  createFoundItem,
  getFoundItem,
  getSingleFoundItem,
  getMyFoundItem,
  editMyFoundItem,
  deleteMyFoundItem,
  archiveFoundItem,
  restoreFoundItem,
  getArchivedFoundItems,
  getStalFoundItems,
};