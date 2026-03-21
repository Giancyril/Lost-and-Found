import { LostItem } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../../config/prisma";
import { uploadBase64ToStorage } from "../../utils/storage";

const toggleFoundStatus = async (id: string) => {
  const currentItem = await prisma.lostItem.findUnique({
    where:  { id },
    select: { isFound: true },
  });
  if (!currentItem) throw new Error("Item not found");

  return prisma.lostItem.update({
    where: { id },
    data:  { isFound: !currentItem.isFound },
    include: {
      user:     { select: { id: true, username: true, createdAt: true, updatedAt: true } },
      category: true,
    },
  });
};

const createLostItem = async (
  userId: string | undefined,
  item: LostItem & { reporterName?: string; schoolEmail?: string }
) => {
  // ── STORAGE FIX: convert base64 img to Storage URL before saving ──────────
  let imgUrl = item.img ?? "";
  if (imgUrl.startsWith("data:")) {
    imgUrl = await uploadBase64ToStorage(imgUrl, "lost", `lost-${Date.now()}`);
  }

  const createData: any = {
    lostItemName: item.lostItemName,
    description:  item.description,
    categoryId:   item.categoryId,
    img:          imgUrl,
    location:     item.location,
    date:         item.date,
    reporterName: item.reporterName || "",
    schoolEmail:  item.schoolEmail  || "",
  };
  if (userId) createData.userId = userId;

  return prisma.lostItem.create({
    data: createData,
    include: {
      user:     { select: { id: true, username: true, createdAt: true, updatedAt: true } },
      category: true,
    },
  });
};

const getLostItem = async (query: any = {}) => {
  const {
    searchTerm,
    page      = 1,
    limit     = 10,
    sortBy    = "lostItemName",
    sortOrder = "asc",
  } = query;

  const whereConditions: any = { isDeleted: false, isFound: false };

  if (searchTerm) {
    whereConditions.OR = [
      { lostItemName: { contains: searchTerm, mode: "insensitive" } },
      { location:     { contains: searchTerm, mode: "insensitive" } },
      { description:  { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // img is now a short Storage URL — safe to include in list queries
  return prisma.lostItem.findMany({
    where:   whereConditions,
    orderBy: { [sortBy]: sortOrder },
    skip:    (Number(page) - 1) * Number(limit),
    take:    Number(limit),
    include: {
      user:     { select: { id: true, username: true, email: true, role: true } },
      category: true,
    },
  });
};

const getAllLostItems = async (query: any = {}) => {
  const {
    searchTerm,
    page      = 1,
    limit     = 10,
    sortBy    = "lostItemName",
    sortOrder = "asc",
  } = query;

  const whereConditions: any = { isDeleted: false };

  if (searchTerm) {
    whereConditions.OR = [
      { lostItemName: { contains: searchTerm, mode: "insensitive" } },
      { location:     { contains: searchTerm, mode: "insensitive" } },
      { description:  { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  return prisma.lostItem.findMany({
    where:   whereConditions,
    orderBy: { [sortBy]: sortOrder },
    skip:    (Number(page) - 1) * Number(limit),
    take:    Number(limit),
    include: {
      user:     { select: { id: true, username: true, email: true, role: true } },
      category: true,
    },
  });
};

const getSingleLostItem = async (singleId: string) => {
  return prisma.lostItem.findFirst({
    where:   { id: singleId, isDeleted: false },
    include: { user: true, category: true },
  });
};

const getMyLostItem = async (user: JwtPayload) => {
  return prisma.lostItem.findMany({
    where:   { userId: user.id, isDeleted: false },
    include: { user: true, category: true },
  });
};

const editMyLostItem = async (data: any, user?: JwtPayload) => {
  const updateData: any = {};
  if (data?.lostItemName)               updateData.lostItemName = data.lostItemName;
  if (data?.location)                   updateData.location     = data.location;
  if (data?.date)                       updateData.date         = data.date;
  if (data?.description)                updateData.description  = data.description;
  if (data?.categoryId)                 updateData.categoryId   = data.categoryId;
  if (data?.reporterName !== undefined) updateData.reporterName = data.reporterName;
  if (data?.schoolEmail  !== undefined) updateData.schoolEmail  = data.schoolEmail;
  // Upload new image to Storage if base64 provided
  if (data?.img?.startsWith("data:")) {
    updateData.img = await uploadBase64ToStorage(data.img, "lost", data.id);
  } else if (data?.img) {
    updateData.img = data.img;
  }

  const whereClause: any = { id: data.id };
  if (user) whereClause.userId = user.id;

  return prisma.lostItem.update({
    where: whereClause,
    data:  updateData,
    include: {
      user:     { select: { id: true, username: true, createdAt: true, updatedAt: true } },
      category: true,
    },
  });
};

const deleteMyLostItem = async (id: string) => {
  return prisma.lostItem.update({
    where: { id },
    data:  { isDeleted: true, deletedAt: new Date() },
    include: {
      user:     { select: { id: true, username: true, createdAt: true, updatedAt: true } },
      category: true,
    },
  });
};

export const lostTItemServices = {
  toggleFoundStatus,
  createLostItem,
  getLostItem,
  getAllLostItems,
  getSingleLostItem,
  getMyLostItem,
  editMyLostItem,
  deleteMyLostItem,
};