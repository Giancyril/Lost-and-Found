import prisma from "../../config/prisma";
import { sendEmail } from "../../utils/mailer";
import { weeklyDeletionReportTemplate } from "../../utils/emailTemplates";
import { logSystemAudit } from "../../utils/auditLog";

// Grace period: 90 days after soft-delete before permanent deletion
const GRACE_PERIOD_DAYS = 90;
const WARNING_DAYS_BEFORE_PURGE = 7; // Send report 7 days before purge

interface PendingDeletionItem {
  id: string;
  type: "FoundItem" | "LostItem" | "Claim";
  name: string;
  deletedAt: Date;
  permanentDeletionDate: Date;
  daysRemaining: number;
}

/**
 * Get all items that are soft-deleted and will be permanently deleted within the next 7 days
 */
const getItemsPendingDeletion = async (): Promise<PendingDeletionItem[]> => {
  const now = new Date();
  const gracePeriodDate = new Date();
  gracePeriodDate.setDate(gracePeriodDate.getDate() - GRACE_PERIOD_DAYS);

  const warningThresholdDate = new Date();
  warningThresholdDate.setDate(warningThresholdDate.getDate() - (GRACE_PERIOD_DAYS - WARNING_DAYS_BEFORE_PURGE));

  const pendingItems: PendingDeletionItem[] = [];

  // Query soft-deleted Found Items
  const foundItems = await prisma.foundItem.findMany({
    where: {
      isDeleted: true,
      deletedAt: {
        lte: warningThresholdDate,
        gte: gracePeriodDate,
      },
    },
    select: {
      id: true,
      foundItemName: true,
      deletedAt: true,
      location: true,
      category: { select: { name: true } },
    },
  });

  foundItems.forEach((item) => {
    if (item.deletedAt) {
      const permanentDeletionDate = new Date(item.deletedAt);
      permanentDeletionDate.setDate(permanentDeletionDate.getDate() + GRACE_PERIOD_DAYS);
      const daysRemaining = Math.ceil((permanentDeletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      pendingItems.push({
        id: item.id,
        type: "FoundItem",
        name: `${item.foundItemName} (${item.category.name}) - ${item.location}`,
        deletedAt: item.deletedAt,
        permanentDeletionDate,
        daysRemaining,
      });
    }
  });

  // Query soft-deleted Lost Items
  const lostItems = await prisma.lostItem.findMany({
    where: {
      isDeleted: true,
      deletedAt: {
        lte: warningThresholdDate,
        gte: gracePeriodDate,
      },
    },
    select: {
      id: true,
      lostItemName: true,
      deletedAt: true,
      location: true,
      category: { select: { name: true } },
    },
  });

  lostItems.forEach((item) => {
    if (item.deletedAt) {
      const permanentDeletionDate = new Date(item.deletedAt);
      permanentDeletionDate.setDate(permanentDeletionDate.getDate() + GRACE_PERIOD_DAYS);
      const daysRemaining = Math.ceil((permanentDeletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      pendingItems.push({
        id: item.id,
        type: "LostItem",
        name: `${item.lostItemName} (${item.category.name}) - ${item.location}`,
        deletedAt: item.deletedAt,
        permanentDeletionDate,
        daysRemaining,
      });
    }
  });

  // Query soft-deleted Claims
  const claims = await prisma.claim.findMany({
    where: {
      isDeleted: true,
      deletedAt: {
        lte: warningThresholdDate,
        gte: gracePeriodDate,
      },
    },
    select: {
      id: true,
      claimantName: true,
      deletedAt: true,
      foundItem: { select: { foundItemName: true } },
    },
  });

  claims.forEach((claim) => {
    if (claim.deletedAt) {
      const permanentDeletionDate = new Date(claim.deletedAt);
      permanentDeletionDate.setDate(permanentDeletionDate.getDate() + GRACE_PERIOD_DAYS);
      const daysRemaining = Math.ceil((permanentDeletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      pendingItems.push({
        id: claim.id,
        type: "Claim",
        name: `Claim by ${claim.claimantName} for ${claim.foundItem.foundItemName}`,
        deletedAt: claim.deletedAt,
        permanentDeletionDate,
        daysRemaining,
      });
    }
  });

  // Sort by days remaining (most urgent first)
  return pendingItems.sort((a, b) => a.daysRemaining - b.daysRemaining);
};

/**
 * Permanently delete items that have exceeded the grace period
 */
const purgeExpiredItems = async (performer?: { id: string; name: string }) => {
  const gracePeriodDate = new Date();
  gracePeriodDate.setDate(gracePeriodDate.getDate() - GRACE_PERIOD_DAYS);

  const results = {
    foundItems: 0,
    lostItems: 0,
    claims: 0,
  };

  // Permanently delete Found Items
  const deletedFoundItems = await prisma.foundItem.deleteMany({
    where: {
      isDeleted: true,
      deletedAt: {
        lte: gracePeriodDate,
      },
    },
  });
  results.foundItems = deletedFoundItems.count;

  // Permanently delete Lost Items
  const deletedLostItems = await prisma.lostItem.deleteMany({
    where: {
      isDeleted: true,
      deletedAt: {
        lte: gracePeriodDate,
      },
    },
  });
  results.lostItems = deletedLostItems.count;

  // Permanently delete Claims
  const deletedClaims = await prisma.claim.deleteMany({
    where: {
      isDeleted: true,
      deletedAt: {
        lte: gracePeriodDate,
      },
    },
  });
  results.claims = deletedClaims.count;

  console.log(`[RetentionPolicy] Purged ${results.foundItems} found items, ${results.lostItems} lost items, ${results.claims} claims`);

  // Write system audit log
  await logSystemAudit({
    entityType: "RETENTION",
    action: performer ? "MANUAL_PURGE" : "AUTO_PURGE",
    newData: results,
    performedBy: performer?.name || "System (Auto Purge)",
    performedById: performer?.id,
  });

  return results;
};

/**
 * Restore a soft-deleted item (admin action)
 */
const restoreItem = async (
  itemId: string,
  itemType: "FoundItem" | "LostItem" | "Claim",
  performer?: { id: string; name: string }
) => {
  let restoredItem;
  switch (itemType) {
    case "FoundItem":
      restoredItem = await prisma.foundItem.update({
        where: { id: itemId },
        data: { isDeleted: false, deletedAt: null },
      });
      break;
    case "LostItem":
      restoredItem = await prisma.lostItem.update({
        where: { id: itemId },
        data: { isDeleted: false, deletedAt: null },
      });
      break;
    case "Claim":
      restoredItem = await prisma.claim.update({
        where: { id: itemId },
        data: { isDeleted: false, deletedAt: null },
      });
      break;
  }

  // Write system audit log
  await logSystemAudit({
    entityType: "RETENTION",
    entityId: itemId,
    action: `RESTORE_${itemType.toUpperCase()}`,
    newData: { itemId, itemType },
    performedBy: performer?.name || "Admin",
    performedById: performer?.id,
  });

  return restoredItem;
};

/**
 * Generate CSV report of items pending deletion
 */
const generateCSVReport = (items: PendingDeletionItem[]): string => {
  const header = "Item ID,Type,Name,Deleted At,Permanent Deletion Date,Days Remaining\n";
  const rows = items.map((item) => {
    return `"${item.id}","${item.type}","${item.name}","${item.deletedAt.toISOString()}","${item.permanentDeletionDate.toISOString()}",${item.daysRemaining}`;
  });
  return header + rows.join("\n");
};

/**
 * Send weekly deletion report to admins
 */
const sendWeeklyDeletionReport = async (performer?: { id: string; name: string }) => {
  const pendingItems = await getItemsPendingDeletion();

  if (pendingItems.length === 0) {
    console.log("[RetentionPolicy] No items pending deletion this week.");
    // Write system audit log
    await logSystemAudit({
      entityType: "RETENTION",
      action: performer ? "MANUAL_REPORT_SEND" : "AUTO_REPORT_SEND",
      newData: {
        recipientCount: 0,
        pendingItemsCount: 0,
        message: "No items pending deletion this week",
      },
      performedBy: performer?.name || "System (Auto Scheduler)",
      performedById: performer?.id,
    });
    return;
  }

  // Get all admin emails
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", activated: true, isDeleted: false },
    select: { email: true, username: true },
  });

  if (admins.length === 0) {
    console.warn("[RetentionPolicy] No active admins found to send report.");
    return;
  }

  // Use new styled email template
  const template = weeklyDeletionReportTemplate({ pendingItems });

  const fromName = process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";
  const fromEmail = process.env.SMTP_FROM_EMAIL || "mijaresgiancyril@gmail.com";

  // Send email to all admins
  for (const admin of admins) {
    try {
      await sendEmail({
        fromName,
        fromEmail,
        toEmail: admin.email,
        subject: template.subject,
        html: template.html,
      });
      console.log(`[RetentionPolicy] Report sent to ${admin.email}`);
    } catch (error) {
      console.error(`[RetentionPolicy] Failed to send report to ${admin.email}:`, error);
    }
  }

  // Write system audit log
  await logSystemAudit({
    entityType: "RETENTION",
    action: performer ? "MANUAL_REPORT_SEND" : "AUTO_REPORT_SEND",
    newData: {
      recipientCount: admins.length,
      pendingItemsCount: pendingItems.length,
    },
    performedBy: performer?.name || "System (Auto Scheduler)",
    performedById: performer?.id,
  });
};

export const retentionService = {
  getItemsPendingDeletion,
  purgeExpiredItems,
  restoreItem,
  generateCSVReport,
  sendWeeklyDeletionReport,
  GRACE_PERIOD_DAYS,
  WARNING_DAYS_BEFORE_PURGE,
};
