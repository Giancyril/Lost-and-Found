/* eslint-disable no-restricted-globals */

self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/nbsc-logo.png", // fallback icon
      badge: "/nbsc-logo.png",
      data: data.data,
      actions: [
        { action: "open", title: "View" },
        { action: "close", title: "Dismiss" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    const data = event.notification.data;
    let url = "/";
    
    if (data.type === "CHAT") {
      url = `/dashboard/chat?roomId=${data.chatRoomId}`;
    } else if (data.type === "MATCH") {
      url = `/found-item/${data.foundItemId}`;
    } else if (data.type === "CLAIM_UPDATE") {
      url = "/dashboard/my-claims";
    }

    event.waitUntil(
      self.clients.openWindow(url)
    );
  }
});
