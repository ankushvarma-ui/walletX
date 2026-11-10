import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import NotificationToast from "./NotificationToast";
import "./Shell.css";

const navItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    path: "/send",
    label: "Send money",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
  },
  {
    path: "/receive",
    label: "Receive",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    path: "/transactions",
    label: "Transactions",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    path: "/notifications",
    label: "Notifications",
    badge: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    path: "/profile",
    label: "Profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    path: "/security",
    label: "Security",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const pageTitleMap = {
  "/dashboard": "Dashboard",
  "/send": "Send money",
  "/receive": "Receive",
  "/transactions": "Transactions",
  "/statement": "Statement",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/security": "Security",
};

export default function Shell({ children }) {
  const { user, wallet, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/transactions?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const currentPageTitle = pageTitleMap[location.pathname] || "Dashboard";
  const userInitial = (user?.name || "M").charAt(0).toUpperCase();
  const displayWalletId = wallet?.walletId || "—";

  return (
    <div className="shell-root-layout">
      <NotificationToast />

      {mobileOpen && (
        <div
          className="shell-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ================= DARK NAVY SIDEBAR ================= */}
      <aside className={`shell-sidebar ${mobileOpen ? "open" : ""}`}>
        {/* Brand */}
        <div className="shell-sidebar-brand">
          <NavLink to="/dashboard" className="shell-brand-link" onClick={() => setMobileOpen(false)}>
            <div className="shell-brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="15" rx="3" fill="#2563eb" />
                <path
                  d="M17 12.5C17 11.6716 17.6716 11 18.5 11H22V14H18.5C17.6716 14 17 13.3284 17 12.5Z"
                  fill="#ffffff"
                />
              </svg>
            </div>
            <div>
              <span className="shell-brand-title">WalletX</span>
              <span className="shell-brand-subtitle">VIRTUAL WALLET</span>
            </div>
          </NavLink>
        </div>

        {/* Navigation items */}
        <nav className="shell-nav-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `shell-nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span className="shell-nav-icon">{item.icon}</span>
              <span className="shell-nav-label">{item.label}</span>

              {item.badge && unreadCount > 0 && (
                <span className="shell-nav-badge">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Wallet Active Card */}
        <div className="shell-wallet-status-card">
          <NavLink to="/security" className="shell-freeze-link">
            <span className="shell-ws-icon">❄️</span>
            <div>
              <strong>Wallet active</strong>
              <small>Freeze instantly if you lose access.</small>
            </div>
          </NavLink>
        </div>

        {/* User bar at bottom */}
        <div className="shell-user-bar">
          <div className="shell-user-avatar">{userInitial}</div>
          <div className="shell-user-info">
            <strong className="shell-user-name">{user?.name || "Member"}</strong>
            <small className="shell-user-wid">{displayWalletId}</small>
          </div>
          <button
            type="button"
            className="shell-btn-logout"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="shell-main-wrapper">
        {/* Top Header Bar */}
        <header className="shell-top-header">
          <div className="shell-header-left">
            <button
              type="button"
              className="shell-mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
            >
              ☰
            </button>

            <nav className="shell-breadcrumbs" aria-label="Breadcrumbs">
              <NavLink to="/dashboard" className="breadcrumb-root">
                WalletX
              </NavLink>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{currentPageTitle}</span>
            </nav>
          </div>

          <div className="shell-header-right">
            <form onSubmit={handleSearchSubmit} className="shell-search-box">
              <span className="shell-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search transactions, IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="shell-search-input"
              />
            </form>

            <NavLink
              to="/notifications"
              className="shell-bell-button"
              title="Notifications"
              aria-label="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className="shell-bell-indicator" />}
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <main className="shell-page-content">{children}</main>
      </div>
    </div>
  );
}
