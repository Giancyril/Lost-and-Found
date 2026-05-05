import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../global/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import fs from "fs";
import path from "path";

// ── Keyword blocklist for automated moderation ────────────────────────────────

const keywordsFilePath = path.join(__dirname, "blockedKeywords.json");

const DEFAULT_KEYWORDS = [
  // English
  "spam", "scam", "fake", "fraud",
  "idiot", "stupid", "dumb", "moron",
  "hate", "kill", "threat",
  "porn", "sex", "nude",
  "drug", "weed", "shabu",

  // Tagalog
  "gago", "pakshet", "bwisit", "leche",
  "punyeta", "lintik", "tarantado", "hayop", "tae",
  "walang hiya",

  // Bisaya / Cebuano
  "yawa", "atay", "ataya", "buang", "boang",
  "amaw", "oplok", "bogo", "libat", "litse",
  "minatay", "yawards", "yowo",
];

export let BLOCKED_KEYWORDS: string[] = [];

const loadKeywords = () => {
  try {
    if (fs.existsSync(keywordsFilePath)) {
      const data = fs.readFileSync(keywordsFilePath, "utf8");
      BLOCKED_KEYWORDS = JSON.parse(data);
    } else {
      BLOCKED_KEYWORDS = [...DEFAULT_KEYWORDS];
      saveKeywords();
    }
  } catch (error) {
    console.error("Error loading keywords:", error);
    BLOCKED_KEYWORDS = [...DEFAULT_KEYWORDS];
  }
};

const saveKeywords = () => {
  try {
    fs.writeFileSync(keywordsFilePath, JSON.stringify(BLOCKED_KEYWORDS, null, 2));
  } catch (error) {
    console.error("Error saving keywords:", error);
  }
};

loadKeywords();

export const containsBlockedKeyword = (text: string): string | null => {
  const lower = text.toLowerCase();
  return BLOCKED_KEYWORDS.find(kw => lower.includes(kw)) || null;
};

// ════════════════════════════════════════════════════════════════════════════════
// MODERATION STATS
// ════════════════════════════════════════════════════════════════════════════════

export const getModerationStats = async (req: Request, res: Response) => {
  try {
    const [
      pendingReports,
      totalReports,
      pendingComments,
      rejectedComments,
      pendingAppeals,
      totalWarnings,
      usersWithWarnings,
    ] = await Promise.all([
      prisma.contentReport.count({ where: { status: "PENDING" } }),
      prisma.contentReport.count(),
      prisma.comment.count({ where: { status: "PENDING" } }),
      prisma.comment.count({ where: { status: "REJECTED" } }),
      prisma.moderationAppeal.count({ where: { status: "PENDING" } }),
      prisma.userWarning.count(),
      prisma.userWarning.groupBy({ by: ["userId"], _count: true }).then(r => r.length),
    ]);

    sendResponse(res, {
      statusCode: StatusCodes.OK, success: true,
      message: "Moderation stats retrieved",
      data: { pendingReports, totalReports, pendingComments, rejectedComments, pendingAppeals, totalWarnings, usersWithWarnings },
    });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// REPORTED ITEMS REVIEW
// ════════════════════════════════════════════════════════════════════════════════

export const getReports = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const reports = await prisma.contentReport.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Attach comment details
    const enriched = await Promise.all(reports.map(async (r: any) => {
      const comment = await prisma.comment.findUnique({
        where: { id: r.commentId },
        include: { user: { select: { id: true, username: true, email: true } } },
      });
      return { ...r, comment };
    }));

    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Reports retrieved", data: enriched });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const submitReport = async (req: Request, res: Response) => {
  try {
    const { commentId, reason = "OTHER", details = "", reportedBy = "Anonymous" } = req.body;
    if (!commentId) {
      return sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: "commentId is required", data: null });
    }
    const report = await prisma.contentReport.create({
      data: { commentId, reason, details, reportedBy },
    });
    sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Report submitted", data: report });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const resolveReport = async (req: Request, res: Response) => {
  try {
    const { action, commentAction } = req.body;
    // action: "REVIEWED" | "DISMISSED"
    // commentAction: "REJECT" | "APPROVE" | "NONE"
    const adminName = (req as any).user?.username || "Admin";

    const report = await prisma.contentReport.update({
      where: { id: req.params.id },
      data: { status: action, resolvedBy: adminName, resolvedAt: new Date() },
    });

    // Optionally act on the comment itself
    if (commentAction === "REJECT") {
      await prisma.comment.update({
        where: { id: report.commentId },
        data: { status: "REJECTED", rejectionReason: "Reported by user and reviewed by admin" },
      });
    } else if (commentAction === "APPROVE") {
      await prisma.comment.update({
        where: { id: report.commentId },
        data: { status: "APPROVED" },
      });
    }

    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Report resolved", data: report });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    await prisma.contentReport.delete({ where: { id: req.params.id } });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Report deleted", data: null });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// PENDING COMMENTS (admin moderation queue)
// ════════════════════════════════════════════════════════════════════════════════

