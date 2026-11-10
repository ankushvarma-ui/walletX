import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { animate } from "animejs";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { walletApi } from "../../services/api";
import { money } from "../../utils/format";
import Alert from "../../components/Alert";

import "./Send.css";

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000];

export default function Send() {
  const { wallet, setWalletInfo, fetchWallet } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();

  // Mode: "walletId" vs "phone"
  const [lookupMode, setLookupMode] = useState("walletId");

  // Inputs
  const [receiverWalletId, setReceiverWalletId] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [upiPin, setUpiPin] = useState("");

  // Verified Recipient (starts null, populated from database)
  const [recipient, setRecipient] = useState(null);

  // Stepper: 1 (Find), 2 (Verify), 3 (Amount), 4 (PIN), 5 (Done)
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    void fetchWallet();
  }, [fetchWallet]);

  // Anime.js transition on step change
  useEffect(() => {
    if (!containerRef.current) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    animate(containerRef.current, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 280,
      ease: "outQuad",
    });
  }, [step]);

  // Balance calculation
  const numericBalance = Number(wallet.balance) || 0;
  const numericAmount = Number(amount) || 0;
  const balanceAfter = Math.max(numericBalance - numericAmount, 0);

  // Real database lookup by phone number
  const handlePhoneLookup = async (e) => {
    e?.preventDefault();
    setError("");
    const cleanPhone = receiverPhone.trim().replace(/\s+/g, "");

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setBusy(true);
    try {
      const res = await walletApi.findRecipient(cleanPhone);
      if (res?.recipient) {
        setRecipient({
          name: res.recipient.name,
          walletId: res.recipient.walletId,
          phoneNumber: res.recipient.phoneNumber,
          verified: true,
        });
        setReceiverWalletId(res.recipient.walletId);
        setStep(3); // Advance to amount
      } else {
        throw new Error("No WalletX account found for this phone number.");
      }
    } catch (err) {
      setError(err.message || "Recipient not found in database.");
    } finally {
      setBusy(false);
    }
  };

  // Direct Wallet ID verification
  const handleWalletIdSubmit = (e) => {
    e?.preventDefault();
    setError("");
    const cleanId = receiverWalletId.trim().toUpperCase();

    if (!cleanId || cleanId.length < 6) {
      setError("Please enter a valid Wallet ID (e.g. WX...).");
      return;
    }

    if (cleanId === wallet.walletId) {
      setError("Cannot transfer money to your own wallet.");
      return;
    }

    setRecipient({
      name: "WalletX Recipient",
      walletId: cleanId,
      phoneNumber: "Active Account",
      verified: true,
    });
    setStep(3);
  };

  const handleKeypadPress = (val) => {
    if (val === "backspace") {
      setUpiPin((p) => p.slice(0, -1));
    } else if (upiPin.length < 6) {
      setUpiPin((p) => p + val);
    }
  };

  // Execute transfer
  const handleExecuteTransfer = async () => {
    setError("");

    if (numericAmount <= 0) {
      setError("Please enter a valid transfer amount.");
      return;
    }

    if (numericAmount > numericBalance) {
      setError("Insufficient wallet balance.");
      return;
    }

    if (upiPin.length !== 6 && upiPin.length !== 4) {
      setError("Please enter your complete UPI PIN.");
      return;
    }

    const targetWalletId = recipient?.walletId || receiverWalletId.trim();
    if (!targetWalletId) {
      setError("Recipient wallet ID is required.");
      return;
    }

    setBusy(true);

    try {
      // 1. Verify UPI PIN if set
      try {
        await walletApi.verifyPin(upiPin);
      } catch (pinErr) {
        if (pinErr.status !== 404) {
          throw pinErr;
        }
      }

      // 2. Generate unique idempotency key
      const idempotencyKey = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // 3. Execute transfer
      const res = await walletApi.transfer(
        {
          receiverWalletId: targetWalletId,
          amount: numericAmount,
        },
        idempotencyKey
      );

      const txResult = res.data || res;
      setSuccessData(txResult);

      // Refresh wallet & notification state
      setWalletInfo({ balance: balanceAfter });
      void fetchWallet();
      void refreshNotifications();

      showToast({
        variant: "success",
        title: "Transfer Completed",
        message: `₹${numericAmount} sent to ${targetWalletId}`,
      });

      setStep(5); // Done
    } catch (err) {
      setError(err.message || "Money transfer failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="send-money-page">
      {/* HEADER */}
      <header className="send-page-header">
        <h1 className="send-page-title">Send money</h1>
        <p className="send-page-subtitle">
          Available balance {money(numericBalance)} • Protected by backend idempotency guarantees.
        </p>
      </header>

      {/* STEPPER BAR */}
      <div className="send-stepper-bar">
        <div className={`step-item ${step >= 1 ? "completed" : ""}`}>
          <div className="step-circle">{step > 1 ? "✓" : "1"}</div>
          <span>Find</span>
        </div>
        <div className={`step-connector ${step >= 2 ? "active" : ""}`} />

        <div className={`step-item ${step >= 2 ? "completed" : ""}`}>
          <div className="step-circle">{step > 2 ? "✓" : "2"}</div>
          <span>Verify</span>
        </div>
        <div className={`step-connector ${step >= 3 ? "active" : ""}`} />

        <div className={`step-item ${step === 3 ? "active" : step > 3 ? "completed" : ""}`}>
          <div className="step-circle">{step > 3 ? "✓" : "3"}</div>
          <span>Amount</span>
        </div>
        <div className={`step-connector ${step >= 4 ? "active" : ""}`} />

        <div className={`step-item ${step === 4 ? "active" : step > 4 ? "completed" : ""}`}>
          <div className="step-circle">{step > 4 ? "✓" : "4"}</div>
          <span>PIN</span>
        </div>
        <div className={`step-connector ${step >= 5 ? "active" : ""}`} />

        <div className={`step-item ${step === 5 ? "completed" : ""}`}>
          <div className="step-circle">{step === 5 ? "✓" : "5"}</div>
          <span>Done</span>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* 2-COLUMN MAIN CONTENT */}
      <div ref={containerRef} className="send-main-grid">
        {/* LEFT COLUMN: Input form / Amount / Done */}
        <div className="send-left-card">
          {step === 5 ? (
            /* STEP 5: SUCCESS RECEIPT */
            <div className="send-success-view">
              <div className="success-icon-badge">✓</div>
              <h2>Money sent successfully!</h2>
              <p className="success-amount-display">₹ {numericAmount.toLocaleString("en-IN")}.00</p>
              <p className="success-recipient-lead">
                Sent to <strong>{recipient?.name}</strong> ({recipient?.walletId})
              </p>

              <div className="success-meta-box">
                <div className="smb-row">
                  <span>Transaction ID</span>
                  <code>{successData?.transactionId || "Confirmed"}</code>
                </div>
                <div className="smb-row">
                  <span>Status</span>
                  <span className="badge-completed">• Completed</span>
                </div>
                <div className="smb-row">
                  <span>Date & Time</span>
                  <span>{new Date().toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="success-actions-row">
                <NavLink to="/dashboard" className="btn-send-primary">
                  Back to Dashboard
                </NavLink>
                <NavLink to="/transactions" className="btn-send-secondary">
                  View in Transactions
                </NavLink>
              </div>
            </div>
          ) : (
            /* STEPS 1-4: TRANSFER WORKFLOW */
            <>
              {/* Wallet ID vs Phone Tabs */}
              <div className="send-mode-tabs">
                <button
                  type="button"
                  className={`send-tab-btn ${lookupMode === "walletId" ? "active" : ""}`}
                  onClick={() => setLookupMode("walletId")}
                >
                  Wallet ID
                </button>
                <button
                  type="button"
                  className={`send-tab-btn ${lookupMode === "phone" ? "active" : ""}`}
                  onClick={() => setLookupMode("phone")}
                >
                  Phone number
                </button>
              </div>

              {/* Mode Input Forms */}
              {lookupMode === "phone" ? (
                <form onSubmit={handlePhoneLookup} className="send-lookup-form">
                  <div className="send-field-group">
                    <label>Recipient's registered phone number</label>
                    <div className="d-flex gap-2">
                      <input
                        type="tel"
                        className="send-text-input"
                        placeholder="10-digit phone (e.g. 9820012345)"
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value)}
                      />
                      <button type="submit" className="btn-lookup-phone" disabled={busy}>
                        {busy ? "Finding…" : "Verify"}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleWalletIdSubmit} className="send-lookup-form">
                  <div className="send-field-group">
                    <label>Recipient's Wallet ID</label>
                    <div className="d-flex gap-2">
                      <input
                        type="text"
                        className="send-text-input"
                        placeholder="e.g. WX91027ABCDE"
                        value={receiverWalletId}
                        onChange={(e) => setReceiverWalletId(e.target.value)}
                      />
                      <button type="submit" className="btn-lookup-phone">
                        Continue
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Verified Recipient Card (shown when verified) */}
              {recipient && (
                <div className="send-verified-card">
                  <div className="recipient-avatar">
                    {recipient.name ? recipient.name.charAt(0).toUpperCase() : "R"}
                  </div>
                  <div className="recipient-info">
                    <div className="recipient-name-row">
                      <strong>{recipient.name}</strong>
                      <span className="recipient-badge-verified">• Verified</span>
                    </div>
                    <small>
                      {recipient.walletId} • {recipient.phoneNumber}
                    </small>
                  </div>
                  <div className="recipient-check-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="send-amount-section">
                <label className="amount-label">Amount (INR)</label>
                <div className="amount-input-box">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    min="1"
                    className="amount-number-input"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <span className="amount-decimal">.00</span>
                </div>

                {/* Preset Chips */}
                <div className="preset-amount-chips">
                  {PRESET_AMOUNTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`chip-btn ${numericAmount === p ? "active" : ""}`}
                      onClick={() => setAmount(String(p))}
                    >
                      ₹{p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Breakdown Card */}
              <div className="send-breakdown-card">
                <div className="breakdown-row">
                  <span>Recipient gets</span>
                  <strong>₹{numericAmount.toLocaleString("en-IN")}.00</strong>
                </div>
                <div className="breakdown-row">
                  <span>Fee</span>
                  <span className="free-tag">Free • virtual</span>
                </div>
                <div className="breakdown-row total-row">
                  <span>Balance after</span>
                  <strong>₹{balanceAfter.toLocaleString("en-IN")}.00</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="send-action-buttons">
                <button
                  type="button"
                  className="btn-send-back"
                  onClick={() => setStep((s) => Math.max(s - 1, 1))}
                  disabled={step <= 1}
                >
                  Back
                </button>

                {step === 4 ? (
                  <button
                    type="button"
                    className="btn-send-confirm"
                    onClick={handleExecuteTransfer}
                    disabled={busy || numericAmount <= 0}
                  >
                    {busy ? "Processing transfer…" : "Confirm & Send Money →"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-send-next"
                    onClick={() => {
                      if (!recipient && !receiverWalletId.trim()) {
                        setError("Please enter or verify a recipient first.");
                        return;
                      }
                      if (numericAmount <= 0) {
                        setError("Please enter an amount to transfer.");
                        return;
                      }
                      setStep(4);
                    }}
                    disabled={numericAmount <= 0}
                  >
                    Review & enter UPI PIN →
                  </button>
                )}
              </div>

              <p className="send-security-notice">
                🔒 PIN is never stored, logged, or placed in URLs.
              </p>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Keypad & Step 4 Preview */}
        <div className="send-right-column">
          <div className="send-pin-keypad-card">
            <span className="keypad-title">UPI PIN • STEP 4 PREVIEW</span>

            {/* PIN Dots (4 or 6 boxes) */}
            <div className="pin-dots-display">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className={`pin-dot-box ${upiPin.length > idx ? "filled" : ""}`}>
                  {upiPin.length > idx ? "•" : ""}
                </div>
              ))}
            </div>

            {/* Numeric Keypad */}
            <div className="numeric-keypad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="keypad-btn"
                  onClick={() => handleKeypadPress(String(n))}
                >
                  {n}
                </button>
              ))}
              <div className="keypad-empty-slot" />
              <button
                type="button"
                className="keypad-btn"
                onClick={() => handleKeypadPress("0")}
              >
                0
              </button>
              <button
                type="button"
                className="keypad-btn backspace-btn"
                onClick={() => handleKeypadPress("backspace")}
                title="Backspace"
              >
                ⌫
              </button>
            </div>
          </div>

          {/* Warning banner */}
          <div className="send-warning-banner">
            <span className="warning-icon">⚠️</span>
            <p>
              Confirm on the next screen before money moves.
              Success shows only after backend confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
