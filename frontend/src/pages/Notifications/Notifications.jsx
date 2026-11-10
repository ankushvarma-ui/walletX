import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { animate } from "animejs";

import { useNotifications } from "../../context/NotificationContext";
import Alert from "../../components/Alert";

import "./Notifications.css";

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const navigate = useNavigate();
  const [selectedNotif, setSelectedNotif] = useState(null);

  const listRef = useRef(null);

  useEffect(() => {
    if (notifications.length > 0 && !selectedNotif) {
      setSelectedNotif(notifications[0]);
    } else if (notifications.length === 0) {
      setSelectedNotif(null);
    }
  }, [notifications, selectedNotif]);

  // Anime.js stagger on notification list
  useEffect(() => {
    if (!listRef.current || loading || !notifications.length) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    animate(listRef.current.querySelectorAll(".notif-card-item"), {
      opacity: [0, 1],
      translateY: [6, 0],
      delay: (el, i) => i * 35,
      duration: 250,
      ease: "outQuad",
    });
  }, [notifications, loading]);

  const handleSelectNotification = (n) => {
    setSelectedNotif(n);
    if (!n.is_read) {
      void markAsRead(n.id);
    }
  };

  const getIcon = (type = "") => {
    const t = String(type).toUpperCase();
    if (t.includes("RECEIVE") || t.includes("CREDIT")) {
      return <span className="notif-type-icon receive">↙</span>;
    }
    if (t.includes("FAIL") || t.includes("ERROR")) {
      return <span className="notif-type-icon failed">⊗</span>;
    }
    if (t.includes("FREEZE")) {
      return <span className="notif-type-icon freeze">❄️</span>;
    }
    return <span className="notif-type-icon device">🔔</span>;
  };

  return (
    <div className="notifications-page">
      {/* HEADER */}
      <header className="notif-page-header">
        <div>
          <h1 className="notif-page-title">Notifications</h1>
          <p className="notif-page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread` : "0 unread"} • Newest first
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="btn-mark-all-read"
            onClick={markAllAsRead}
          >
            ✓ Mark all read
          </button>
        )}
      </header>

      {error && <Alert>{error}</Alert>}

      {/* 2-COLUMN GRID */}
      <div className="notif-main-grid">
        {/* LEFT COLUMN: NOTIFICATION CARDS LIST */}
        <div className="notif-list-column">
          {loading ? (
            <div className="py-4 text-center text-muted">
              <small>Loading notifications from database…</small>
            </div>
          ) : notifications.length > 0 ? (
            <div ref={listRef} className="notif-cards-stack">
              {notifications.map((item) => {
                const isUnread = !item.is_read;
                const isSelected = selectedNotif?.id === item.id;

                return (
                  <div
                    key={item.id}
                    className={`notif-card-item ${isUnread ? "unread" : "read"} ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => handleSelectNotification(item)}
                  >
                    <div className="notif-icon-col">
                      {getIcon(item.type)}
                    </div>

                    <div className="notif-body-col">
                      <div className="notif-title-row">
                        <strong className="notif-title-text">{item.title}</strong>
                        {isUnread && <span className="notif-unread-dot" />}
                      </div>
                      <small className="notif-subtitle-text">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString("en-IN")
                          : "Just now"}
                      </small>
                    </div>

                    <div className="notif-chevron-col">›</div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Caught Up State (Accurate real database status) */}
          <div className="notif-caught-up-box">
            <span className="caught-up-icon">📥</span>
            <strong>You're all caught up</strong>
            <p>
              {notifications.length === 0
                ? "No notifications in the database yet."
                : "All notifications have been reviewed."}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILS CARD */}
        <div className="notif-details-column">
          <div className="notif-details-card">
            <h2 className="ndc-title">Details</h2>
            <p className="ndc-subtitle">Select any notification to see full context.</p>

            {selectedNotif ? (
              <>
                <div className="ndc-content-box">
                  <strong className="ndc-amount-header">
                    {selectedNotif.title}
                  </strong>
                  <small className="ndc-date-meta">
                    {selectedNotif.created_at
                      ? new Date(selectedNotif.created_at).toLocaleString("en-IN")
                      : "Recent"}
                  </small>

                  <p className="ndc-body-text">{selectedNotif.message}</p>
                </div>

                <button
                  type="button"
                  className="btn-ndc-view-tx"
                  onClick={() => navigate("/transactions")}
                >
                  View in Transactions
                </button>
              </>
            ) : (
              <div className="py-4 text-center text-muted">
                <p className="mb-0">Select a notification to view its message details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
