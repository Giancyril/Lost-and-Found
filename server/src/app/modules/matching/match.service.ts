import { FoundItem, LostItem } from "@prisma/client";
import prisma from "../../config/prisma";
import { getCoordinates } from "../../utils/campusLocations";
import { sendEmail } from "../../utils/mailer";
import { smartMatchNotificationTemplate } from "../../utils/emailTemplates";

const MATCH_THRESHOLD_KM = 0.1; // 100 meters

const deg2rad = (deg: number) => deg * (Math.PI / 180);

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const findMatchesForFoundItem = async (foundItem: FoundItem) => {
  const lostItems = await prisma.lostItem.findMany({
    where: {
      categoryId: foundItem.categoryId,
      isFound:     false,
      isDeleted:   false,
    },
  });

  const foundCoords = getCoordinates(foundItem.location);
  if (!foundCoords) return;

  for (const lostItem of lostItems) {
    const lostCoords = getCoordinates(lostItem.location);
    if (!lostCoords) continue;

    const distance = getDistance(foundCoords[0], foundCoords[1], lostCoords[0], lostCoords[1]);

    // Match if same coordinates (same building) or within threshold
    if (distance <= MATCH_THRESHOLD_KM) {
      await notifyMatch(lostItem, foundItem);
    }
  }
};

const findMatchesForLostItem = async (lostItem: LostItem) => {
  const foundItems = await prisma.foundItem.findMany({
    where: {
      categoryId: lostItem.categoryId,
      isClaimed:   false,
      isDeleted:   false,
    },
  });

  const lostCoords = getCoordinates(lostItem.location);
  if (!lostCoords) return;

  for (const foundItem of foundItems) {
    const foundCoords = getCoordinates(foundItem.location);
    if (!foundCoords) continue;

    const distance = getDistance(lostCoords[0], lostCoords[1], foundCoords[0], foundCoords[1]);

    if (distance <= MATCH_THRESHOLD_KM) {
      await notifyMatch(lostItem, foundItem);
    }
  }
};

const notifyMatch = async (lostItem: LostItem, foundItem: FoundItem) => {
  if (!lostItem.schoolEmail) return;

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
    console.log(`[SmartMatch] Notification sent to ${lostItem.schoolEmail} for item ${foundItem.foundItemName}`);
  } catch (error) {
    console.error("[SmartMatch] Failed to send notification email:", error);
  }
};

export const matchService = {
  findMatchesForFoundItem,
  findMatchesForLostItem,
};
