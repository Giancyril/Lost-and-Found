import { Request, Response } from "express";
import { foundItemService } from "../modules/foundItems/foundItem.service";
import sendResponse from "../global/response";
import { StatusCodes } from "http-status-codes";
import { lostTItemServices } from "../modules/lostItem/lostItem.service";
import { userService } from "../modules/user/user.service";
import { claimsService } from "../modules/claim/claim.service";

export const adminStats = async (req: Request, res: Response) => {
  const result: any = {};
  try {
    const foundItems  = await foundItemService.getFoundItem({});
    const lostItems   = await lostTItemServices.getLostItem();
    const totalUsers  = await userService.allUsers();
    const claims      = await claimsService.getClaim();

    // ── Date helpers ──────────────────────────────────────────────
    const now       = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const isThisWeek  = (d: string) => new Date(d) >= weekStart;
    const isThisMonth = (d: string) => new Date(d) >= monthStart;

    // ── Found items ───────────────────────────────────────────────
    result.foundItems        = foundItems.length;
    result.claimedItems      = foundItems.filter((i: any) => i.isClaimed).length;
    result.foundThisWeek     = foundItems.filter((i: any) => isThisWeek(i.createdAt)).length;
    result.foundThisMonth    = foundItems.filter((i: any) => isThisMonth(i.createdAt)).length;

    // ── Lost items ────────────────────────────────────────────────
    result.lostItems         = lostItems.length;
    result.lostThisWeek      = lostItems.filter((i: any) => isThisWeek(i.createdAt)).length;
    result.lostThisMonth     = lostItems.filter((i: any) => isThisMonth(i.createdAt)).length;
    result.resolvedLostItems = lostItems.filter((i: any) => i.isFound).length;

    // ── Claims ────────────────────────────────────────────────────
    result.totalClaims       = claims.length;
    result.pendingClaims     = claims.filter((c: any) => c.status === "PENDING").length;
    result.approvedClaims    = claims.filter((c: any) => c.status === "APPROVED").length;
    result.rejectedClaims    = claims.filter((c: any) => c.status === "REJECTED").length;
    result.claimsThisWeek    = claims.filter((c: any) => isThisWeek(c.createdAt)).length;

    // ── Users ─────────────────────────────────────────────────────
    result.totalUsers        = totalUsers.length;
    result.userData          = totalUsers;

    // ── Totals ────────────────────────────────────────────────────
    result.total               = foundItems.length + lostItems.length;
    result.itemsLoggedThisWeek = result.foundThisWeek + result.lostThisWeek;

    // ── Disposal rate (claimed / total found × 100) ───────────────
    result.disposalRate = foundItems.length > 0
      ? Math.round((result.claimedItems / foundItems.length) * 100)
      : 0;

    // ── Resolution rate (resolved lost / total lost × 100) ────────
    result.resolutionRate = lostItems.length > 0
      ? Math.round((result.resolvedLostItems / lostItems.length) * 100)
      : 0;

    // ── Monthly stats (last 6 months) ─────────────────────────────
    // Build an array like:
    // [{ month: "Jan", found: 4, lost: 2, claims: 1 }, ...]
    const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const monthlyMap: Record<string, { month: string; found: number; lost: number; claims: number }> = {};

    // Initialise the last 6 calendar months (including current)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`; // e.g. "2024-0"
      monthlyMap[key] = {
        month:  MONTH_LABELS[d.getMonth()],
        found:  0,
        lost:   0,
        claims: 0,
      };
    }

    const addToMonth = (
      dateStr: string,
      field: "found" | "lost" | "claims"
    ) => {
      const d   = new Date(dateStr);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthlyMap[key]) monthlyMap[key][field]++;
    };

    foundItems.forEach((i: any) => addToMonth(i.createdAt, "found"));
    lostItems.forEach((i: any)  => addToMonth(i.createdAt, "lost"));
    claims.forEach((c: any)     => addToMonth(c.createdAt, "claims"));

    result.monthlyStats = Object.values(monthlyMap); // already in chronological order

    // ── Category breakdown (top categories by total items) ────────
    // Count found + lost items per category name
    const categoryCount: Record<string, { name: string; found: number; lost: number; total: number }> = {};

    foundItems.forEach((i: any) => {
      const name = i.category?.name ?? "Uncategorized";
      if (!categoryCount[name]) categoryCount[name] = { name, found: 0, lost: 0, total: 0 };
      categoryCount[name].found++;
      categoryCount[name].total++;
    });
    lostItems.forEach((i: any) => {
      const name = i.category?.name ?? "Uncategorized";
      if (!categoryCount[name]) categoryCount[name] = { name, found: 0, lost: 0, total: 0 };
      categoryCount[name].lost++;
      categoryCount[name].total++;
    });

    result.categoryBreakdown = Object.values(categoryCount)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // top 8 categories

    // ── Top reporters (users with most found item reports) ────────
    const reporterCount: Record<string, { name: string; count: number }> = {};
    foundItems.forEach((i: any) => {
      const name = i.reporterName ?? i.user?.username ?? "Anonymous";
      if (!reporterCount[name]) reporterCount[name] = { name, count: 0 };
      reporterCount[name].count++;
    });

    result.topReporters = Object.values(reporterCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── Avg claim resolution time (days) ─────────────────────────
    const resolvedClaims = claims.filter(
      (c: any) => (c.status === "APPROVED" || c.status === "REJECTED") && c.updatedAt && c.createdAt
    );
    if (resolvedClaims.length > 0) {
      const totalMs = resolvedClaims.reduce((sum: number, c: any) => {
        return sum + (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime());
      }, 0);
      result.avgClaimResolutionDays = parseFloat(
        (totalMs / resolvedClaims.length / (1000 * 60 * 60 * 24)).toFixed(1)
      );
    } else {
      result.avgClaimResolutionDays = null;
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Admin stats retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message,
      data: null,
    });
  }
};