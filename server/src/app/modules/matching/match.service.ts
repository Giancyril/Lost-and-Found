import { FoundItem, LostItem } from "@prisma/client";
import prisma from "../../config/prisma";
import { getCoordinates } from "../../utils/campusLocations";
import { sendEmail } from "../../utils/mailer";
 import { smartMatchNotificationTemplate } from "../../utils/emailTemplates";
import { pushService } from "../push/push.service";

const MATCH_THRESHOLD_KM = 0.1; // 100 meters

// ── Haversine formula ─────────────────────────────────────────────────────────
const deg2rad = (deg: number) => deg * (Math.PI / 180);

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R    = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Deduplication guard ───────────────────────────────────────────────────────
// Returns true if a notification has already been sent for this pair.
// Uses a DB upsert so concurrent triggers can't race past it.
const alreadyNotified = async (
  lostItemId: string,
  foundItemId: string
): Promise<boolean> => {
  try {
    await prisma.matchNotification.create({
      data: { lostItemId, foundItemId },
    });
    return false; // just created — first time we've seen this pair
  } catch {
    // Unique constraint violation → record already exists → duplicate
    return true;
  }
};

// ── Core matching logic ───────────────────────────────────────────────────────
const isLocationMatch = (
  coord1: [number, number],
  coord2: [number, number]
): boolean => getDistance(coord1[0], coord1[1], coord2[0], coord2[1]) <= MATCH_THRESHOLD_KM;

const isTimelineValid = (lostDate: Date, foundDate: Date): boolean =>
  new Date(foundDate) >= new Date(lostDate);

// ── Triggered when a new Found item is reported ───────────────────────────────
const findMatchesForFoundItem = async (foundItem: FoundItem): Promise<void> => {
  const foundCoords = getCoordinates(foundItem.location);
  if (!foundCoords) {
    console.warn(
      `[SmartMatch] Could not resolve coordinates for found location: "${foundItem.location}" (foundItemId: ${foundItem.id})`
    );
    return;
  }

  const lostItems = await prisma.lostItem.findMany({
    where: {
      categoryId: foundItem.categoryId,
      isFound:    false,
      isDeleted:  false,
    },
  });

  for (const lostItem of lostItems) {
    const lostCoords = getCoordinates(lostItem.location);
    if (!lostCoords) {
      console.warn(
        `[SmartMatch] Could not resolve coordinates for lost location: "${lostItem.location}" (lostItemId: ${lostItem.id})`
      );
      continue;
    }

    // FIX 1: Date/timeline check — found date must be on or after lost date
    if (!isTimelineValid(lostItem.date, foundItem.date)) {
      console.log(
        `[SmartMatch] Skipping pair — found date (${foundItem.date.toISOString()}) is before lost date (${lostItem.date.toISOString()})`
      );
      continue;
    }

    if (isLocationMatch(foundCoords, lostCoords)) {
      await notifyMatch(lostItem, foundItem);
    }
  }
};

// ── Triggered when a new Lost item is reported ────────────────────────────────
const findMatchesForLostItem = async (lostItem: LostItem): Promise<void> => {
  const lostCoords = getCoordinates(lostItem.location);
  if (!lostCoords) {
    console.warn(
      `[SmartMatch] Could not resolve coordinates for lost location: "${lostItem.location}" (lostItemId: ${lostItem.id})`
    );
    return;
  }

  const foundItems = await prisma.foundItem.findMany({
    where: {
      categoryId: lostItem.categoryId,
      isClaimed:  false,
      isDeleted:  false,
    },
  });

  for (const foundItem of foundItems) {
    const foundCoords = getCoordinates(foundItem.location);
    if (!foundCoords) {
      console.warn(
        `[SmartMatch] Could not resolve coordinates for found location: "${foundItem.location}" (foundItemId: ${foundItem.id})`
      );
      continue;
    }

    // FIX 1: Date/timeline check — found date must be on or after lost date
    if (!isTimelineValid(lostItem.date, foundItem.date)) {
      console.log(
        `[SmartMatch] Skipping pair — found date (${foundItem.date.toISOString()}) is before lost date (${lostItem.date.toISOString()})`
      );
      continue;
    }

    if (isLocationMatch(lostCoords, foundCoords)) {
      await notifyMatch(lostItem, foundItem);
    }
  }
};

