import { FoundItem, Prisma } from "@prisma/client";
import { TFilter } from "../../global/interface";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../../config/prisma";
import { uploadBase64ToStorage } from "../../utils/storage";
import { matchService } from "../matching/match.service";

const createFoundItem = async (
  data: FoundItem & { lostItemId?: string; reporterName?: string },
  userId?: string
) => {
  // ── STORAGE FIX: convert base64 img to Storage URL before saving ──────────
  let imgUrl = data.img ?? "";
  if (imgUrl.startsWith("data:")) {
    imgUrl = await uploadBase64ToStorage(imgUrl, "found", `found-${Date.now()}`);
  }

  const createData: any = {
    categoryId:    data.categoryId,
    description:   data.description,
    date:          data.date,
    claimProcess:  data.claimProcess || "Visit the SAS office with valid ID to claim this item.",
    img:           imgUrl,
    foundItemName: data.foundItemName,
    location:      data.location,
    reporterName:  data.reporterName || "",
    schoolEmail:   data.schoolEmail || "",
  };
  if (userId) createData.userId = userId;

  const result = await prisma.foundItem.create({
    data: createData,
    include: {
      user:     { select: { id: true, username: true, createdAt: true, updatedAt: true } },
      category: true,
    },
  });

  if (data.lostItemId) {
    await prisma.lostItem.update({
      where: { id: data.lostItemId },
      data:  { isFound: true },
    });
  }

  // Trigger smart matching in background
  matchService.findMatchesForFoundItem(result).catch(err => 
    console.error("[SmartMatch] Error during matching:", err)
  );

  return result;
};

const getFoundItem = async (data: TFilter) => {
  const {
    searchTerm,
    page      = 1,
    limit     = 10,
    sortBy    = "foundItemName",
    sortOrder = "asc",
    foundItemName,
    startDate,
    endDate,
  } = data;

  const whereConditions: Prisma.FoundItemWhereInput = {
    isDeleted:  false,
    isArchived: false,
  };

  if (foundItemName) {
    whereConditions.foundItemName = { contains: foundItemName, mode: "insensitive" };
  }
  if (searchTerm) {
    whereConditions.OR = [
      { foundItemName: { contains: searchTerm, mode: "insensitive" } },
      { location:      { contains: searchTerm, mode: "insensitive" } },
      { description:   { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (startDate || endDate) {
    whereConditions.date = {};
    if (startDate) whereConditions.date.gte = new Date(startDate);
    if (endDate)   whereConditions.date.lte = new Date(endDate);
  }

  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      const result = await prisma.foundItem.findMany({
        where:   whereConditions,
        orderBy: { [sortBy]: sortOrder },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        include: {
          user:     { select: { id: true, username: true, email: true, role: true } },
          category: true,
        },
        select: {
          id: true,
          foundItemName: true,
          description: true,
          location: true,
          date: true,
          isClaimed: true,
          isArchived: true,
          isDeleted: true,
          img: true,
          reporterName: true,
          schoolEmail: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true } },
          user: { select: { id: true, username: true, email: true, role: true } },
        },
      });
      return result;
    } catch (error: any) {
      retryCount++;
      console.error(`getFoundItem attempt ${retryCount} failed:`, error.message);
      
      if (retryCount >= maxRetries) {
        console.error('getFoundItem: Max retries reached, throwing error');
        throw new Error('Database connection failed. Please try again.');
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
};

const getSingleFoundItem = async (id: string) => {
  return prisma.foundItem.findFirst({
    where: { id, isDeleted: false },
    include: {
      user:     { select: { id: true, email: true, username: true, role: true } },
      category: true,
      claim: {
        orderBy: { createdAt: "desc" },
        include: { auditLogs: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
};

const getMyFoundItem = async (user: JwtPayload) => {
  return prisma.foundItem.findMany({
    where:   { userId: user.id, isDeleted: false },
    include: { user: true, category: true },
  });
};

const editMyFoundItem = async (data: any) => {
  const updateData: any = {};
  if (data?.foundItemName)              updateData.foundItemName = data.foundItemName;
  if (data?.location)                   updateData.location      = data.location;
  if (data?.date)                       updateData.date          = data.date;
  if (data?.description)                updateData.description   = data.description;
  if (data?.reporterName !== undefined) updateData.reporterName  = data.reporterName;
  // Upload new image to Storage if base64 provided
  if (data?.img?.startsWith("data:")) {
    updateData.img = await uploadBase64ToStorage(data.img, "found", data.id);
  }

  return prisma.foundItem.update({ where: { id: data.id }, data: updateData });
};

const deleteMyFoundItem = async (id: string) => {
  return prisma.foundItem.update({
    where: { id },
    data:  { isDeleted: true, deletedAt: new Date() },
  });
};

const archiveFoundItem = async (id: string) => {
  return prisma.foundItem.update({
    where: { id },
    data:  { isArchived: true, archivedAt: new Date() },
  });
};

const restoreFoundItem = async (id: string) => {
  return prisma.foundItem.update({
    where: { id },
    data:  { isArchived: false, archivedAt: null },
  });
};

const getArchivedFoundItems = async () => {
  return prisma.foundItem.findMany({
    where:   { isDeleted: false, isArchived: true },
    orderBy: { archivedAt: "desc" },
    include: {
      user:     { select: { id: true, username: true, email: true } },
      category: true,
      claim:    { select: { id: true, status: true, claimantName: true } },
    },
  });
};

const getStaleFoundItems = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return prisma.foundItem.findMany({
    where: {
      isDeleted:  false,
      isArchived: false,
      isClaimed:  false,
      createdAt:  { lte: thirtyDaysAgo },
    },
    include: { category: true },
  });
};

const updateFoundItemImage = async (id: string, imageUrl: string) => {
  return prisma.foundItem.update({
    where: { id },
    data: { img: imageUrl },
  });
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
  getStaleFoundItems,
  updateFoundItemImage,
};