import { Claim, status } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../../config/prisma";

const createClaim = async (
  item: Claim & { claimantName?: string; contactNumber?: string; schoolEmail?: string },
  user?: JwtPayload
) => {
  const result = await prisma.claim.create({
    data: {
      foundItemId:            item.foundItemId,
      distinguishingFeatures: item.distinguishingFeatures,
      lostDate:               item.lostDate,
      claimantName:           item.claimantName  || "",
      contactNumber:          item.contactNumber || "",   
      schoolEmail:            item.schoolEmail   || "",   
      ...(user?.id ? { userId: user.id } : {}),
    },
  });
  return result;
};

const getClaim = async () => {
  const result = await prisma.claim.findMany({
    where: {
      isDeleted: false,
      foundItem: { isDeleted: false },
    },
    include: {
      foundItem: {
        include: {
          category: true,
          user: {
            select: { id: true, username: true, email: true, createdAt: true, updatedAt: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return result;
};

const getMyClaim = async (user: JwtPayload) => {
  const result = await prisma.claim.findMany({
    where: {
      userId: user.id,
      foundItem: { isDeleted: false },
    },
    include: {
      foundItem: {
        include: {
          category: true,
          user: {
            select: { id: true, username: true, email: true, createdAt: true, updatedAt: true },
          },
        },
      },
      user: {
        select: { id: true, username: true, email: true },
      },
    },
  });
  return result;
};

const updateClaimStatus = async (
  claimId: string,
  data: Partial<Claim>,
  performer?: { id?: string; name?: string }
) => {
  const existing = await prisma.claim.findUnique({ where: { id: claimId } });
  const fromStatus = existing?.status ?? "PENDING";

  const result = await prisma.claim.update({
    where: { id: claimId },
    data,
  });

  if (data.status && data.status !== fromStatus) {
    await prisma.claimAuditLog.create({
      data: {
        claimId,
        action:      data.status,
        fromStatus:  fromStatus,
        toStatus:    data.status,
        performedBy: performer?.name || "Admin",
        ...(performer?.id ? { performedById: performer.id } : {}),
        note: (data as any).note || "",
      },
    });
  }

  if (data.status === "APPROVED") {
    await prisma.foundItem.update({
      where: { id: result.foundItemId },
      data: { isClaimed: true },
    });
  }

  if (data.status === "REJECTED" || data.status === "PENDING") {
    await prisma.foundItem.update({
      where: { id: result.foundItemId },
      data: { isClaimed: false },
    });
  }

  return result;
};

const getAuditLogs = async () => {
  const result = await prisma.claimAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      claim: {
        include: {
          foundItem: {
            select: { foundItemName: true, img: true },
          },
        },
      },
      performedByUser: {
        select: { username: true, email: true },
      },
    },
  });
  return result;
};

export const claimsService = {
  createClaim,
  getClaim,
  updateClaimStatus,
  getMyClaim,
  getAuditLogs,
};