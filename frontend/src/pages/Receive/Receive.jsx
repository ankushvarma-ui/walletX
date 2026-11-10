import { useState, useEffect } from "react";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { walletApi } from "../../services/api";
import { money, entryIsCredit } from "../../utils/format";

import "./Receive.css";

export default function Receive() {
  const { wallet, user, fetchWallet } = useAuth();
  const { showToast } = useNotifications();

  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [shared, setShared] = useState(false);
  const [lastIncoming, setLastIncoming] = useState(null);

  useEffect(() => {
    if (!wallet.walletId) {
      void fetchWallet();
    }

    // Query real latest credit from database
    walletApi
      .ledger({ limit: 10 })
      .then((res) => {
        const list = res.data?.entries || [];
        const incoming = list.find(entryIsCredit);
        if (incoming) {
          setLastIncoming(incoming);
        }
      })
      .catch(() => {});
  }, [wallet.walletId, fetchWallet]);

  const displayWalletId = wallet.walletId || "—";
  const displayPhone = user?.phoneNumber || "Not registered";
  const displayName = user?.name || "Member";
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleCopyWalletId = async () => {
    if (!wallet.walletId) return;
    try {
      await navigator.clipboard.writeText(displayWalletId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      showToast({
        variant: "success",
        title: "Copied!",
        message: "Wallet ID copied to clipboard.",
      });
    } catch {
      // Fallback
    }
  };

  const handleCopyPhone = async () => {
    if (!user?.phoneNumber) return;
    try {
      await navigator.clipboard.writeText(displayPhone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
      showToast({
        variant: "success",
        title: "Copied!",
        message: "Phone number copied to clipboard.",
      });
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    const textToShare = `Pay me on WalletX! My Wallet ID is: ${displayWalletId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "WalletX Payment Details",
          text: textToShare,
        });
      } catch {
        // Cancelled
      }
    } else {
      await navigator.clipboard.writeText(textToShare);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
      showToast({
        variant: "success",
        title: "Details Copied",
        message: "Wallet details copied to clipboard.",
      });
    }
  };

  return (
    <div className="receive-money-page">
      {/* HEADER */}
      <header className="receive-page-header">
        <h1 className="receive-page-title">Receive money</h1>
        <p className="receive-page-subtitle">
          Share these details with another WalletX user. No QR — backend does not support it.
        </p>
      </header>

      {/* 2-COLUMN GRID (Matches ReceiveMoney.png) */}
      <div className="receive-main-grid">
        {/* LEFT COLUMN: YOUR WALLET CARD (Dark Navy Container) */}
        <div className="receive-wallet-card">
          <span className="rwc-eyebrow">YOUR WALLET CARD</span>

          <div className="rwc-user-row">
            <div className="rwc-avatar">{userInitial}</div>
            <div className="rwc-user-meta">
              <strong className="rwc-user-name">{displayName}</strong>
              <small className="rwc-user-since">
                {wallet.status || "Active"} • Personal Wallet
              </small>
            </div>
          </div>

          {/* Box 1: Wallet ID */}
          <div className="rwc-data-box">
            <div className="rwc-data-content">
              <span className="rwc-data-label">WALLET ID</span>
              <strong className="rwc-data-val">{displayWalletId}</strong>
            </div>
            <button
              type="button"
              className="btn-rwc-copy"
              onClick={handleCopyWalletId}
              disabled={!wallet.walletId}
              title="Copy Wallet ID"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copiedId ? "Copied" : "Copy"}
            </button>
          </div>

          {/* Box 2: Phone */}
          <div className="rwc-data-box">
            <div className="rwc-data-content">
              <span className="rwc-data-label">PHONE</span>
              <strong className="rwc-data-val">{displayPhone}</strong>
            </div>
            <button
              type="button"
              className="btn-rwc-copy"
              onClick={handleCopyPhone}
              disabled={!user?.phoneNumber}
              title="Copy Phone"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copiedPhone ? "Copied" : "Copy"}
            </button>
          </div>

          {/* Share Button */}
          <button
            type="button"
            className="btn-rwc-share"
            onClick={handleShare}
            disabled={!wallet.walletId}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            {shared ? "Details Copied to Clipboard!" : "Share wallet info"}
          </button>
        </div>

        {/* RIGHT COLUMN: Guide & Last Incoming Banner */}
        <div className="receive-right-col">
          {/* How sender pays card */}
          <div className="receive-guide-card">
            <h2 className="guide-card-title">How the sender pays you</h2>

            <div className="guide-steps-list">
              <div className="guide-step-row">
                <div className="guide-step-num">1</div>
                <p>They open Send money in their WalletX dashboard</p>
              </div>

              <div className="guide-step-row">
                <div className="guide-step-num">2</div>
                <p>They enter your Wallet ID ({displayWalletId}) or registered phone</p>
              </div>

              <div className="guide-step-row">
                <div className="guide-step-num">3</div>
                <p>They confirm your name, enter amount + verify UPI PIN</p>
              </div>

              <div className="guide-step-row">
                <div className="guide-step-num">4</div>
                <p>You receive the credit and updated ledger entry in real-time</p>
              </div>
            </div>
          </div>

          {/* Last incoming banner (Real database reflection) */}
          <div className="receive-incoming-banner">
            <div className="incoming-bell-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p>
              <strong>Last incoming: </strong>
              {lastIncoming ? (
                <>
                  +{money(lastIncoming.credit)} • TXN #{String(lastIncoming.transaction).slice(0, 8)}
                </>
              ) : (
                "No incoming transfers recorded yet."
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