const calculateMatchPercentage = (lostItem: LostItem, foundItem: FoundItem): number => {
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
    if (foundTokens.has(token)) intersectionCount++;
  }

  const unionCount = lostTokens.size + foundTokens.size - intersectionCount;
  const wordSimilarity = unionCount > 0 ? (intersectionCount / unionCount) : 0;

  // Location Proximity Scoring
  let locationSimilarity = 0.5;
  const lostCoords = getCoordinates(lostItem.location);
  const foundCoords = getCoordinates(foundItem.location);
  if (lostCoords && foundCoords) {
    const dist = getDistance(lostCoords[0], lostCoords[1], foundCoords[0], foundCoords[1]);
    if (dist <= 0.01) { // 10 meters
      locationSimilarity = 1.0;
    } else if (dist <= 0.05) { // 50 meters
      locationSimilarity = 0.9;
    } else if (dist <= 0.1) { // 100 meters
      locationSimilarity = 0.8;
    }
  } else if (lostItem.location.toLowerCase() === foundItem.location.toLowerCase()) {
    locationSimilarity = 1.0;
  }

  // Final score: 40% category (implicit), 40% word similarity, 20% location
  const score = 40 + (wordSimilarity * 40) + (locationSimilarity * 20);
  return Math.round(Math.min(99, Math.max(50, score)));
};

// ── Email notification with deduplication ────────────────────────────────────
const notifyMatch = async (
  lostItem: LostItem,
  foundItem: FoundItem
): Promise<void> => {
  if (!lostItem.schoolEmail) {
    console.warn(
      `[SmartMatch] No schoolEmail on lostItem ${lostItem.id} — skipping notification`
    );
    return;
  }

  const senderEmail = process.env.SMTP_FROM_EMAIL;
  if (!senderEmail) {
    console.error("[SmartMatch] SMTP_FROM_EMAIL env var is not set — cannot send notification");
    return;
  }

  const senderName = process.env.SMTP_FROM_NAME ?? "NBSC Lost & Found";

  // Deduplication — skip if we already sent this exact pair
  const isDuplicate = await alreadyNotified(lostItem.id, foundItem.id);
  if (isDuplicate) {
    console.log(
      `[SmartMatch] Duplicate suppressed — already notified for lostItem: ${lostItem.id}, foundItem: ${foundItem.id}`
    );
    return;
  }

  const matchPercentage = calculateMatchPercentage(lostItem, foundItem);

  const template = smartMatchNotificationTemplate({
    reporterName: lostItem.reporterName || "User",
    itemName:     foundItem.foundItemName,
    location:     foundItem.location,
    date:         foundItem.date.toLocaleDateString(),
    matchPercentage,
  });

  try {
    await sendEmail({
      fromName:  senderName,
      fromEmail: senderEmail,
      toEmail:   lostItem.schoolEmail,
      subject:   template.subject,
      html:      template.html,
    });
    console.log(
      `[SmartMatch] Notification sent → ${lostItem.schoolEmail} | lost: ${lostItem.id} | found: ${foundItem.id} | match: ${matchPercentage}%`
    );

    // Trigger Push Notification
    if (lostItem.userId) {
      await pushService.sendNotificationToUser(lostItem.userId, {
        title: "Potential Match Found!",
        body: `We found a ${matchPercentage}% match reported in the ${foundItem.location}!`,
        data: {
          type: "MATCH",
          foundItemId: foundItem.id,
        },
      });
    }
  } catch (error) {
    // FIX 3: Roll back the deduplication record so we can retry on the next trigger
    await prisma.matchNotification
      .delete({ where: { lostItemId_foundItemId: { lostItemId: lostItem.id, foundItemId: foundItem.id } } })
      .catch(() => { /* ignore if already gone */ });

    console.error(
      `[SmartMatch] Failed to send notification for lostItem: ${lostItem.id}, foundItem: ${foundItem.id}`,
      error
    );
  }
};

export const matchService = {
  findMatchesForFoundItem,
  findMatchesForLostItem,
};