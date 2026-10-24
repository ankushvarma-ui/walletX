import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { walletApi } from "../services/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

const POLL_MS = 15000;
const TOAST_MS = 6000;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if notification is an important event requiring popup toast
function isImportantEvent(notification) {
  if (!notification) return false;
  const type = (notification.type || "").toUpperCase();
  const title = (notification.title || "").toLowerCase();

  // Important types
  if (
    type === "TRANSFER_SENT" ||
    type === "TRANSFER_RECEIVED" ||
    type === "TRANSACTION_SUCCESS" ||
    type === "TRANSACTION_FAILED" ||
    type === "WALLET_CREATED" ||
    type === "SECURITY_UPDATE" ||
    type === "ACCOUNT_STATUS"
  ) {
    return true;
  }

  // Keywords in title
  if (
    title.includes("money") ||
    title.includes("sent") ||
    title.includes("received") ||
    title.includes("pin") ||
    title.includes("transfer") ||
    title.includes("security") ||
    title.includes("wallet")
  ) {
    return true;
  }

  return false;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [pushSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
  );
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // Track IDs shown so polling doesn't duplicate toasts
  const seenIds = useRef(new Set());
  const hasLoadedOnce = useRef(false);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ variant = "success", title, message }) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, variant, title, message }]);
      setTimeout(() => dismissToast(id), TOAST_MS);
    },
    [dismissToast]
  );

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await walletApi.notifications();
      const list = res.notifications || [];

      if (!hasLoadedOnce.current) {
        // Baseline load: seed seen IDs so old notifications don't trigger toasts
        list.forEach((n) => seenIds.current.add(n.id));
        hasLoadedOnce.current = true;
      } else {
        const freshUnread = list.filter(
          (n) => !seenIds.current.has(n.id) && !n.is_read
        );

        freshUnread.forEach((n) => {
          seenIds.current.add(n.id);
          // Only show popup for important events!
          if (isImportantEvent(n)) {
            showToast({
              variant: n.type?.includes("FAIL") ? "danger" : "success",
              title: n.title || "Transaction update",
              message: n.message,
            });
          }
        });

        list.forEach((n) => seenIds.current.add(n.id));
      }

      setNotifications(list);
      setError("");
    } catch (e) {
      if (!hasLoadedOnce.current) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!user) {
      hasLoadedOnce.current = false;
      seenIds.current = new Set();
      return;
    }

    void refreshNotifications();

    const interval = setInterval(refreshNotifications, POLL_MS);
    return () => clearInterval(interval);
  }, [user, refreshNotifications]);

  // Check push notification permission
  useEffect(() => {
    if (pushSupported && "Notification" in window && Notification.permission === "granted") {
      setPushSubscribed(true);
    }
  }, [pushSupported]);

  const subscribeToPushNotifications = useCallback(async () => {
    if (!pushSupported) {
      return { success: false, message: "Push notifications not supported in this browser." };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return { success: false, message: "Notification permission was denied." };
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        return { success: false, message: "VAPID key not configured." };
      }

      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // Send the standard PushSubscription object as expected by backend
      await walletApi.subscribePush(subscription.toJSON());
      setPushSubscribed(true);
      return { success: true, message: "Push notifications enabled successfully." };
    } catch (err) {
      console.warn("Push subscription failed:", err);
      return { success: false, message: err.message || "Failed to subscribe to push notifications." };
    }
  }, [pushSupported]);

  const markAsRead = useCallback(async (id) => {
    const prior = notifications;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await walletApi.readNotification(id);
    } catch {
      setNotifications(prior);
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    const prior = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await walletApi.readAllNotifications();
    } catch {
      setNotifications(prior);
    }
  }, [notifications]);

  const visibleNotifications = useMemo(
    () => (user ? notifications : []),
    [user, notifications]
  );
  const unreadCount = visibleNotifications.filter((n) => !n.is_read).length;

  const value = useMemo(
    () => ({
      notifications: visibleNotifications,
      unreadCount,
      loading,
      error,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      showToast,
      toasts,
      dismissToast,
      pushSupported,
      pushSubscribed,
      subscribeToPushNotifications,
    }),
    [
      visibleNotifications,
      unreadCount,
      loading,
      error,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      showToast,
      toasts,
      dismissToast,
      pushSupported,
      pushSubscribed,
      subscribeToPushNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
