import { FoundItem, LostItem } from "@prisma/client";
import prisma from "../../config/prisma";
import { getCoordinates } from "../../utils/campusLocations";
import { sendEmail } from "../../utils/mailer";
import { smartMatchNotificationTemplate } from "../../utils/emailTemplates";

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

  // FIX 2: Deduplication — skip if we already sent this exact pair
  const isDuplicate = await alreadyNotified(lostItem.id, foundItem.id);
  if (isDuplicate) {
    console.log(
      `[SmartMatch] Duplicate suppressed — already notified for lostItem: ${lostItem.id}, foundItem: ${foundItem.id}`
    );
    return;
  }

  const template = smartMatchNotificationTemplate({
    reporterName: lostItem.reporterName || "User",
    itemName:     foundItem.foundItemName,
    location:     foundItem.location,
    date:         foundItem.date.toLocaleDateString(),
  });

  try {
    await sendEmail({
      fromName:  "NBSC Lost & Found",
      fromEmail: process.env.SENDER_EMAIL!,
      toEmail:   lostItem.schoolEmail,
      subject:   template.subject,
      html:      template.html,
    });
    console.log(
      `[SmartMatch] Notification sent → ${lostItem.schoolEmail} | lost: ${lostItem.id} | found: ${foundItem.id}`
    );
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