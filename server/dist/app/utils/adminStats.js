"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminStats = void 0;
const foundItem_service_1 = require("../modules/foundItems/foundItem.service");
const response_1 = __importDefault(require("../global/response"));
const http_status_codes_1 = require("http-status-codes");
const lostItem_service_1 = require("../modules/lostItem/lostItem.service");
const user_service_1 = require("../modules/user/user.service");
const claim_service_1 = require("../modules/claim/claim.service");
const adminStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = {};
    try {
        const foundItems = yield foundItem_service_1.foundItemService.getFoundItem({});
        const lostItemsActive = yield lostItem_service_1.lostTItemServices.getLostItem();
        const allLostItems = yield lostItem_service_1.lostTItemServices.getAllLostItems({});
        const totalUsers = yield user_service_1.userService.allUsers();
        const claims = yield claim_service_1.claimsService.getClaim();
        // ── Date helpers ──────────────────────────────────────────────
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const isThisWeek = (d) => new Date(d) >= weekStart;
        const isThisMonth = (d) => new Date(d) >= monthStart;
        // ── Found items ───────────────────────────────────────────────
        result.foundItems = (foundItems === null || foundItems === void 0 ? void 0 : foundItems.length) || 0;
        result.claimedItems = (foundItems === null || foundItems === void 0 ? void 0 : foundItems.filter((i) => i.isClaimed).length) || 0;
        result.foundThisWeek = (foundItems === null || foundItems === void 0 ? void 0 : foundItems.filter((i) => isThisWeek(i.createdAt)).length) || 0;
        result.foundThisMonth = (foundItems === null || foundItems === void 0 ? void 0 : foundItems.filter((i) => isThisMonth(i.createdAt)).length) || 0;
        // ── Lost items ────────────────────────────────────────────────
        result.lostItems = (lostItemsActive === null || lostItemsActive === void 0 ? void 0 : lostItemsActive.length) || 0;
        result.lostThisWeek = (lostItemsActive === null || lostItemsActive === void 0 ? void 0 : lostItemsActive.filter((i) => isThisWeek(i.createdAt)).length) || 0;
        result.lostThisMonth = (lostItemsActive === null || lostItemsActive === void 0 ? void 0 : lostItemsActive.filter((i) => isThisMonth(i.createdAt)).length) || 0;
        result.resolvedLostItems = allLostItems.filter((i) => i.isFound).length;
        // ── Claims ────────────────────────────────────────────────────
        result.totalClaims = claims.length;
        result.pendingClaims = claims.filter((c) => c.status === "PENDING").length;
        result.approvedClaims = claims.filter((c) => c.status === "APPROVED").length;
        result.rejectedClaims = claims.filter((c) => c.status === "REJECTED").length;
        result.claimsThisWeek = claims.filter((c) => isThisWeek(c.createdAt)).length;
        // ── Users ─────────────────────────────────────────────────────
        result.totalUsers = totalUsers.length;
        result.userData = totalUsers;
        // ── Totals ────────────────────────────────────────────────────
        result.total = ((foundItems === null || foundItems === void 0 ? void 0 : foundItems.length) || 0) + ((lostItemsActive === null || lostItemsActive === void 0 ? void 0 : lostItemsActive.length) || 0);
        result.itemsLoggedThisWeek = result.foundThisWeek + result.lostThisWeek;
        // ── Disposal rate ─────────────────────────────────────────────
        result.disposalRate = ((foundItems === null || foundItems === void 0 ? void 0 : foundItems.length) || 0) > 0
            ? Math.round((result.claimedItems / ((foundItems === null || foundItems === void 0 ? void 0 : foundItems.length) || 0)) * 100) : 0;
        // ── Resolution rate ───────────────────────────────────────────
        result.resolutionRate = allLostItems.length > 0
            ? Math.round((result.resolvedLostItems / allLostItems.length) * 100) : 0;
        // ── Monthly stats (last 6 months) ─────────────────────────────
        const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyMap = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            monthlyMap[key] = { month: MONTH_LABELS[d.getMonth()], found: 0, lost: 0, claims: 0, resolved: 0 };
        }
        const addToMonth = (dateStr, field) => {
            const d = new Date(dateStr);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (monthlyMap[key])
                monthlyMap[key][field]++;
        };
        foundItems === null || foundItems === void 0 ? void 0 : foundItems.forEach((i) => addToMonth(i.createdAt, "found"));
        allLostItems.forEach((i) => addToMonth(i.createdAt, "lost"));
        claims.forEach((c) => addToMonth(c.createdAt, "claims"));
        allLostItems
            .filter((i) => i.isFound && i.updatedAt)
            .forEach((i) => addToMonth(i.updatedAt, "resolved"));
        result.monthlyStats = Object.values(monthlyMap).map((m) => (Object.assign(Object.assign({}, m), { resolutionRate: m.lost > 0 ? Math.round((m.resolved / m.lost) * 100) : 0 })));
        // ── Category breakdown ────────────────────────────────────────
        const categoryCount = {};
        foundItems === null || foundItems === void 0 ? void 0 : foundItems.forEach((i) => {
            var _a, _b;
            const name = (_b = (_a = i.category) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "Uncategorized";
            if (!categoryCount[name])
                categoryCount[name] = { name, found: 0, lost: 0, total: 0 };
            categoryCount[name].found++;
            categoryCount[name].total++;
        });
        allLostItems.forEach((i) => {
            var _a, _b;
            const name = (_b = (_a = i.category) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "Uncategorized";
            if (!categoryCount[name])
                categoryCount[name] = { name, found: 0, lost: 0, total: 0 };
            categoryCount[name].lost++;
            categoryCount[name].total++;
        });
        result.categoryBreakdown = Object.values(categoryCount)
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
        // ── Top reporters ─────────────────────────────────────────────
        const reporterCount = {};
        foundItems === null || foundItems === void 0 ? void 0 : foundItems.forEach((i) => {
            var _a, _b, _c;
            const name = (_c = (_a = i.reporterName) !== null && _a !== void 0 ? _a : (_b = i.user) === null || _b === void 0 ? void 0 : _b.username) !== null && _c !== void 0 ? _c : "Anonymous";
            if (!reporterCount[name])
                reporterCount[name] = { name, count: 0 };
            reporterCount[name].count++;
        });
        result.topReporters = Object.values(reporterCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        // ── Avg claim resolution time ─────────────────────────────────
        const resolvedClaims = claims.filter((c) => (c.status === "APPROVED" || c.status === "REJECTED") && c.updatedAt && c.createdAt);
        if (resolvedClaims.length > 0) {
            const totalMs = resolvedClaims.reduce((sum, c) => sum + (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()), 0);
            result.avgClaimResolutionDays = parseFloat((totalMs / resolvedClaims.length / (1000 * 60 * 60 * 24)).toFixed(1));
        }
        else {
            result.avgClaimResolutionDays = null;
        }
        // ── Peak reporting days ───────────────────────────────────────
        const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const peakDays = {};
        for (let i = 0; i < 7; i++)
            peakDays[i] = { day: DAY_LABELS[i], found: 0, lost: 0, total: 0 };
        foundItems === null || foundItems === void 0 ? void 0 : foundItems.forEach((i) => {
            const d = new Date(i.createdAt).getDay();
            peakDays[d].found++;
            peakDays[d].total++;
        });
        allLostItems.forEach((i) => {
            const d = new Date(i.createdAt).getDay();
            peakDays[d].lost++;
            peakDays[d].total++;
        });
        result.peakReportingDays = Object.values(peakDays);
        // ── Peak reporting hours (grouped into time blocks) ───────────
        const timeBlocks = {
            "Early Morning": { label: "Early Morning\n12am–6am", found: 0, lost: 0, total: 0 },
            "Morning": { label: "Morning\n6am–12pm", found: 0, lost: 0, total: 0 },
            "Afternoon": { label: "Afternoon\n12pm–6pm", found: 0, lost: 0, total: 0 },
            "Evening": { label: "Evening\n6pm–12am", found: 0, lost: 0, total: 0 },
        };
        const getTimeBlock = (hour) => {
            if (hour >= 0 && hour < 6)
                return "Early Morning";
            if (hour >= 6 && hour < 12)
                return "Morning";
            if (hour >= 12 && hour < 18)
                return "Afternoon";
            return "Evening";
        };
        foundItems === null || foundItems === void 0 ? void 0 : foundItems.forEach((i) => {
            const block = getTimeBlock(new Date(i.createdAt).getHours());
            timeBlocks[block].found++;
            timeBlocks[block].total++;
        });
        allLostItems.forEach((i) => {
            const block = getTimeBlock(new Date(i.createdAt).getHours());
            timeBlocks[block].lost++;
            timeBlocks[block].total++;
        });
        result.peakReportingHours = Object.values(timeBlocks);
        // ── Unclaimed items age ───────────────────────────────────────
        const unclaimedItems = (foundItems === null || foundItems === void 0 ? void 0 : foundItems.filter((i) => !i.isClaimed)) || [];
        const ageMs = (i) => now.getTime() - new Date(i.createdAt).getTime();
        const ageDays = (i) => Math.floor(ageMs(i) / (1000 * 60 * 60 * 24));
        result.unclaimedItemsAge = {
            total: unclaimedItems.length,
            over7days: unclaimedItems.filter((i) => ageDays(i) >= 7).length,
            over30days: unclaimedItems.filter((i) => ageDays(i) >= 30).length,
            over90days: unclaimedItems.filter((i) => ageDays(i) >= 90).length,
            avgAgeDays: unclaimedItems.length > 0
                ? Math.round(unclaimedItems.reduce((s, i) => s + ageDays(i), 0) / unclaimedItems.length)
                : 0,
            oldest: unclaimedItems
                .sort((a, b) => ageMs(b) - ageMs(a))
                .slice(0, 5)
                .map((i) => ({
                id: i.id,
                name: i.foundItemName,
                days: ageDays(i),
                location: i.location,
            })),
        };
        // ── Lost vs Found match rate ──────────────────────────────────
        const totalLost = allLostItems.length;
        const totalResolved = allLostItems.filter((i) => i.isFound).length;
        result.lostFoundMatchRate = {
            totalLost,
            totalResolved,
            unresolved: totalLost - totalResolved,
            matchRate: totalLost > 0 ? Math.round((totalResolved / totalLost) * 100) : 0,
        };
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Admin stats retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: error === null || error === void 0 ? void 0 : error.message,
            data: null,
        });
    }
});
exports.adminStats = adminStats;
