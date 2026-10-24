self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "WalletX", message: event.data.text() };
    }
  }

  const title = data.title || "WalletX Notification";
  const options = {
    body: data.message || "You have a new transaction update.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/notifications");
      }
    })
  );
});