export const getPendingComments = async (req: Request, res: Response) => {
  try {
    const { status = "PENDING" } = req.query;
    const comments = await prisma.comment.findMany({
      where: { status: status as any },
      include: { user: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Comments retrieved", data: comments });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const moderateComment = async (req: Request, res: Response) => {
  try {
    const { action, rejectionReason = "" } = req.body;
    // action: "APPROVED" | "REJECTED"
    const comment = await prisma.comment.update({
      where: { id: req.params.id },
      data: {
        status: action,
        ...(action === "REJECTED" ? { rejectionReason } : {}),
      },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: `Comment ${action.toLowerCase()}`, data: comment });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// USER BEHAVIOR TRACKING
// ════════════════════════════════════════════════════════════════════════════════

export const getUserBehavior = async (req: Request, res: Response) => {
  try {
    // Users with the most reports / warnings
    const [topReportedUsers, recentWarnings, allWarnings] = await Promise.all([
      // Comments that have been reported, grouped by user
      prisma.comment.findMany({
        where: { status: "REJECTED" },
        include: { user: { select: { id: true, username: true, email: true, activated: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.userWarning.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { id: true, username: true, email: true } } },
      }),
      prisma.userWarning.findMany({
        include: { user: { select: { id: true, username: true, email: true, activated: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Aggregate warning counts per user
    const warningsByUser: Record<string, { user: any; count: number; highCount: number; warnings: any[] }> = {};
    allWarnings.forEach((w: any) => {
      const uid = w.userId;
      if (!warningsByUser[uid]) warningsByUser[uid] = { user: w.user, count: 0, highCount: 0, warnings: [] };
      warningsByUser[uid].count++;
      if (w.severity === "HIGH") warningsByUser[uid].highCount++;
      warningsByUser[uid].warnings.push(w);
    });

    const userBehaviorList = Object.values(warningsByUser)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    sendResponse(res, {
      statusCode: StatusCodes.OK, success: true,
      message: "User behavior data retrieved",
      data: { topReportedUsers, recentWarnings, userBehaviorList },
    });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const issueWarning = async (req: Request, res: Response) => {
  try {
    const { userId, reason, severity = "LOW", note = "" } = req.body;
    if (!userId || !reason) {
      return sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: "userId and reason are required", data: null });
    }
    const adminName = (req as any).user?.username || "Admin";
    const warning = await prisma.userWarning.create({
      data: { userId, reason, severity, issuedBy: adminName, note },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    // Auto-block if 3+ HIGH severity warnings
    const highWarnings = await prisma.userWarning.count({ where: { userId, severity: "HIGH" } });
    if (highWarnings >= 3) {
      await prisma.user.update({ where: { id: userId }, data: { activated: false } });
    }

    sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Warning issued", data: { warning, autoBlocked: highWarnings >= 3 } });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const deleteWarning = async (req: Request, res: Response) => {
  try {
    await prisma.userWarning.delete({ where: { id: req.params.id } });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Warning deleted", data: null });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// AUTOMATED MODERATION — keyword management
// ════════════════════════════════════════════════════════════════════════════════

export const getKeywords = async (_req: Request, res: Response) => {
  sendResponse(_req.res || res, {
    statusCode: StatusCodes.OK, success: true,
    message: "Keywords retrieved",
    data: { keywords: BLOCKED_KEYWORDS, count: BLOCKED_KEYWORDS.length },
  });
};

export const addKeyword = async (req: Request, res: Response) => {
  try {
    const { keyword } = req.body;
    if (!keyword || typeof keyword !== "string") {
      return sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: "Valid keyword is required", data: null });
    }
    const kw = keyword.toLowerCase().trim();
    if (BLOCKED_KEYWORDS.includes(kw)) {
      return sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: "Keyword already exists", data: null });
    }
    BLOCKED_KEYWORDS.push(kw);
    saveKeywords();
    sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Keyword added", data: { keyword: kw } });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const removeKeyword = async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    if (!keyword) {
      return sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: "Keyword is required", data: null });
    }
    const kw = keyword.toLowerCase().trim();
    if (!BLOCKED_KEYWORDS.includes(kw)) {
      return sendResponse(res, { statusCode: StatusCodes.NOT_FOUND, success: false, message: "Keyword not found", data: null });
    }
    BLOCKED_KEYWORDS = BLOCKED_KEYWORDS.filter(k => k !== kw);
    saveKeywords();
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Keyword removed", data: { keyword: kw } });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const testContent = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: "text is required", data: null });
    }
    const hit = containsBlockedKeyword(text);
    sendResponse(res, {
      statusCode: StatusCodes.OK, success: true,
      message: hit ? `Blocked keyword found: "${hit}"` : "Content is clean",
      data: { clean: !hit, flaggedKeyword: hit || null, text },
    });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// APPEAL PROCESS
// ════════════════════════════════════════════════════════════════════════════════

export const getAppeals = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const appeals = await prisma.moderationAppeal.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, username: true, email: true } } },
      take: 100,
    });

    // Attach comment details
    const enriched = await Promise.all(appeals.map(async (a: any) => {
      const comment = await prisma.comment.findUnique({ where: { id: a.commentId } });
      return { ...a, comment };
    }));

    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Appeals retrieved", data: enriched });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const submitAppeal = async (req: Request, res: Response) => {
  try {
    const { commentId, reason } = req.body;
    const userId = (req as any).user?.id || null;
    if (!commentId || !reason) {
      return sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: "commentId and reason are required", data: null });
    }
    const appeal = await prisma.moderationAppeal.create({
      data: { commentId, userId, reason },
    });
    sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Appeal submitted", data: appeal });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const resolveAppeal = async (req: Request, res: Response) => {
  try {
    const { action, adminNote = "" } = req.body;
    // action: "APPROVED" | "DENIED"
    const adminName = (req as any).user?.username || "Admin";

    const appeal = await prisma.moderationAppeal.update({
      where: { id: req.params.id },
      data: { status: action, adminNote, resolvedBy: adminName, resolvedAt: new Date() },
    });

    // If approved, restore the comment
    if (action === "APPROVED") {
      await prisma.comment.update({
        where: { id: appeal.commentId },
        data: { status: "APPROVED", rejectionReason: null },
      });
    }

    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: `Appeal ${action.toLowerCase()}`, data: appeal });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};