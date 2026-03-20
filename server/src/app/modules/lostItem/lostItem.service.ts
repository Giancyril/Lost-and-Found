import { LostItem } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../../config/prisma";

const toggleFoundStatus = async (id: string) => {
  const currentItem = await prisma.lostItem.findUnique({
    where: { id },
    select: { isFound: true },
  });

  if (!currentItem) throw new Error("Item not found");

  const result = await prisma.lostItem.update({
    where: { id },
    data: { isFound: !currentItem.isFound },
    include: {
      user:     { select: { id: true, username: true, createdAt: true, updatedAt: true } },
      category: true,
    },
  });
  return result;
};

const createLostItem = async (
  userId: string | undefined,
  item: LostItem & { reporterName?: string; schoolEmail?: string }
) => {
  const createData: any = {
    lostItemName: item.lostItemName,
    description:  item.description,
    categoryId:   item.categoryId,
    img:          item.img,
    location:     item.location,
    date:         item.date,
    reporterName: item.reporterName || "",
    schoolEmail:  item.schoolEmail  || "",
  };
  if (userId) createData.userId = userId;

  const result = await prisma.lostItem.create({
    data: createData,
    include: {
      user:     { select: { id: true, username: true, createdAt: true, updatedAt: true } },
      category: true,
    },
  });
  return result;
};

// Shared select for list queries — excludes img (base64) to reduce egress
const lostItemListSelect = {
  id:           true,
  lostItemName: true,
  description:  true,
  location:     true,
  date:         true,
  createdAt:    true,
  updatedAt:    true,
  isFound:      true,
  isDeleted:    true,
  reporterName: true,
  schoolEmail:  true,
  userId:       true,
  categoryId:   true,
  // img intentionally excluded from list — fetch via getSingleLostItem
  user: {
    select: { id: true, username: true, email: true, role: true },
  },
  category: true,
} as const;

const getLostItem = async (query: any = {}) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "lostItemName",
    sortOrder = "asc",
  } = query;

  const whereConditions: any = {
    isDeleted: false,
    isFound:   false,
  };

  if (searchTerm) {
    whereConditions.OR = [
      { lostItemName: { contains: searchTerm, mode: "insensitive" } },
      { location:     { contains: searchTerm, mode: "insensitive" } },
      { description:  { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // ── EGRESS FIX: use select instead of include to exclude img ──────────────
  const result = await prisma.lostItem.findMany({
    where:   whereConditions,
    orderBy: { [sortBy]: sortOrder },
    skip:    (Number(page) - 1) * Number(limit),
    take:    Number(limit),
    select:  lostItemListSelect,
  });

  return result;
};

const getAllLostItems = async (query: any = {}) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "lostItemName",
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

  // ── EGRESS FIX: use select instead of include to exclude img ──────────────
  const result = await prisma.lostItem.findMany({
    where:   whereConditions,
    orderBy: { [sortBy]: sortOrder },
    skip:    (Number(page) - 1) * Number(limit),
    take:    Number(limit),
    select:  lostItemListSelect,
  });

  return result;
};

const getSingleLostItem = async (singleId: string) => {
  // Single item — include img here since it's just one record
  const result = await prisma.lostItem.findFirst({
    where: { id: singleId, isDeleted: false },
    include: { user: true, category: true },
  });
  return result;
};

const getMyLostItem = async (user: JwtPayload) => {
  // ── EGRESS FIX: exclude img from list ────────────────────────────────────
  const result = await prisma.lostItem.findMany({
    where:  { userId: user.id, isDeleted: false },
    select: lostItemListSelect,
  });
  return result;
};

const editMyLostItem = async (data: any, user?: JwtPayload) => {
  const updateData: any = {};
  if (data?.lostItemName)               updateData.lostItemName = data.lostItemName;
  if (data?.location)                   updateData.location     = data.location;
  if (data?.date)                       updateData.date         = data.date;
  if (data?.description)                updateData.description  = data.description;
  if (data?.categoryId)                 updateData.categoryId   = data.categoryId;
  if (data?.img)                        updateData.img          = data.img;
  if (data?.reporterName !== undefined) updateData.reporterName = data.reporterName;
  if (data?.schoolEmail  !== undefined) updateData.schoolEmail  = data.schoolEmail;

  const whereClause: any = { id: data.id };
  if (user) whereClause.userId = user.id;

  const result = await prisma.lostItem.update({
    where: whereClause,
    data:  updateData,
    include: {
      user:     { select: { id: true, username: true, createdAt: true, updatedAt: true } },
      category: true,
    },
  });
  return result;
};

const deleteMyLostItem = async (id: string) => {
  const result = await prisma.lostItem.update({
    where: { id },
    data:  { isDeleted: true, deletedAt: new Date() },
    include: {
      user:     { select: { id: true, username: true, createdAt: true, updatedAt: true } },
      category: true,
    },
  });
  return result;
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