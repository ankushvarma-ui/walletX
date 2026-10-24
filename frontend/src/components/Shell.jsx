import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import NotificationToast from "./NotificationToast";

const items = [
  ["/dashboard", "Dashboard", "⊞"],
  ["/send", "Send money", "↗"],
  ["/receive", "Receive money", "↙"],
  ["/transactions", "Transactions", "⇄"],
  ["/statement", "Statement", "▤"],
  ["/notifications", "Notifications", "🔔"],
  ["/security", "Security", "🛡"],
  ["/profile", "Profile", "👤"],
];

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const nav = useNavigate();

  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      nav("/login");
    }
  };

  const userInitial = (user?.name || "M").charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <NotificationToast />

      {open && (
        <div
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <NavLink to="/dashboard" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-dot" />
          <span>WALLETX</span>
        </NavLink>

        <div className="user-profile-badge">
          <div className="avatar-circle">{userInitial}</div>
          <div className="account-details">
            <p className="account-name">{user?.name || "Member"}</p>
            <p className="account-role">{user?.role || "Personal Wallet"}</p>
          </div>
        </div>

        <nav>
          {items.map(([url, name, icon]) => (
            <NavLink key={url} to={url} onClick={() => setOpen(false)}>
              <span className="nav-icon" aria-hidden="true">{icon}</span>
              <span>{name}</span>

              {url === "/notifications" && unreadCount > 0 && (
                <span className="badge bg-danger rounded-pill nav-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button className="logout" onClick={handleLogout}>
          <span aria-hidden="true">⇥</span>
          <span>Log out</span>
        </button>
      </aside>

      <header className="mobile-header">
        <button
          className="menu-button"
          aria-label="Open menu"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>

        <span className="brand">
          <span className="brand-dot" />
          <span>WALLETX</span>
        </span>

        {unreadCount > 0 && (
          <span className="badge bg-danger rounded-pill nav-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </header>

      <main className="content">{children}</main>
    </div>
  );
}
