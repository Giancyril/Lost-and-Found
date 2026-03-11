import { Claim, status } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../../config/prisma";

const createClaim = async (item: Claim & { claimantName?: string; contactNumber?: string }, user?: JwtPayload) => {
  const result = await prisma.claim.create({
    data: {
      foundItemId: item.foundItemId,
      distinguishingFeatures: item.distinguishingFeatures,
      lostDate: item.lostDate,
      claimantName: item.claimantName || "",
      contactNumber: item.contactNumber || "",
      ...(user?.id ? { userId: user.id } : {}), // userId optional — students have no account
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

const updateClaimStatus = async (claimId: string, data: Partial<Claim>) => {
  const result = await prisma.claim.update({
    where: { id: claimId },
    data,
  });

  // When a claim is approved, mark the found item as claimed
  if (data.status === "APPROVED") {
    await prisma.foundItem.update({
      where: { id: result.foundItemId },
      data: { isClaimed: true },
    });
  }

  // When a claim is rejected/pending, revert isClaimed to false
  if (data.status === "REJECTED" || data.status === "PENDING") {
    await prisma.foundItem.update({
      where: { id: result.foundItemId },
      data: { isClaimed: false },
    });
  }

  return result;
};

export const claimsService = {
  createClaim,
  getClaim,
  updateClaimStatus,
  getMyClaim,
};