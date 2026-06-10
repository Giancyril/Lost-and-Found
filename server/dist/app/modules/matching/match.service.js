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
exports.matchService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const campusLocations_1 = require("../../utils/campusLocations");
const mailer_1 = require("../../utils/mailer");
const emailTemplates_1 = require("../../utils/emailTemplates");
const push_service_1 = require("../push/push.service");
const MATCH_THRESHOLD_KM = 0.1; // 100 meters
// ── Haversine formula ─────────────────────────────────────────────────────────
const deg2rad = (deg) => deg * (Math.PI / 180);
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
// ── Deduplication guard ───────────────────────────────────────────────────────
// Returns true if a notification has already been sent for this pair.
// Uses a DB upsert so concurrent triggers can't race past it.
const alreadyNotified = (lostItemId, foundItemId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.default.matchNotification.create({
            data: { lostItemId, foundItemId },
        });
        return false; // just created — first time we've seen this pair
    }
    catch (_a) {
        // Unique constraint violation → record already exists → duplicate
        return true;
    }
});
// ── Core matching logic ───────────────────────────────────────────────────────
const isLocationMatch = (coord1, coord2) => getDistance(coord1[0], coord1[1], coord2[0], coord2[1]) <= MATCH_THRESHOLD_KM;
const isTimelineValid = (lostDate, foundDate) => new Date(foundDate) >= new Date(lostDate);
// ── Triggered when a new Found item is reported ───────────────────────────────
const findMatchesForFoundItem = (foundItem) => __awaiter(void 0, void 0, void 0, function* () {
    const foundCoords = (0, campusLocations_1.getCoordinates)(foundItem.location);
    if (!foundCoords) {
        console.warn(`[SmartMatch] Could not resolve coordinates for found location: "${foundItem.location}" (foundItemId: ${foundItem.id})`);
        return;
    }
    const lostItems = yield prisma_1.default.lostItem.findMany({
        where: {
            categoryId: foundItem.categoryId,
            isFound: false,
            isDeleted: false,
        },
    });
    for (const lostItem of lostItems) {
        const lostCoords = (0, campusLocations_1.getCoordinates)(lostItem.location);
        if (!lostCoords) {
            console.warn(`[SmartMatch] Could not resolve coordinates for lost location: "${lostItem.location}" (lostItemId: ${lostItem.id})`);
            continue;
        }
        // FIX 1: Date/timeline check — found date must be on or after lost date
        if (!isTimelineValid(lostItem.date, foundItem.date)) {
            console.log(`[SmartMatch] Skipping pair — found date (${foundItem.date.toISOString()}) is before lost date (${lostItem.date.toISOString()})`);
            continue;
        }
        if (isLocationMatch(foundCoords, lostCoords)) {
            yield notifyMatch(lostItem, foundItem);
        }
    }
});
// ── Triggered when a new Lost item is reported ────────────────────────────────
const findMatchesForLostItem = (lostItem) => __awaiter(void 0, void 0, void 0, function* () {
    const lostCoords = (0, campusLocations_1.getCoordinates)(lostItem.location);
    if (!lostCoords) {
        console.warn(`[SmartMatch] Could not resolve coordinates for lost location: "${lostItem.location}" (lostItemId: ${lostItem.id})`);
        return;
    }
    const foundItems = yield prisma_1.default.foundItem.findMany({
        where: {
            categoryId: lostItem.categoryId,
            isClaimed: false,
            isDeleted: false,
        },
    });
    for (const foundItem of foundItems) {
        const foundCoords = (0, campusLocations_1.getCoordinates)(foundItem.location);
        if (!foundCoords) {
            console.warn(`[SmartMatch] Could not resolve coordinates for found location: "${foundItem.location}" (foundItemId: ${foundItem.id})`);
            continue;
        }
        // FIX 1: Date/timeline check — found date must be on or after lost date
        if (!isTimelineValid(lostItem.date, foundItem.date)) {
            console.log(`[SmartMatch] Skipping pair — found date (${foundItem.date.toISOString()}) is before lost date (${lostItem.date.toISOString()})`);
            continue;
        }
        if (isLocationMatch(lostCoords, foundCoords)) {
            yield notifyMatch(lostItem, foundItem);
        }
    }
});
const calculateMatchPercentage = (lostItem, foundItem) => {
    // Normalize strings
    const cleanLostName = lostItem.lostItemName.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const cleanFoundName = foundItem.foundItemName.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const lostTokens = new Set(cleanLostName.split(/\s+/).filter(t => t.length > 2));
    const foundTokens = new Set(cleanFoundName.split(/\s+/).filter(t => t.length > 2));
    if (lostTokens.size === 0 || foundTokens.size === 0) {
        return 75; // base match category
    }
    // Intersection Jaccard Similarity
    let intersectionCount = 0;
    for (const token of lostTokens) {
        if (foundTokens.has(token))
            intersectionCount++;
    }
    const unionCount = lostTokens.size + foundTokens.size - intersectionCount;
    const wordSimilarity = unionCount > 0 ? (intersectionCount / unionCount) : 0;
    // Location Proximity Scoring
    let locationSimilarity = 0.5;
    const lostCoords = (0, campusLocations_1.getCoordinates)(lostItem.location);
    const foundCoords = (0, campusLocations_1.getCoordinates)(foundItem.location);
    if (lostCoords && foundCoords) {
        const dist = getDistance(lostCoords[0], lostCoords[1], foundCoords[0], foundCoords[1]);
        if (dist <= 0.01) { // 10 meters
            locationSimilarity = 1.0;
        }
        else if (dist <= 0.05) { // 50 meters
            locationSimilarity = 0.9;
        }
        else if (dist <= 0.1) { // 100 meters
            locationSimilarity = 0.8;
        }
    }
    else if (lostItem.location.toLowerCase() === foundItem.location.toLowerCase()) {
        locationSimilarity = 1.0;
    }
    // Final score: 40% category (implicit), 40% word similarity, 20% location
    const score = 40 + (wordSimilarity * 40) + (locationSimilarity * 20);
    return Math.round(Math.min(99, Math.max(50, score)));
};
// ── Email notification with deduplication ────────────────────────────────────
const notifyMatch = (lostItem, foundItem) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    if (!lostItem.schoolEmail) {
        console.warn(`[SmartMatch] No schoolEmail on lostItem ${lostItem.id} — skipping notification`);
        return;
    }
    const senderEmail = process.env.SMTP_FROM_EMAIL;
    if (!senderEmail) {
        console.error("[SmartMatch] SMTP_FROM_EMAIL env var is not set — cannot send notification");
        return;
    }
    const senderName = (_b = process.env.SMTP_FROM_NAME) !== null && _b !== void 0 ? _b : "NBSC Lost & Found";
    // Deduplication — skip if we already sent this exact pair
    const isDuplicate = yield alreadyNotified(lostItem.id, foundItem.id);
    if (isDuplicate) {
        console.log(`[SmartMatch] Duplicate suppressed — already notified for lostItem: ${lostItem.id}, foundItem: ${foundItem.id}`);
        return;
    }
    const matchPercentage = calculateMatchPercentage(lostItem, foundItem);
    const template = (0, emailTemplates_1.smartMatchNotificationTemplate)({
        reporterName: lostItem.reporterName || "User",
        itemName: foundItem.foundItemName,
        location: foundItem.location,
        date: foundItem.date.toLocaleDateString(),
        matchPercentage,
    });
    try {
        yield (0, mailer_1.sendEmail)({
            fromName: senderName,
            fromEmail: senderEmail,
            toEmail: lostItem.schoolEmail,
            subject: template.subject,
            html: template.html,
        });
        console.log(`[SmartMatch] Notification sent → ${lostItem.schoolEmail} | lost: ${lostItem.id} | found: ${foundItem.id} | match: ${matchPercentage}%`);
        // Trigger Push Notification
        if (lostItem.userId) {
            yield push_service_1.pushService.sendNotificationToUser(lostItem.userId, {
                title: "Potential Match Found!",
                body: `We found a ${matchPercentage}% match reported in the ${foundItem.location}!`,
                data: {
                    type: "MATCH",
                    foundItemId: foundItem.id,
                },
            });
        }
    }
    catch (error) {
        // FIX 3: Roll back the deduplication record so we can retry on the next trigger
        yield prisma_1.default.matchNotification
            .delete({ where: { lostItemId_foundItemId: { lostItemId: lostItem.id, foundItemId: foundItem.id } } })
            .catch(() => { });
        console.error(`[SmartMatch] Failed to send notification for lostItem: ${lostItem.id}, foundItem: ${foundItem.id}`, error);
    }
});
exports.matchService = {
    findMatchesForFoundItem,
    findMatchesForLostItem,
};
