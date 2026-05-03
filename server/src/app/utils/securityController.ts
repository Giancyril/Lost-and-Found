import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../global/response";
import { PrismaClient } from "@prisma/client";
import { userService } from "../modules/user/user.service";

const prisma = new PrismaClient();

// ── Helper: get IP from request ───────────────────────────────────────────────
export const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "unknown";
};

// ── Log a login attempt (called from auth.controller) ────────────────────────
export const logLoginAttempt = async (data: {
  userId?: string;
  username?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
}) => {
  try {
    await prisma.loginLog.create({
      data: {
        userId:    data.userId    || null,
        username:  data.username  || "",
        email:     data.email     || "",
        ipAddress: data.ipAddress || "",
        userAgent: data.userAgent || "",
        success:   data.success,
        reason:    data.reason    || "",
      },
    });
  } catch (err) {
    console.error("[LoginLog] Failed to log attempt:", err);
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// SECURITY MONITOR
// ════════════════════════════════════════════════════════════════════════════════

export const getSecurityStats = async (req: Request, res: Response) => {
  try {
    const now     = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);

    const [
      totalLogins24h,
      failedLogins24h,
      successLogins24h,
      totalLogins7d,
      failedLogins7d,
      blockedUsers,
      deletedUsers,
      totalUsers,
      recentLogs,
    ] = await Promise.all([
      prisma.loginLog.count({ where: { createdAt: { gte: last24h } } }),
      prisma.loginLog.count({ where: { createdAt: { gte: last24h }, success: false } }),
      prisma.loginLog.count({ where: { createdAt: { gte: last24h }, success: true  } }),
      prisma.loginLog.count({ where: { createdAt: { gte: last7d  } } }),
      prisma.loginLog.count({ where: { createdAt: { gte: last7d  }, success: false } }),
      prisma.user.count({ where: { activated: false, isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: true  } }),
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.loginLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    ]);

    // Detect suspicious IPs: 5+ failed logins in 24h from same IP
    const failedByIp = await prisma.loginLog.groupBy({
      by:     ["ipAddress"],
      where:  { success: false, createdAt: { gte: last24h } },
      _count: { id: true },
      having: { id: { _count: { gte: 5 } } },
    });

    // Login trend last 7 days
    const loginTrend: { date: string; success: number; failed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const [s, f] = await Promise.all([
        prisma.loginLog.count({ where: { createdAt: { gte: dayStart, lte: dayEnd }, success: true  } }),
        prisma.loginLog.count({ where: { createdAt: { gte: dayStart, lte: dayEnd }, success: false } }),
      ]);

      loginTrend.push({
        date:    dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        success: s,
        failed:  f,
      });
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Security stats retrieved",
      data: {
        totalLogins24h,
        failedLogins24h,
        successLogins24h,
        totalLogins7d,
        failedLogins7d,
        failRate24h:    totalLogins24h > 0 ? Math.round((failedLogins24h / totalLogins24h) * 100) : 0,
        // ✅ Fix: cast r as any to avoid TS inference issues with groupBy result
        suspiciousIps:  failedByIp.map((r: any) => ({ ip: r.ipAddress, attempts: r._count.id })),
        blockedUsers,
        deletedUsers,
        totalUsers,
        recentLogs,
        loginTrend,
      },
    });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const getLoginLogs = async (req: Request, res: Response) => {
  try {
    const { success, limit = "100" } = req.query;
    const logs = await prisma.loginLog.findMany({
      where:   success !== undefined ? { success: success === "true" } : {},
      orderBy: { createdAt: "desc" },
      take:    parseInt(limit as string),
    });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Logs retrieved", data: logs });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const clearOldLogs = async (req: Request, res: Response) => {
  try {
    const cutoff      = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { count }   = await prisma.loginLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: `Cleared ${count} old logs`, data: { count } });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// ACCESS CONTROL
// ════════════════════════════════════════════════════════════════════════════════

export const getAccessControlData = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id:        true,
        username:  true,
        email:     true,
        role:      true,
        activated: true,
        isDeleted: true,
        createdAt: true,
        deletedAt: true,
        schoolId:  true,
        course:    true,
        yearLevel: true,
        _count: { select: { foundItem: true, LostItem: true, claim: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // ✅ Fix: cast u as any to avoid TS inference issues with select + _count shape
    const stats = {
      total:   users.length,
      admins:  users.filter((u: any) => u.role === "ADMIN").length,
      active:  users.filter((u: any) => u.activated && !u.isDeleted).length,
      blocked: users.filter((u: any) => !u.activated && !u.isDeleted).length,
      deleted: users.filter((u: any) => u.isDeleted).length,
    };

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Access control data retrieved",
      data:       { users, stats },
    });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// DATA PRIVACY
// ════════════════════════════════════════════════════════════════════════════════

export const getPrivacyStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      deletedUsers,
      usersWithSchoolId,
      usersWithEmail,
      recentDeleted,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isDeleted: true } }),
      prisma.user.count({ where: { schoolId: { not: null } } }),
      prisma.user.count({ where: { email:    { not: ""   } } }),
      prisma.user.findMany({
        where:   { isDeleted: true },
        select:  { id: true, username: true, email: true, deletedAt: true, role: true },
        orderBy: { deletedAt: "desc" },
        take:    10,
      }),
    ]);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Privacy stats retrieved",
      data: {
        totalUsers,
        deletedUsers,
        usersWithSchoolId,
        usersWithEmail,
        recentDeleted,
        dataRetentionDays: 90,
        lastAuditDate:     new Date().toISOString(),
      },
    });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const exportUserData = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where:   { isDeleted: false },
      select: {
        id:        true,
        username:  true,
        email:     true,
        role:      true,
        activated: true,
        createdAt: true,
        schoolId:  true,
        course:    true,
        yearLevel: true,
      },
      orderBy: { createdAt: "desc" },
    });

    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "User data exported", data: users });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const purgeDeletedUsers = async (req: Request, res: Response) => {
  try {
    const cutoff   = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const eligible = await prisma.user.findMany({
      where:  { isDeleted: true, deletedAt: { lt: cutoff } },
      select: { id: true },
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    `${eligible.length} users eligible for purge (deleted 90+ days ago)`,
      data:       { eligible: eligible.length, ids: eligible.map((u: any) => u.id) },
    });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// COMPLIANCE REPORTS
// ════════════════════════════════════════════════════════════════════════════════

export const getComplianceReport = async (req: Request, res: Response) => {
  try {
    const now          = new Date();
    const month        = new Date(now.getFullYear(), now.getMonth(),     1);
    const lastMonth    = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      auditLogs,
      totalClaims,
      approvedClaims,
      rejectedClaims,
      claimsThisMonth,
      totalFoundItems,
      totalLostItems,
      newUsersThisMonth,
      loginLogsThisMonth,
      failedLoginsThisMonth,
    ] = await Promise.all([
      prisma.claimAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take:    100,
        include: { claim: { select: { claimantName: true, foundItem: { select: { foundItemName: true } } } } },
      }),
      prisma.claim.count({ where: { isDeleted: false } }),
      prisma.claim.count({ where: { status: "APPROVED" } }),
      prisma.claim.count({ where: { status: "REJECTED" } }),
      prisma.claim.count({ where: { createdAt: { gte: month } } }),
      prisma.foundItem.count({ where: { isDeleted: false } }),
      prisma.lostItem.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { createdAt: { gte: month } } }),
      prisma.loginLog.count({ where: { createdAt: { gte: month } } }),
      prisma.loginLog.count({ where: { createdAt: { gte: month }, success: false } }),
    ]);

    // Monthly audit summary (last 6 months)
    const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyAudit: { month: string; actions: number; approved: number; rejected: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i,     1);
      const mEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [total, approved, rejected] = await Promise.all([
        prisma.claimAuditLog.count({ where: { createdAt: { gte: mStart, lte: mEnd } } }),
        prisma.claimAuditLog.count({ where: { createdAt: { gte: mStart, lte: mEnd }, toStatus: "APPROVED" } }),
        prisma.claimAuditLog.count({ where: { createdAt: { gte: mStart, lte: mEnd }, toStatus: "REJECTED" } }),
      ]);

      monthlyAudit.push({ month: MONTH_LABELS[mStart.getMonth()], actions: total, approved, rejected });
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Compliance report generated",
      data: {
        generatedAt: now.toISOString(),
        period:      { from: lastMonth.toISOString(), to: now.toISOString() },
        summary: {
          totalClaims,
          approvedClaims,
          rejectedClaims,
          claimsThisMonth,
          approvalRate: totalClaims > 0 ? Math.round((approvedClaims / totalClaims) * 100) : 0,
          totalFoundItems,
          totalLostItems,
          newUsersThisMonth,
          loginLogsThisMonth,
          failedLoginsThisMonth,
          failRateThisMonth: loginLogsThisMonth > 0
            ? Math.round((failedLoginsThisMonth / loginLogsThisMonth) * 100) : 0,
        },
        auditLogs,
        monthlyAudit,
      },
    });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};