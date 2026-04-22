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
    const foundItems      = await foundItemService.getFoundItem({});
    const lostItemsActive = await lostTItemServices.getLostItem();
    const allLostItems    = await lostTItemServices.getAllLostItems({});
    const totalUsers      = await userService.allUsers();
    const claims          = await claimsService.getClaim();

    // ── Date helpers ──────────────────────────────────────────────
    const now        = new Date();
    const weekStart  = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const isThisWeek  = (d: string) => new Date(d) >= weekStart;
    const isThisMonth = (d: string) => new Date(d) >= monthStart;

    // ── Found items ───────────────────────────────────────────────
    result.foundItems     = foundItems?.length || 0;
    result.claimedItems   = foundItems?.filter((i: any) => i.isClaimed).length || 0;
    result.foundThisWeek  = foundItems?.filter((i: any) => isThisWeek(i.createdAt)).length || 0;
    result.foundThisMonth = foundItems?.filter((i: any) => isThisMonth(i.createdAt)).length || 0;

    // ── Lost items ────────────────────────────────────────────────
    result.lostItems         = lostItemsActive?.length || 0;
    result.lostThisWeek      = lostItemsActive?.filter((i: any) => isThisWeek(i.createdAt)).length || 0;
    result.lostThisMonth     = lostItemsActive?.filter((i: any) => isThisMonth(i.createdAt)).length || 0;
    result.resolvedLostItems = allLostItems.filter((i: any) => i.isFound).length;

    // ── Claims ────────────────────────────────────────────────────
    result.totalClaims    = claims.length;
    result.pendingClaims  = claims.filter((c: any) => c.status === "PENDING").length;
    result.approvedClaims = claims.filter((c: any) => c.status === "APPROVED").length;
    result.rejectedClaims = claims.filter((c: any) => c.status === "REJECTED").length;
    result.claimsThisWeek = claims.filter((c: any) => isThisWeek(c.createdAt)).length;

    // ── Users ─────────────────────────────────────────────────────
    result.totalUsers = totalUsers.length;
    result.userData   = totalUsers;

    // ── Totals ────────────────────────────────────────────────────
    result.total               = (foundItems?.length || 0) + (lostItemsActive?.length || 0);
    result.itemsLoggedThisWeek = result.foundThisWeek + result.lostThisWeek;

    // ── Disposal rate ─────────────────────────────────────────────
    result.disposalRate = (foundItems?.length || 0) > 0
      ? Math.round((result.claimedItems / (foundItems?.length || 0)) * 100) : 0;

    // ── Resolution rate ───────────────────────────────────────────
    result.resolutionRate = allLostItems.length > 0
      ? Math.round((result.resolvedLostItems / allLostItems.length) * 100) : 0;

    // ── Monthly stats (last 6 months) ─────────────────────────────
    const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyMap: Record<string, {
      month: string; found: number; lost: number; claims: number; resolved: number;
    }> = {};

    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyMap[key] = { month: MONTH_LABELS[d.getMonth()], found: 0, lost: 0, claims: 0, resolved: 0 };
    }

    const addToMonth = (dateStr: string, field: "found" | "lost" | "claims" | "resolved") => {
      const d   = new Date(dateStr);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthlyMap[key]) monthlyMap[key][field]++;
    };

    foundItems?.forEach((i: any)   => addToMonth(i.createdAt, "found"));
    allLostItems.forEach((i: any) => addToMonth(i.createdAt, "lost"));
    claims.forEach((c: any)       => addToMonth(c.createdAt, "claims"));
    allLostItems
      .filter((i: any) => i.isFound && i.updatedAt)
      .forEach((i: any) => addToMonth(i.updatedAt, "resolved"));

    result.monthlyStats = Object.values(monthlyMap).map((m: any) => ({
      ...m,
      resolutionRate: m.lost > 0 ? Math.round((m.resolved / m.lost) * 100) : 0,
    }));

    // ── Category breakdown ────────────────────────────────────────
    const categoryCount: Record<string, { name: string; found: number; lost: number; total: number }> = {};

    foundItems?.forEach((i: any) => {
      const name = i.category?.name ?? "Uncategorized";
      if (!categoryCount[name]) categoryCount[name] = { name, found: 0, lost: 0, total: 0 };
      categoryCount[name].found++;
      categoryCount[name].total++;
    });
    allLostItems.forEach((i: any) => {
      const name = i.category?.name ?? "Uncategorized";
      if (!categoryCount[name]) categoryCount[name] = { name, found: 0, lost: 0, total: 0 };
      categoryCount[name].lost++;
      categoryCount[name].total++;
    });

    result.categoryBreakdown = Object.values(categoryCount)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // ── Top reporters ─────────────────────────────────────────────
    const reporterCount: Record<string, { name: string; count: number }> = {};
    foundItems?.forEach((i: any) => {
      const name = i.reporterName ?? i.user?.username ?? "Anonymous";
      if (!reporterCount[name]) reporterCount[name] = { name, count: 0 };
      reporterCount[name].count++;
    });
    result.topReporters = Object.values(reporterCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── Avg claim resolution time ─────────────────────────────────
    const resolvedClaims = claims.filter(
      (c: any) => (c.status === "APPROVED" || c.status === "REJECTED") && c.updatedAt && c.createdAt
    );
    if (resolvedClaims.length > 0) {
      const totalMs = resolvedClaims.reduce((sum: number, c: any) =>
        sum + (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()), 0);
      result.avgClaimResolutionDays = parseFloat(
        (totalMs / resolvedClaims.length / (1000 * 60 * 60 * 24)).toFixed(1)
      );
    } else {
      result.avgClaimResolutionDays = null;
    }

    // ── Peak reporting days ───────────────────────────────────────
    const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const peakDays: Record<number, { day: string; found: number; lost: number; total: number }> = {};
    for (let i = 0; i < 7; i++) peakDays[i] = { day: DAY_LABELS[i], found: 0, lost: 0, total: 0 };

    foundItems?.forEach((i: any) => {
      const d = new Date(i.createdAt).getDay();
      peakDays[d].found++;
      peakDays[d].total++;
    });
    allLostItems.forEach((i: any) => {
      const d = new Date(i.createdAt).getDay();
      peakDays[d].lost++;
      peakDays[d].total++;
    });
    result.peakReportingDays = Object.values(peakDays);

    // ── Peak reporting hours (grouped into time blocks) ───────────
    const timeBlocks: Record<string, { label: string; found: number; lost: number; total: number }> = {
      "Early Morning": { label: "Early Morning\n12am–6am", found: 0, lost: 0, total: 0 },
      "Morning":       { label: "Morning\n6am–12pm",       found: 0, lost: 0, total: 0 },
      "Afternoon":     { label: "Afternoon\n12pm–6pm",     found: 0, lost: 0, total: 0 },
      "Evening":       { label: "Evening\n6pm–12am",       found: 0, lost: 0, total: 0 },
    };

    const getTimeBlock = (hour: number): string => {
      if (hour >= 0  && hour < 6)  return "Early Morning";
      if (hour >= 6  && hour < 12) return "Morning";
      if (hour >= 12 && hour < 18) return "Afternoon";
      return "Evening";
    };

    foundItems?.forEach((i: any) => {
      const block = getTimeBlock(new Date(i.createdAt).getHours());
      timeBlocks[block].found++;
      timeBlocks[block].total++;
    });
    allLostItems.forEach((i: any) => {
      const block = getTimeBlock(new Date(i.createdAt).getHours());
      timeBlocks[block].lost++;
      timeBlocks[block].total++;
    });
    result.peakReportingHours = Object.values(timeBlocks);

    // ── Unclaimed items age ───────────────────────────────────────
    const unclaimedItems = foundItems?.filter((i: any) => !i.isClaimed) || [];
    const ageMs   = (i: any) => now.getTime() - new Date(i.createdAt).getTime();
    const ageDays = (i: any) => Math.floor(ageMs(i) / (1000 * 60 * 60 * 24));

    result.unclaimedItemsAge = {
      total:      unclaimedItems.length,
      over7days:  unclaimedItems.filter((i: any) => ageDays(i) >= 7).length,
      over30days: unclaimedItems.filter((i: any) => ageDays(i) >= 30).length,
      over90days: unclaimedItems.filter((i: any) => ageDays(i) >= 90).length,
      avgAgeDays: unclaimedItems.length > 0
        ? Math.round(unclaimedItems.reduce((s: number, i: any) => s + ageDays(i), 0) / unclaimedItems.length)
        : 0,
      oldest: unclaimedItems
        .sort((a: any, b: any) => ageMs(b) - ageMs(a))
        .slice(0, 5)
        .map((i: any) => ({
          id:       i.id,
          name:     i.foundItemName,
          days:     ageDays(i),
          location: i.location,
        })),
    };

    // ── Lost vs Found match rate ──────────────────────────────────
    const totalLost     = allLostItems.length;
    const totalResolved = allLostItems.filter((i: any) => i.isFound).length;
    result.lostFoundMatchRate = {
      totalLost,
      totalResolved,
      unresolved: totalLost - totalResolved,
      matchRate:  totalLost > 0 ? Math.round((totalResolved / totalLost) * 100) : 0,
    };

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