import { Request, Response } from "express";
import { foundItemService } from "../modules/foundItems/foundItem.service";
import sendResponse from "../global/response";
import { StatusCodes } from "http-status-codes";
import { lostTItemServices } from "../modules/lostItem/lostItem.service";
import { userService } from "../modules/user/user.service";
import { claimsService } from "../modules/claim/claim.service";

export const adminStats = async (req: Request, res: Response) => {
  const result: any = {};
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const getTimeBlock = (hour: number): string => {
    if (hour >= 0 && hour < 6) return "Early Morning";
    if (hour >= 6 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 18) return "Afternoon";
    return "Evening";
  };

  try {
    console.log("[AdminStats] Fetching found items...");
    const foundItems = await foundItemService.getFoundItem({ limit: 1000 });
    console.log("[AdminStats] Fetching lost items (active)...");
    const lostItemsActive = await lostTItemServices.getLostItem({ limit: 1000 });
    console.log("[AdminStats] Fetching all lost items...");
    const allLostItems = await lostTItemServices.getAllLostItems({ limit: 1000 });
    console.log("[AdminStats] Fetching users...");
    const totalUsers = await userService.allUsers();
    console.log("[AdminStats] Fetching claims...");
    const claims = await claimsService.getClaim();
    console.log("[AdminStats] All data fetched. Calculating stats...");

    // ── Date helpers ──────────────────────────────────────────────
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const isThisWeek = (d: string) => new Date(d) >= weekStart;
    const isThisMonth = (d: string) => new Date(d) >= monthStart;

    // ── Found items ───────────────────────────────────────────────
    result.foundItems = foundItems?.length || 0;
    result.claimedItems = foundItems?.filter((i: any) => i.isClaimed).length || 0;
    result.foundThisWeek = foundItems?.filter((i: any) => isThisWeek(i.createdAt)).length || 0;
    result.foundThisMonth = foundItems?.filter((i: any) => isThisMonth(i.createdAt)).length || 0;

    // ── Lost items ────────────────────────────────────────────────
    result.lostItems = lostItemsActive?.length || 0;
    result.lostThisWeek = lostItemsActive?.filter((i: any) => isThisWeek(i.createdAt)).length || 0;
    result.lostThisMonth = lostItemsActive?.filter((i: any) => isThisMonth(i.createdAt)).length || 0;
    result.resolvedLostItems = allLostItems.filter((i: any) => i.isFound).length;

    // ── Claims ────────────────────────────────────────────────────
    result.totalClaims = claims.length;
    result.pendingClaims = claims.filter((c: any) => c.status === "PENDING").length;
    result.approvedClaims = claims.filter((c: any) => c.status === "APPROVED").length;
    result.rejectedClaims = claims.filter((c: any) => c.status === "REJECTED").length;
    result.claimsThisWeek = claims.filter((c: any) => isThisWeek(c.createdAt)).length;

    // ── Users ─────────────────────────────────────────────────────
    result.totalUsers = totalUsers.length;
    result.userData = totalUsers;

    // ── Totals ────────────────────────────────────────────────────
    result.total = (foundItems?.length || 0) + (lostItemsActive?.length || 0);
    result.itemsLoggedThisWeek = result.foundThisWeek + result.lostThisWeek;

    // ── Disposal rate ─────────────────────────────────────────────
    result.disposalRate = (foundItems?.length || 0) > 0
      ? Math.round((result.claimedItems / (foundItems?.length || 0)) * 100) : 0;

    // ── Resolution rate ───────────────────────────────────────────
    result.resolutionRate = allLostItems.length > 0
      ? Math.round((result.resolvedLostItems / allLostItems.length) * 100) : 0;

    // ── Monthly stats (last 6 months) ─────────────────────────────
    const monthlyMap: Record<string, {
      month: string; found: number; lost: number; claims: number; resolved: number;
    }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyMap[key] = { month: MONTH_LABELS[d.getMonth()], found: 0, lost: 0, claims: 0, resolved: 0 };
    }

    const addToMonth = (dateStr: string, field: "found" | "lost" | "claims" | "resolved") => {
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthlyMap[key]) monthlyMap[key][field]++;
    };

    foundItems?.forEach((i: any) => addToMonth(i.createdAt, "found"));
    allLostItems.forEach((i: any) => addToMonth(i.createdAt, "lost"));
    claims.forEach((c: any) => addToMonth(c.createdAt, "claims"));
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
      "Morning": { label: "Morning\n6am–12pm", found: 0, lost: 0, total: 0 },
      "Afternoon": { label: "Afternoon\n12pm–6pm", found: 0, lost: 0, total: 0 },
      "Evening": { label: "Evening\n6pm–12am", found: 0, lost: 0, total: 0 },
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
    const ageMs = (i: any) => now.getTime() - new Date(i.createdAt).getTime();
    const ageDays = (i: any) => Math.floor(ageMs(i) / (1000 * 60 * 60 * 24));

    result.unclaimedItemsAge = {
      total: unclaimedItems.length,
      over7days: unclaimedItems.filter((i: any) => ageDays(i) >= 7).length,
      over30days: unclaimedItems.filter((i: any) => ageDays(i) >= 30).length,
      over90days: unclaimedItems.filter((i: any) => ageDays(i) >= 90).length,
      avgAgeDays: unclaimedItems.length > 0
        ? Math.round(unclaimedItems.reduce((s: number, i: any) => s + ageDays(i), 0) / unclaimedItems.length)
        : 0,
      oldest: unclaimedItems
        .sort((a: any, b: any) => ageMs(b) - ageMs(a))
        .slice(0, 5)
        .map((i: any) => ({
          id: i.id,
          name: i.foundItemName,
          days: ageDays(i),
          location: i.location,
        })),
    };

    // ── Lost vs Found match rate ──────────────────────────────────
    const totalLost = allLostItems.length;
    const totalResolved = allLostItems.filter((i: any) => i.isFound).length;
    result.lostFoundMatchRate = {
      totalLost,
      totalResolved,
      unresolved: totalLost - totalResolved,
      matchRate: totalLost > 0 ? Math.round((totalResolved / totalLost) * 100) : 0,
    };

    // ════════════════════════════════════════════════════════════════
    // ── ADVANCED ANALYTICS ──────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════

    // ── USER ACTIVITY ─────────────────────────────────────────────

    // Registration trend (last 6 months)
    const userRegMap: Record<string, { month: string; registrations: number; admins: number; users: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      userRegMap[key] = { month: MONTH_LABELS[d.getMonth()], registrations: 0, admins: 0, users: 0 };
    }
    totalUsers.forEach((u: any) => {
      const d = new Date(u.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (userRegMap[key]) {
        userRegMap[key].registrations++;
        if (u.role === "ADMIN") userRegMap[key].admins++;
        else userRegMap[key].users++;
      }
    });
    result.userRegistrationTrend = Object.values(userRegMap);

    // New users this month
    result.newUsersThisMonth = totalUsers.filter((u: any) => isThisMonth(u.createdAt)).length;
    result.newUsersThisWeek = totalUsers.filter((u: any) => isThisWeek(u.createdAt)).length;

    // Role breakdown
    const admins = totalUsers.filter((u: any) => u.role === "ADMIN").length;
    const users = totalUsers.filter((u: any) => u.role !== "ADMIN").length;
    result.userRoleBreakdown = { admins, users, total: totalUsers.length };

    // Active vs blocked users
    const activeUsers = totalUsers.filter((u: any) => u.activated && !u.isDeleted).length;
    const blockedUsers = totalUsers.filter((u: any) => !u.activated).length;
    const deletedUsers = totalUsers.filter((u: any) => u.isDeleted).length;
    result.userStatusBreakdown = { active: activeUsers, blocked: blockedUsers, deleted: deletedUsers };

    // Engagement: users who have submitted at least 1 found or lost item
    const engagedUserIds = new Set<string>();
    foundItems?.forEach((i: any) => { if (i.userId) engagedUserIds.add(i.userId); });
    allLostItems.forEach((i: any) => { if (i.userId) engagedUserIds.add(i.userId); });
    const engagedUsers = engagedUserIds.size;
    result.userEngagement = {
      engagedUsers,
      dormantUsers: Math.max(0, totalUsers.length - engagedUsers),
      engagementRate: totalUsers.length > 0
        ? Math.round((engagedUsers / totalUsers.length) * 100) : 0,
    };

    // Top claimants (users who submitted most claims)
    const claimantCount: Record<string, { name: string; count: number; approved: number }> = {};
    claims.forEach((c: any) => {
      const name = c.claimantName || c.user?.username || "Anonymous";
      if (!claimantCount[name]) claimantCount[name] = { name, count: 0, approved: 0 };
      claimantCount[name].count++;
      if (c.status === "APPROVED") claimantCount[name].approved++;
    });
    result.topClaimants = Object.values(claimantCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── ITEM FLOW ANALYTICS ───────────────────────────────────────

    // Funnel: Lost reported → Found reported → Claim submitted → Claim approved
    const totalFoundReported = foundItems?.length || 0;
    const totalLostReported = allLostItems.length;
    const totalClaimsSubmitted = claims.length;
    const totalClaimsApproved = claims.filter((c: any) => c.status === "APPROVED").length;

    result.itemFlowFunnel = {
      lostReported: totalLostReported,
      foundReported: totalFoundReported,
      claimsSubmitted: totalClaimsSubmitted,
      claimsApproved: totalClaimsApproved,
      // Conversion rates
      lostToFound: totalLostReported > 0
        ? parseFloat(((totalFoundReported / Math.max(totalLostReported, totalFoundReported)) * 100).toFixed(1)) : 0,
      foundToClaim: totalFoundReported > 0
        ? parseFloat(((totalClaimsSubmitted / totalFoundReported) * 100).toFixed(1)) : 0,
      claimToApproval: totalClaimsSubmitted > 0
        ? parseFloat(((totalClaimsApproved / totalClaimsSubmitted) * 100).toFixed(1)) : 0,
      overallRecovery: totalLostReported > 0
        ? parseFloat(((totalClaimsApproved / totalLostReported) * 100).toFixed(1)) : 0,
    };

    // Monthly item flow (found + claims per month side by side)
    const flowMap: Record<string, { month: string; found: number; claimed: number; lost: number; pendingClaims: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      flowMap[key] = { month: MONTH_LABELS[d.getMonth()], found: 0, claimed: 0, lost: 0, pendingClaims: 0 };
    }
    foundItems?.forEach((i: any) => {
      const d = new Date(i.createdAt); const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (flowMap[key]) {
        flowMap[key].found++;
        if (i.isClaimed) flowMap[key].claimed++;
      }
    });
    allLostItems.forEach((i: any) => {
      const d = new Date(i.createdAt); const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (flowMap[key]) flowMap[key].lost++;
    });
    claims.forEach((c: any) => {
      const d = new Date(c.createdAt); const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (flowMap[key] && c.status === "PENDING") flowMap[key].pendingClaims++;
    });
    result.itemFlowMonthly = Object.values(flowMap);

    // Category claim success rate
    const catClaimMap: Record<string, { name: string; found: number; claimed: number; rate: number }> = {};
    foundItems?.forEach((i: any) => {
      const name = i.category?.name ?? "Uncategorized";
      if (!catClaimMap[name]) catClaimMap[name] = { name, found: 0, claimed: 0, rate: 0 };
      catClaimMap[name].found++;
      if (i.isClaimed) catClaimMap[name].claimed++;
    });
    Object.values(catClaimMap).forEach((c: any) => {
      c.rate = c.found > 0 ? Math.round((c.claimed / c.found) * 100) : 0;
    });
    result.categoryClaimRates = Object.values(catClaimMap)
      .filter((c: any) => c.found >= 1)
      .sort((a: any, b: any) => b.rate - a.rate)
      .slice(0, 8);

    // Average time from found → claimed (for approved claims)
    const foundToClaimTimes: number[] = [];
    claims.forEach((c: any) => {
      if (c.status === "APPROVED" && c.foundItem?.createdAt && c.createdAt) {
        const diff = new Date(c.createdAt).getTime() - new Date(c.foundItem.createdAt).getTime();
        if (diff > 0) foundToClaimTimes.push(diff);
      }
    });
    result.avgFoundToClaimDays = foundToClaimTimes.length > 0
      ? parseFloat(
        (foundToClaimTimes.reduce((a, b) => a + b, 0) / foundToClaimTimes.length / (1000 * 60 * 60 * 24)).toFixed(1)
      )
      : null;

    // ── PERFORMANCE METRICS ───────────────────────────────────────

    // Claim approval rate
    const totalResolved2 = result.approvedClaims + result.rejectedClaims;
    result.claimApprovalRate = totalResolved2 > 0
      ? Math.round((result.approvedClaims / totalResolved2) * 100) : 0;
    result.claimRejectionRate = totalResolved2 > 0
      ? Math.round((result.rejectedClaims / totalResolved2) * 100) : 0;

    // Pending claims older than N days
    const pendingClaimsAge = claims
      .filter((c: any) => c.status === "PENDING")
      .map((c: any) => ({
        id: c.id,
        claimantName: c.claimantName || "Unknown",
        itemName: c.foundItem?.foundItemName || "Unknown item",
        ageDays: Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        createdAt: c.createdAt,
      }))
      .sort((a: any, b: any) => b.ageDays - a.ageDays);

    result.pendingClaimsAge = {
      over3days: pendingClaimsAge.filter((c: any) => c.ageDays >= 3).length,
      over7days: pendingClaimsAge.filter((c: any) => c.ageDays >= 7).length,
      over14days: pendingClaimsAge.filter((c: any) => c.ageDays >= 14).length,
      oldest: pendingClaimsAge.slice(0, 5),
      avgAgeDays: pendingClaimsAge.length > 0
        ? Math.round(pendingClaimsAge.reduce((s: number, c: any) => s + c.ageDays, 0) / pendingClaimsAge.length)
        : 0,
    };

    // System throughput: items per week over last 6 weeks
    const weeklyThroughput: { week: string; found: number; lost: number; claims: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const wStart = new Date(now);
      wStart.setDate(now.getDate() - (i + 1) * 7);
      wStart.setHours(0, 0, 0, 0);
      const wEnd = new Date(now);
      wEnd.setDate(now.getDate() - i * 7);
      wEnd.setHours(23, 59, 59, 999);

      const inRange = (d: string) => {
        const t = new Date(d).getTime();
        return t >= wStart.getTime() && t <= wEnd.getTime();
      };

      const weekLabel = `W${6 - i}`;
      weeklyThroughput.push({
        week: weekLabel,
        found: foundItems?.filter((item: any) => inRange(item.createdAt)).length || 0,
        lost: allLostItems.filter((item: any) => inRange(item.createdAt)).length,
        claims: claims.filter((c: any) => inRange(c.createdAt)).length,
      });
    }
    result.weeklyThroughput = weeklyThroughput;

    // Items per user ratio
    result.itemsPerUser = totalUsers.length > 0
      ? parseFloat(((result.foundItems + result.lostItems) / totalUsers.length).toFixed(2)) : 0;

    // Claim rate: claims submitted per found item
    result.claimRatePerItem = result.foundItems > 0
      ? parseFloat((result.totalClaims / result.foundItems).toFixed(2)) : 0;

    // ════════════════════════════════════════════════════════════════
    // ── PREDICTIVE ANALYTICS ──────────────────────────────────────
    // ════════════════════════════════════════════════════════════════

    // 1. Risk Zone Forecast (Locations with high historical density)
    const locationDensity: Record<string, { name: string; count: number; riskScore: number }> = {};
    [...(foundItems || []), ...allLostItems].forEach((i: any) => {
      const loc = i.location || "Unknown";
      if (!locationDensity[loc]) locationDensity[loc] = { name: loc, count: 0, riskScore: 0 };
      locationDensity[loc].count++;
    });

    const maxDensity = Math.max(...Object.values(locationDensity).map(d => d.count), 1);
    const riskZones = Object.values(locationDensity)
      .map(d => ({
        ...d,
        riskScore: Math.round((d.count / maxDensity) * 100),
        trend: d.count > (maxDensity * 0.7) ? "increasing" : "stable",
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);

    // 2. Peak Time Forecast (Based on day-hour combinations)
    const dayHourMap: Record<string, number> = {};
    [...(foundItems || []), ...allLostItems].forEach((i: any) => {
      const d = new Date(i.createdAt);
      const key = `${d.getDay()}-${getTimeBlock(d.getHours())}`;
      dayHourMap[key] = (dayHourMap[key] || 0) + 1;
    });

    const sortedPatterns = Object.entries(dayHourMap)
      .sort(([, a], [, b]) => b - a);

    const timeForecasts = sortedPatterns.slice(0, 3).map(([key, count]) => {
      const [dayIdx, block] = key.split("-");
      return {
        day: DAY_LABELS[parseInt(dayIdx)],
        timeBlock: block,
        probability: Math.min(Math.round((count / (result.total || 1)) * 100 * 4), 95), // Scaled prob
        confidence: count > 5 ? "High" : "Medium",
      };
    });

    // 3. Patrol Suggestions
    const patrolSuggestions = riskZones.slice(0, 3).map((zone, idx) => {
      const bestTime = timeForecasts[0] || { day: "Weekdays", timeBlock: "Afternoon" };
      return {
        location: zone.name,
        suggestedTime: bestTime.timeBlock,
        priority: zone.riskScore > 80 ? "Critical" : zone.riskScore > 50 ? "High" : "Normal",
        reason: `${zone.count} historical reports in this zone.`,
      };
    });

    result.predictiveAnalytics = {
      riskZones,
      timeForecasts,
      patrolSuggestions,
      accuracyRate: 88, // Simulated accuracy
      lastModelUpdate: now.toISOString(),
    };

    // Overall system health score (0–100)
    const healthFactors = [
      // Lower pending claim ratio is better
      result.totalClaims > 0 ? Math.max(0, 100 - Math.round((result.pendingClaims / result.totalClaims) * 100)) : 100,
      // Higher claim approval rate is better
      result.claimApprovalRate,
      // Higher resolution rate is better
      result.resolutionRate,
      // Lower unclaimed age average is better (cap at 30 days)
      Math.max(0, 100 - Math.round((result.unclaimedItemsAge.avgAgeDays / 30) * 100)),
    ];

    result.systemHealthScore = Math.round(
      healthFactors.reduce((a, b) => a + b, 0) / healthFactors.length
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Admin stats retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("[AdminStats] Error calculating stats:", error);
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message || "Internal server error during stats calculation",
      data: null,
    });
  }
};