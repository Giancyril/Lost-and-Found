import { useEffect, useState } from "react";
import { useGetVapidPublicKeyQuery, useSubscribeToPushMutation } from "../redux/api/pushApi";

export const usePushNotifications = () => {
  const { data: publicKeyRes } = useGetVapidPublicKeyQuery(undefined);
  const [subscribeToPush] = useSubscribeToPushMutation();
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications are not supported by this browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.register("/sw.js");
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      const publicKey = publicKeyRes?.data;
      if (!publicKey) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await subscribeToPush(subscription).unwrap();
      console.log("Successfully subscribed to push notifications");
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
    }
  };

  const isSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

  return { permission, subscribe, isSupported };
};
