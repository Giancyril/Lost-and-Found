import prisma from "../../config/prisma";
import { uploadBase64ToStorage } from "../../utils/storage";

const db = prisma as any;

const createSighting = async (data: {
  lostItemId: string;
  userId?: string;
  reporterName?: string;
  img?: string;
  location: string;
  coordinates?: string;
  details?: string;
}) => {
  const { lostItemId, userId, reporterName, img, location, coordinates, details } = data;

  // Verify lost item exists
  const lostItem = await db.lostItem.findUnique({
    where: { id: lostItemId },
  });

  if (!lostItem) {
    throw new Error("Lost item not found");
  }

  let imageUrl = "";
  if (img && img.startsWith("data:")) {
    // Generate a temporary ID for the folder structure
    const tempId = `sighting-${Date.now()}`;
    imageUrl = await uploadBase64ToStorage(img, "sightings", tempId);
  }

  const sighting = await db.sighting.create({
    data: {
      lostItemId,
      userId: userId || null,
      reporterName: reporterName || "Anonymous",
      img: imageUrl,
      location,
      coordinates: coordinates || "",
      details: details || "",
      verifiedUserIds: [],
    },
    include: {
      user: {
        select: {
          username: true,
          userImg: true,
        },
      },
    },
  });

  return sighting;
};

const getSightingsForLostItem = async (lostItemId: string) => {
  const sightings = await db.sighting.findMany({
    where: { lostItemId },
    include: {
      user: {
        select: {
          username: true,
          userImg: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const TWO_HOURS = 2 * 60 * 60 * 1000;

  // Process and filter/map active status
  return (sightings as any[]).map((sighting) => {
    const timeSinceCreated = now.getTime() - new Date(sighting.createdAt).getTime();
    const timeSinceUpdated = now.getTime() - new Date(sighting.updatedAt).getTime();
    
    // Active if created in last 2 hours OR verified recently (updated in last 2 hours and has verifications)
    const isRecentlyCreated = timeSinceCreated < TWO_HOURS;
    const isRecentlyVerified = sighting.verifiedUserIds.length > 0 && timeSinceUpdated < TWO_HOURS;
    const isActive = isRecentlyCreated || isRecentlyVerified;

    // Calculate remaining hours/minutes until fading away
    let remainingMs = 0;
    if (isActive) {
      const baseTime = isRecentlyVerified ? sighting.updatedAt : sighting.createdAt;
      remainingMs = TWO_HOURS - (now.getTime() - new Date(baseTime).getTime());
    }

    return {
      id: sighting.id,
      lostItemId: sighting.lostItemId,
      userId: sighting.userId,
      reporterName: sighting.reporterName,
      img: sighting.img,
      location: sighting.location,
      coordinates: sighting.coordinates,
      details: sighting.details,
      verifiedUserIds: sighting.verifiedUserIds,
      createdAt: sighting.createdAt,
      updatedAt: sighting.updatedAt,
      user: sighting.user,
      isActive,
      remainingMinutes: Math.max(0, Math.floor(remainingMs / 60000)),
    };
  });
};

const verifySighting = async (sightingId: string, userId: string) => {
  const sighting = await db.sighting.findUnique({
    where: { id: sightingId },
  });

  if (!sighting) {
    throw new Error("Sighting not found");
  }

  if (sighting.userId === userId) {
    throw new Error("You cannot verify your own sighting report");
  }

  if (sighting.verifiedUserIds.includes(userId)) {
    throw new Error("You have already verified this sighting");
  }

  const updatedSighting = await db.sighting.update({
    where: { id: sightingId },
    data: {
      verifiedUserIds: {
        push: userId,
      },
    },
    include: {
      user: {
        select: {
          username: true,
          userImg: true,
        },
      },
    },
  });

  return updatedSighting;
};

const deleteSighting = async (sightingId: string) => {
  const sighting = await db.sighting.findUnique({
    where: { id: sightingId },
  });

  if (!sighting) {
    throw new Error("Sighting not found");
  }

  await db.sighting.delete({
    where: { id: sightingId },
  });

  return { success: true };
};

export const sightingService = {
  createSighting,
  getSightingsForLostItem,
  verifySighting,
  deleteSighting,
};
