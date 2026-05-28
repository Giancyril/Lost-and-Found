import { Claim, status } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
 import prisma from "../../config/prisma";
import { pushService } from "../push/push.service";
import { aiRecognitionService } from "../ai/ai.service";
import { sendEmail } from "../../utils/mailer";
import { claimSubmittedTemplate } from "../../utils/emailTemplates";

const createClaim = async (
  item: Claim & { claimantName?: string; contactNumber?: string; schoolEmail?: string },
  user?: JwtPayload
) => {
  // 0. Duplicate Claim Prevention — check if user already has PENDING or APPROVED claim for this item
  if (user?.id && item.foundItemId) {
    const existingClaim = await prisma.claim.findFirst({
      where: {
        userId: user.id,
        foundItemId: item.foundItemId,
        status: { in: ["PENDING", "APPROVED"] },
        isDeleted: false,
      },
    });

    if (existingClaim) {
      throw new Error(
        `You already have a ${existingClaim.status.toLowerCase()} claim for this item. Please wait for the admin to review your existing claim.`
      );
    }
  }

  // Also check by email for guest claims (when userId is not available)
  if (!user?.id && item.schoolEmail && item.foundItemId) {
    const existingClaim = await prisma.claim.findFirst({
      where: {
        schoolEmail: item.schoolEmail,
        foundItemId: item.foundItemId,
        status: { in: ["PENDING", "APPROVED"] },
        isDeleted: false,
      },
    });

    if (existingClaim) {
      throw new Error(
        `A ${existingClaim.status.toLowerCase()} claim for this item already exists with this email. Please wait for the admin to review the existing claim.`
      );
    }
  }

  let isHighRisk = false;
  let fraudScore = 0;
  let fraudReason = "";

  // 1. Serial Claimant Check
  if (user?.id) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentClaimsCount = await prisma.claim.count({
      where: {
        userId: user.id,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    if (recentClaimsCount >= 3) {
      isHighRisk = true;
      fraudReason = `[SERIAL CLAIMANT WARNING] User has submitted ${recentClaimsCount} claims in the last 30 days. `;
    }
  }

  // 2. AI Fraud Detection
  if (item.distinguishingFeatures && item.foundItemId) {
    const foundItem = await prisma.foundItem.findUnique({ where: { id: item.foundItemId } });
    if (foundItem) {
      const aiResult = await aiRecognitionService.analyzeClaimFraud(
        item.distinguishingFeatures,
        foundItem.description,
        foundItem.foundItemName
      );
      
      fraudScore = aiResult.fraudScore;
      if (aiResult.isHighRisk) isHighRisk = true;
      if (aiResult.fraudReason) {
        fraudReason += (fraudReason ? " | " : "") + `[AI Assessment] ${aiResult.fraudReason}`;
      }
    }
  }

  const result = await prisma.claim.create({
    data: {
      foundItemId:            item.foundItemId,
      distinguishingFeatures: item.distinguishingFeatures,
      lostDate:               item.lostDate,
      claimantName:           item.claimantName  || "",
      contactNumber:          item.contactNumber || "",   
      schoolEmail:            item.schoolEmail   || "",   
      ...(user?.id ? { userId: user.id } : {}),
      fraudScore,
      fraudReason,
      isHighRisk,
    },
  });

  if (result.schoolEmail) {
    const template = claimSubmittedTemplate({
      claimantName: result.claimantName,
      trackingId: result.id,
    });
    sendEmail({
      fromName: process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found",
      fromEmail: process.env.SMTP_FROM_EMAIL || "noreply@nbsc.edu.ph",
      toEmail: result.schoolEmail,
      subject: template.subject,
      html: template.html,
    }).catch((e) => console.error("Failed to send claim submitted email:", e));
  }

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

const getMyClaim = async (user: JwtPayload | undefined) => {
  if (!user || !user.id) return [];

  const whereConditions: any = { foundItem: { isDeleted: false } };
  
  // Safely match by userId, OR by schoolEmail if the user's JWT includes an email.
  // This allows items claimed while logged out (as guests) to be seen by the user.
  if (user.email) {
    whereConditions.OR = [
      { userId: user.id },
      { schoolEmail: user.email }
    ];
  } else {
    whereConditions.userId = user.id;
  }

  const result = await prisma.claim.findMany({
    where: whereConditions,
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
      auditLogs: {
        orderBy: { createdAt: "asc" },
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

    // Also log to the new unified SystemAuditLog for Phase 9
    const { logSystemAudit } = await import("../../utils/auditLog");
    await logSystemAudit({
      entityType: "CLAIM",
      entityId: claimId,
      action: `STATUS_${data.status}`,
      oldData: { status: fromStatus },
      newData: { status: data.status, note: (data as any).note },
      performedBy: performer?.name,
      performedById: performer?.id,
    });

    // Trigger Push Notification to claimant
    if (result.userId) {
      await pushService.sendNotificationToUser(result.userId, {
        title: `Claim ${data.status}`,
        body: `Your claim for "${(existing as any)?.foundItemName || 'an item'}" has been ${data.status.toLowerCase()}.`,
        data: {
          type: "CLAIM_UPDATE",
          claimId: result.id,
          status: data.status,
        },
      });
    }
  }

  if (data.status === "APPROVED") {
  await prisma.foundItem.update({
    where: { id: result.foundItemId },
    data: { isClaimed: true },
  });

  // Award points to the student who made the claim
  if (result.userId) {
    const { pointsService } = await import("../points/points.service");
    await pointsService
      .award(result.userId, "CLAIM_APPROVED", result.id)
      .catch((err) =>
        console.error("[Points] Failed to award points for approved claim:", err)
      );
  }
}

  if (data.status === "REJECTED" || data.status === "PENDING") {
    await prisma.foundItem.update({
      where: { id: result.foundItemId },
      data: { isClaimed: false },
    });
  }

  return result;
};

const deleteClaim = async (claimId: string) => {
  const existing = await prisma.claim.findUnique({ 
    where: { id: claimId },
    include: { foundItem: true }
  });

  if (!existing) {
    throw new Error("Claim not found");
  }

  // If claim is approved, we need to handle the foreign key constraint
  if (existing.status === "APPROVED") {
    // First, update the found item to unclaim it
    await prisma.foundItem.update({
      where: { id: existing.foundItemId },
      data: { isClaimed: false },
    });
  }

  // Soft delete the claim
  const result = await prisma.claim.update({
    where: { id: claimId },
    data: { isDeleted: true },
  });

  // Create audit log for the deletion
  await prisma.claimAuditLog.create({
    data: {
      claimId,
      action: "DELETED",
      fromStatus: existing.status,
      toStatus: "DELETED",
      performedBy: "Admin",
      note: "Claim deleted by admin",
    },
  });

  return result;
};

const getAuditLogs = async () => {
  const result = await prisma.claimAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
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
  return result.filter((log: any) => log.claim !== null); // cast to any
};

const trackClaim = async (claimId: string, email: string) => {
  const claim = await prisma.claim.findFirst({
    where: {
      id: claimId,
      schoolEmail: email,
      isDeleted: false,
    },
    include: {
      foundItem: {
        select: { foundItemName: true, img: true, location: true, category: true },
      },
    },
  });

  return claim;
};

export const claimsService = {
  createClaim,
  getClaim,
  updateClaimStatus,
  getMyClaim,
  deleteClaim,
  getAuditLogs,
  trackClaim,
};