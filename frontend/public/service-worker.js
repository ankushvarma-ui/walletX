self.addEventListener("push", (event) => {
    if (!event.data) {
        return;
    }

    const data = event.data.json();

    const title = data.title || "WalletX";

    const options = {
        body: data.message || "You have a new notification.",

        icon: "/walletx-icon.png",

        badge: "/walletx-badge.png",

        data: data.data || {},

        tag: data.data?.type || "walletx-notification",

        requireInteraction: false,
    };

    event.waitUntil(
        self.registration.showNotification(
            title,
            options
        )
    );
});


self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true,
        }).then((clientList) => {

            // Focus existing WalletX tab
            for (const client of clientList) {
                if ("focus" in client) {
                    return client.focus();
                }
            }

            // Open WalletX if no tab exists
            if (clients.openWindow) {
                return clients.openWindow("/");
            }
        })
    );
});