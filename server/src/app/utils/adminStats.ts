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
    result.total             = foundItems.length + lostItems.length;
    result.itemsLoggedThisWeek = result.foundThisWeek + result.lostThisWeek;

    // ── Disposal rate (claimed / total found × 100) ───────────────
    result.disposalRate = foundItems.length > 0
      ? Math.round((result.claimedItems / foundItems.length) * 100)
      : 0;

    // ── Resolution rate (resolved lost / total lost × 100) ────────
    result.resolutionRate = lostItems.length > 0
      ? Math.round((result.resolvedLostItems / lostItems.length) * 100)
      : 0;

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