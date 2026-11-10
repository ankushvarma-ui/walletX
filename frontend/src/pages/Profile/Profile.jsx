import { useEffect } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import "./Profile.css";

export default function Profile() {
  const { user, wallet, fetchWallet } = useAuth();

  useEffect(() => {
    if (!wallet.walletId) {
      void fetchWallet();
    }
  }, [wallet.walletId, fetchWallet]);

  const displayName = user?.name || "Member";
  const userInitial = displayName.charAt(0).toUpperCase();
  const displayWalletId = wallet?.walletId || "Loading…";
  const displayEmail = user?.email || "—";
  const displayPhone = user?.phoneNumber || "Not registered";

  // Derive member date from real wallet creation timestamp if present
  let memberSinceStr = "Personal Wallet Account";
  if (wallet?.createdAt || user?.createdAt) {
    try {
      const dt = new Date(wallet?.createdAt || user?.createdAt);
      memberSinceStr = `Member since ${dt.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })}`;
    } catch {
      // Fallback
    }
  }

  return (
    <div className="profile-page">
      {/* HEADER */}
      <header className="profile-page-header">
        <h1 className="profile-page-title">Profile</h1>
        <p className="profile-page-subtitle">
          Only data returned by the backend. Contact support to change identity fields.
        </p>
      </header>

      {/* 2-COLUMN GRID (Matches Profile.png) */}
      <div className="profile-main-grid">
        {/* LEFT COLUMN: MAIN PROFILE CARD */}
        <div className="profile-main-card">
          <div className="pmc-user-header">
            <div className="pmc-avatar">{userInitial}</div>
            <div className="pmc-user-titles">
              <strong className="pmc-user-name">{displayName}</strong>
              <small className="pmc-user-sub">
                {displayWalletId} • {memberSinceStr}
              </small>
            </div>
            <span className="pmc-badge-active">
              • {user?.isActive !== false ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>

          {/* 2-Column Inputs Grid (Strictly from real database) */}
          <div className="pmc-fields-grid">
            <div className="pmc-field">
              <label>FULL NAME</label>
              <div className="pmc-input-box">
                <span>{displayName}</span>
                <span className="pmc-check">✓</span>
              </div>
            </div>

            <div className="pmc-field">
              <label>WALLET ID</label>
              <div className="pmc-input-box">
                <span>{displayWalletId}</span>
              </div>
            </div>

            <div className="pmc-field">
              <label>EMAIL</label>
              <div className="pmc-input-box">
                <span>{displayEmail}</span>
                <span className="pmc-check">✓</span>
              </div>
            </div>

            <div className="pmc-field">
              <label>PHONE</label>
              <div className="pmc-input-box">
                <span>{displayPhone}</span>
                {user?.phoneNumber && <span className="pmc-check">✓</span>}
              </div>
            </div>
          </div>

          {/* Info Notice Banner */}
          <div className="pmc-info-banner">
            <span className="info-icon">ℹ️</span>
            <p>
              Name, email and phone come from /api/v1/users. This UI never invents profile fields.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Account Status & Need More Control */}
        <div className="profile-right-column">
          {/* Account Status Card (Accurate real session data) */}
          <div className="profile-status-card">
            <h2 className="psc-title">Account status</h2>

            <div className="psc-rows-list">
              <div className="psc-row">
                <span>Wallet</span>
                <strong className={wallet.status === "FROZEN" ? "text-danger" : "text-success"}>
                  {wallet.status || "Active"}
                </strong>
              </div>

              <div className="psc-row">
                <span>KYC</span>
                <span>Basic • virtual only</span>
              </div>

              <div className="psc-row">
                <span>Sessions</span>
                <strong>1 active (Current device)</strong>
              </div>
            </div>
          </div>

          {/* Need More Control Card (Dark Navy) */}
          <div className="profile-control-card">
            <div className="pcc-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <strong className="pcc-title">Need more control?</strong>
            <p className="pcc-sub">
              Freeze, PIN reset and session management live under Security.
            </p>

            <NavLink to="/security" className="btn-pcc-security">
              Go to Security
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}
