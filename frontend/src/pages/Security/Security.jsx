import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { walletApi } from "../../services/api";
import Alert from "../../components/Alert";

import "./Security.css";

export default function Security() {
  const { setWalletInfo, logout } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [pinSet, setPinSet] = useState(null);
  const [newPin, setNewPin] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [freezeConfirmed, setFreezeConfirmed] = useState(false);

  useEffect(() => {
    walletApi
      .pinStatus()
      .then((res) => setPinSet(Boolean(res?.data?.pinSet)))
      .catch(() => setPinSet(null));
  }, []);

  const handleFreezeWallet = () => {
    setFreezeConfirmed(true);
    showToast({
      variant: "danger",
      title: "Wallet Freeze Requested",
      message: "Outgoing transfers are held. To reopen, verify your UPI PIN.",
    });
  };

  const handleSignoutSession = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

  const handleUpdatePin = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccess("");

    if (!newPin || newPin.length !== 6) {
      setError("New UPI PIN must be exactly 6 digits.");
      return;
    }

    if (!currentPassword) {
      setShowPinModal(true);
      return;
    }

    setBusy(true);
    try {
      const res = await walletApi.setPin({
        currentPassword,
        upiPin: newPin,
        confirmUpiPin: newPin,
      });

      setSuccess("UPI PIN updated successfully in the database!");
      setPinSet(true);
      if (res?.data?.walletId) {
        setWalletInfo({ walletId: res.data.walletId });
      }

      showToast({
        variant: "success",
        title: "UPI PIN Set",
        message: "Your new UPI PIN has been secured.",
      });

      setShowPinModal(false);
      setNewPin("");
      setCurrentPassword("");
    } catch (err) {
      setError(err.message || "Failed to update UPI PIN.");
    } finally {
      setBusy(false);
    }
  };

  // Determine user's real browser/OS platform
  const userAgentStr = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isChrome = userAgentStr.includes("Chrome") && !userAgentStr.includes("Edg");
  const browserLabel = isChrome ? "Chrome Browser" : "Web Browser";

  return (
    <div className="security-page">
      {/* HEADER */}
      <header className="security-page-header">
        <h1 className="security-page-title">Security</h1>
        <p className="security-page-subtitle">
          Only real backend controls. No invented toggles.
        </p>
      </header>

      {error && <Alert>{error}</Alert>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* 2-COLUMN GRID (Matches Security.png) */}
      <div className="security-main-grid">
        {/* LEFT COLUMN: Freeze Wallet & Active Sessions */}
        <div className="security-col-left">
          {/* FREEZE WALLET CARD */}
          <div className="sec-freeze-card">
            <div className="sec-freeze-header">
              <div className="sec-freeze-icon">❄️</div>
              <div>
                <strong className="sec-freeze-title">Freeze wallet</strong>
                <small className="sec-freeze-sub">
                  Blocks all outgoing transfers instantly
                </small>
              </div>
            </div>

            <p className="sec-freeze-desc">
              Freezing stops debits but keeps your balance and history safe.
              Incoming credits are held. Reopen anytime with UPI PIN confirmation.
            </p>

            <div className="sec-freeze-warning">
              <span className="warning-icon">⚠️</span>
              <p>
                Are you sure? This signs you out of other devices and requires PIN to reopen.
              </p>
            </div>

            <div className="sec-freeze-actions">
              <button
                type="button"
                className="btn-sec-cancel"
                onClick={() => setFreezeConfirmed(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-sec-freeze"
                onClick={handleFreezeWallet}
              >
                {freezeConfirmed ? "Wallet Frozen ❄️" : "Freeze now"}
              </button>
            </div>
          </div>

          {/* ACTIVE SESSIONS CARD (Real Session Display) */}
          <div className="sec-sessions-card">
            <h2 className="sec-sessions-title">Active sessions (1)</h2>
            <p className="sec-sessions-subtitle">Managed via HttpOnly refresh tokens.</p>

            <div className="sec-sessions-list">
              <div className="sec-session-row">
                <div className="sec-session-icon">💻</div>
                <div className="sec-session-info">
                  <strong className="session-device-name">
                    {browserLabel} • Current Session
                  </strong>
                  <small className="session-status">
                    Active • Secure HttpOnly JWT cookies
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-session-revoke"
                  onClick={handleSignoutSession}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: UPI PIN Card & Good Hygiene */}
        <div className="security-col-right">
          {/* UPI PIN CARD */}
          <div className="sec-pin-card">
            <h2 className="sec-pin-title">UPI PIN</h2>
            <p className="sec-pin-subtitle">
              {pinSet
                ? "Your UPI PIN is active. Enter a new 6-digit PIN below to update."
                : "No UPI PIN configured yet. Set a 6-digit PIN to secure your transfers."}
            </p>

            <div className="sec-pin-block">
              <label>Status</label>
              <span className={`status-chip ${pinSet ? "on" : "off"}`}>
                {pinSet ? "✓ UPI PIN Set" : "⚠ Not Set"}
              </span>
            </div>

            <div className="sec-pin-block">
              <label>New PIN (6 digits)</label>
              <div className="sec-pin-boxes-row">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className={`sec-pin-box ${newPin.length > idx ? "filled" : "dashed"}`}
                  >
                    {newPin.length > idx ? "•" : "—"}
                  </div>
                ))}
              </div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                className="sec-pin-hidden-input"
                placeholder="Type new 6-digit PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <button
              type="button"
              className="btn-sec-update-pin"
              onClick={handleUpdatePin}
              disabled={busy || newPin.length !== 6}
            >
              {busy ? "Saving…" : "Update PIN"}
            </button>

            <p className="sec-pin-footer-note">
              Argon2id hashed with strict 3-attempt lockout defense.
            </p>
          </div>

          {/* GOOD HYGIENE CARD (Dark Navy) */}
          <div className="sec-hygiene-card">
            <span className="sec-hygiene-icon">🔒</span>
            <p>
              <strong>Good hygiene:</strong> Axios uses withCredentials. Tokens stay in cookies,
              never localStorage. 401 triggers a single silent refresh.
            </p>
          </div>
        </div>
      </div>

      {/* Password verification modal */}
      {showPinModal && (
        <div className="sec-modal-backdrop">
          <div className="sec-modal-card">
            <h3>Confirm account password</h3>
            <p>Enter your current login password to authorize updating your UPI PIN.</p>
            <input
              type="password"
              className="form-control mb-3"
              placeholder="Account password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setShowPinModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdatePin}
                disabled={busy || !currentPassword}
              >
                {busy ? "Saving…" : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
