import webpush from "web-push";
import prisma from "../../config/prisma";

// Setup VAPID keys
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || "";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "";

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    "mailto:example@yourdomain.org",
    publicVapidKey,
    privateVapidKey
  );
} else {
  console.warn("VAPID keys are not set. Push notifications will not work.");
}

const subscribeUser = async (userId: string, subscription: any) => {
  return await (prisma as any).pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
};

const unsubscribeUser = async (endpoint: string) => {
  return await (prisma as any).pushSubscription.delete({
    where: { endpoint },
  });
};

const sendNotificationToUser = async (userId: string, payload: any) => {
  const subscriptions = await (prisma as any).pushSubscription.findMany({
    where: { userId },
  });

  const notifications = subscriptions.map(async (sub: any) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    } catch (error: any) {
       if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired or no longer valid
        await (prisma as any).pushSubscription.delete({ where: { id: sub.id } });
      } else {
        console.error("Error sending push notification:", error);
      }
    }
  });

  await Promise.all(notifications);
};

export const pushService = {
  subscribeUser,
  unsubscribeUser,
  sendNotificationToUser,
};
