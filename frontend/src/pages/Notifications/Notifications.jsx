import { useState, useEffect, useRef } from "react";
import { animate } from "animejs";
import { useNotifications } from "../../context/NotificationContext";
import { relativeTime } from "../../utils/format";

import Alert from "../../components/Alert";
import EmptyState from "../../components/EmptyState";
import Page from "../../components/Page";

import "./Notifications.css";

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    pushSupported,
    pushSubscribed,
    subscribeToPushNotifications,
  } = useNotifications();

  const [pushStatusMsg, setPushStatusMsg] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const listRef = useRef(null);

  // Subtle Anime.js entrance for notification cards
  useEffect(() => {
    if (loading || !notifications.length || !listRef.current) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const items = listRef.current.querySelectorAll(".notification");
    if (!items.length) return;

    const anim = animate(items, {
      opacity: [0, 1],
      translateY: [8, 0],
      delay: (el, i) => i * 35,
      duration: 260,
      ease: "outQuad",
    });

    return () => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    };
  }, [notifications, loading]);

  const handleEnablePush = async () => {
    setSubscribing(true);
    setPushStatusMsg("");
    const result = await subscribeToPushNotifications();
    setPushStatusMsg(result.message);
    setSubscribing(false);
  };

  return (
    <Page
      title="Notifications"
      subtitle="Stay updated on your transfers, security, and wallet status."
    >
      <section className="panel">
        <div className="panel-title notifications-head d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <h2 className="mb-0">Notifications</h2>
            {unreadCount > 0 && (
              <span className="badge bg-danger rounded-pill">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            {unreadCount > 0 && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Push Notification Banner */}
        {pushSupported && (
          <div className="alert alert-light border d-flex justify-content-between align-items-center mb-3 p-2 px-3">
            <div>
              <span className="fw-semibold">Browser Push Notifications: </span>
              <span className="text-muted small">
                {pushSubscribed
                  ? "✓ Enabled on this device"
                  : "Receive instant updates when money is received"}
              </span>
            </div>
            {!pushSubscribed && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleEnablePush}
                disabled={subscribing}
              >
                {subscribing ? "Enabling…" : "Enable Push"}
              </button>
            )}
          </div>
        )}

        {pushStatusMsg && (
          <div className="alert alert-info py-2 small mb-3">{pushStatusMsg}</div>
        )}

        {error ? (
          <Alert>{error}</Alert>
        ) : loading ? (
          <div className="skeleton-lines">
            <i />
            <i />
            <i />
          </div>
        ) : notifications.length ? (
          <div className="notification-list" ref={listRef}>
            {notifications.map((n) => (
              <article
                key={n.id}
                className={`notification ${n.is_read ? "" : "unread"}`}
              >
                <div className="notification-head d-flex justify-content-between align-items-start">
                  <div>
                    <strong className="d-flex align-items-center gap-2">
                      {!n.is_read && <span className="notification-dot" />}
                      {n.title || "Notification"}
                    </strong>
                    <p className="mb-1 mt-1 text-secondary">{n.message}</p>
                    <small className="text-muted">{relativeTime(n.created_at)}</small>
                  </div>

                  {!n.is_read && (
                    <button
                      className="btn btn-outline-primary btn-sm ms-2"
                      onClick={() => markAsRead(n.id)}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState text="You have no notifications yet." />
        )}
      </section>
    </Page>
  );
}
