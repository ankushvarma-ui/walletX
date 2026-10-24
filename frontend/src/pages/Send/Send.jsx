import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { animate } from "animejs";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { walletApi } from "../../services/api";
import { money } from "../../utils/format";

import Alert from "../../components/Alert";
import Field from "../../components/Field";
import Page from "../../components/Page";

import "./Send.css";

const AMOUNT_PRESETS = [100, 500, 1000, 2000, 5000];

export default function Send() {
  const { wallet, setWalletInfo, fetchWallet } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();

  const [form, setForm] = useState({ receiverWalletId: "", amount: "" });
  // phases: "input" -> "review" -> "pin" -> "sending" -> "success"
  const [phase, setPhase] = useState("input");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [key, setKey] = useState(null);

  // Recipient lookup state
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [recipient, setRecipient] = useState(null);
  const searchIdRef = useRef(0);

  // UPI PIN state
  const [upiPin, setUpiPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSet, setPinSet] = useState(null);
  const [checkingPin, setCheckingPin] = useState(true);

  const phaseRef = useRef(null);

  useEffect(() => {
    walletApi
      .pinStatus()
      .then((res) => setPinSet(Boolean(res?.data?.pinSet)))
      .catch(() => setPinSet(false))
      .finally(() => setCheckingPin(false));
  }, []);

  // Anime.js phase transition
  useEffect(() => {
    if (!phaseRef.current) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const anim = animate(phaseRef.current, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 250,
      ease: "outQuad",
    });

    return () => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    };
  }, [phase]);

  const lookupRecipient = async (e) => {
    e.preventDefault();
    setLookupError("");
    setRecipient(null);

    const cleanPhone = lookupPhone.trim().replace(/\s+/g, "");
    if (!cleanPhone) {
      setLookupError("Please enter a phone number.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setLookupError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const currentSearchId = ++searchIdRef.current;
    setLookupBusy(true);

    try {
      const res = await walletApi.findRecipient(cleanPhone);
      // Cancel obsolete search results if user searched again
      if (currentSearchId !== searchIdRef.current) return;

      if (res?.recipient) {
        setRecipient(res.recipient);
        setForm((f) => ({ ...f, receiverWalletId: res.recipient.walletId }));
      }
    } catch (err) {
      if (currentSearchId !== searchIdRef.current) return;
      setLookupError(err.message || "Recipient not found.");
    } finally {
      if (currentSearchId === searchIdRef.current) {
        setLookupBusy(false);
      }
    }
  };

  const handleReview = (e) => {
    e.preventDefault();
    setError("");

    if (!form.receiverWalletId.trim()) {
      return setError("Receiver Wallet ID is required.");
    }

    if (form.receiverWalletId.trim() === wallet.walletId) {
      return setError("Cannot transfer money to your own wallet.");
    }

    const numAmount = Number(form.amount);
    if (!form.amount || Number.isNaN(numAmount) || numAmount <= 0) {
      return setError("Enter a valid amount greater than zero.");
    }

    if (wallet.balance !== null && numAmount > Number(wallet.balance)) {
      return setError(
        `Insufficient balance. You have ${money(wallet.balance)} available.`
      );
    }

    setError("");
    setPhase("review");
  };

  const proceedToPin = () => {
    if (!pinSet) {
      setError("Please set up your UPI PIN in Security before transferring money.");
      return;
    }
    setError("");
    setPinError("");
    setUpiPin("");
    // Generate fresh idempotency key for this intentional transfer attempt
    setKey(crypto.randomUUID());
    setPhase("pin");
  };

  const executeTransfer = async (e) => {
    e.preventDefault();
    setPinError("");

    if (!/^\d{6}$/.test(upiPin)) {
      setPinError("Enter your 6-digit UPI PIN.");
      return;
    }

    setPhase("sending");

    try {
      // Step 1: Verify UPI PIN
      await walletApi.verifyPin(upiPin);

      // Step 2: Send transfer request with Idempotency-Key
      const res = await walletApi.transfer(
        {
          receiverWalletId: form.receiverWalletId.trim(),
          amount: Number(form.amount),
        },
        key
      );

      setResult(res);
      setPhase("success");

      // Step 3: Refresh wallet & balance
      await fetchWallet();
      walletApi
        .ledger({ limit: 1 })
        .then((lr) => {
          const entry = lr.data?.entries?.[0];
          if (entry) setWalletInfo({ balance: entry.balance });
        })
        .catch(() => {});

      // Step 4: Show important notification popup
      showToast({
        variant: "success",
        title: "Money Sent",
        message: `${money(form.amount)} successfully transferred to ${form.receiverWalletId.trim()}.`,
      });

      // Step 5: Refresh notification inbox
      void refreshNotifications();
    } catch (err) {
      setUpiPin("");
      // Distinguish PIN verification errors from transfer failure
      if (err.status === 401 || err.status === 423) {
        setPinError(err.message);
        setPhase("pin");
      } else if (err.code === "TIMEOUT" || err.message?.toLowerCase().includes("timeout")) {
        // Never retry blindly after timeout! Inform user to check records.
        setError(
          "Request timed out on the network. Please do not retry immediately — check your Statement and Transactions to confirm if the transfer was processed."
        );
        setPhase("review");
      } else {
        setError(err.message || "Transaction failed.");
        setPhase("review");
      }

      showToast({
        variant: "danger",
        title: "Transaction Failed",
        message: err.message || "Transfer could not be completed.",
      });
    }
  };

  const resetForm = () => {
    setForm({ receiverWalletId: "", amount: "" });
    setRecipient(null);
    setLookupPhone("");
    setUpiPin("");
    setError("");
    setPinError("");
    setResult(null);
    setPhase("input");
  };

  return (
    <Page
      title="Send money"
      subtitle="Fast and secure virtual wallet transfers."
    >
      <section className="form-panel">
        <div className="transfer-steps mb-4">
          <div className={`step-item ${phase === "input" ? "active" : phase !== "input" ? "done" : ""}`}>
            <span className="step-num">1</span>
            <span className="step-text">Details</span>
          </div>
          <div className="step-divider" />
          <div className={`step-item ${phase === "review" ? "active" : (phase === "pin" || phase === "sending" || phase === "success") ? "done" : ""}`}>
            <span className="step-num">2</span>
            <span className="step-text">Review</span>
          </div>
          <div className="step-divider" />
          <div className={`step-item ${(phase === "pin" || phase === "sending") ? "active" : phase === "success" ? "done" : ""}`}>
            <span className="step-num">3</span>
            <span className="step-text">Authorize</span>
          </div>
          <div className="step-divider" />
          <div className={`step-item ${phase === "success" ? "active" : ""}`}>
            <span className="step-num">4</span>
            <span className="step-text">Receipt</span>
          </div>
        </div>

        {error && <Alert>{error}</Alert>}

        <div ref={phaseRef}>
          {/* Phase 4: Success Screen */}
          {phase === "success" && (
            <div className="success-state text-center py-4">
              <div className="success-checkmark mb-3">✓</div>
              <h2 className="mb-2">Transfer Successful</h2>
              <p className="text-muted mb-4">
                {result?.data?.duplicate
                  ? "This transfer was already processed. Showing original receipt."
                  : result?.message || "Your money transfer was completed securely."}
              </p>

              <div className="card p-3 mb-4 mx-auto text-start receipt-card" style={{ maxWidth: "420px" }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Amount Sent:</span>
                  <strong className="fs-5 text-primary tabular-nums">{money(form.amount)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Receiver Wallet:</span>
                  <code className="text-break">{form.receiverWalletId}</code>
                </div>
                {recipient?.name && (
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Recipient Name:</span>
                    <span className="fw-semibold">{recipient.name}</span>
                  </div>
                )}
                {result?.data?.transactionId && (
                  <div className="d-flex justify-content-between mb-0">
                    <span className="text-muted">Transaction ID:</span>
                    <small className="text-truncate ms-2" style={{ maxWidth: "180px" }}>
                      {result.data.transactionId}
                    </small>
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-center gap-2">
                <button className="btn btn-outline-primary" onClick={resetForm}>
                  Send another transfer
                </button>
                <NavLink className="btn btn-primary" to="/transactions">
                  View transactions →
                </NavLink>
              </div>
            </div>
          )}

          {/* Phase 3: Enter UPI PIN & Sending */}
          {(phase === "pin" || phase === "sending") && (
            <form onSubmit={executeTransfer}>
              <h2 className="mb-2">Enter UPI PIN</h2>
              <p className="text-muted mb-4">
                Authorize payment of <strong className="text-navy">{money(form.amount)}</strong> to{" "}
                <code>{form.receiverWalletId}</code>.
              </p>

              {pinError && <Alert>{pinError}</Alert>}

              <Field
                label="6-Digit UPI PIN"
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoComplete="off"
                placeholder="••••••"
                value={upiPin}
                onChange={(val) => setUpiPin(val.replace(/\D/g, "").slice(0, 6))}
              />

              <div className="d-flex gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={phase === "sending"}
                  onClick={() => setPhase("review")}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-grow-1"
                  disabled={phase === "sending" || upiPin.length !== 6}
                >
                  {phase === "sending" ? "Processing transfer…" : `Confirm & Pay ${money(form.amount)}`}
                </button>
              </div>
            </form>
          )}

          {/* Phase 2: Review Transaction */}
          {phase === "review" && (
            <div>
              <h2 className="mb-3">Review Transaction</h2>
              <dl className="confirm-list">
                <dt>Receiver Wallet ID</dt>
                <dd><code>{form.receiverWalletId}</code></dd>

                {recipient?.name && (
                  <>
                    <dt>Recipient Name</dt>
                    <dd>{recipient.name}</dd>
                  </>
                )}

                {recipient?.phoneNumber && (
                  <>
                    <dt>Recipient Phone</dt>
                    <dd>{recipient.phoneNumber}</dd>
                  </>
                )}

                <dt>Transfer Amount</dt>
                <dd className="fs-5 text-primary fw-bold tabular-nums">{money(form.amount)}</dd>

                {wallet.balance !== null && (
                  <>
                    <dt>Balance After Transfer</dt>
                    <dd className="tabular-nums">{money(Number(wallet.balance) - Number(form.amount))}</dd>
                  </>
                )}
              </dl>

              {!checkingPin && !pinSet && (
                <div className="alert alert-warning my-3">
                  <strong>UPI PIN required:</strong> You have not set a UPI PIN yet.
                  Please{" "}
                  <NavLink to="/security" className="alert-link">
                    set your UPI PIN in Security
                  </NavLink>{" "}
                  to complete transfers.
                </div>
              )}

              <div className="d-flex gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setPhase("input")}
                >
                  ← Edit
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-grow-1"
                  disabled={!pinSet}
                  onClick={proceedToPin}
                >
                  Proceed to UPI PIN →
                </button>
              </div>
            </div>
          )}

          {/* Phase 1: Input Recipient & Amount */}
          {phase === "input" && (
            <>
              {/* Phone Number Recipient Lookup */}
              <div className="lookup-row mb-4">
                <p className="lookup-label mb-2 fw-semibold">
                  Find recipient by phone number
                </p>
                <form className="d-flex gap-2" onSubmit={lookupRecipient}>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="10-digit mobile number"
                    value={lookupPhone}
                    onChange={(e) => {
                      setLookupPhone(e.target.value);
                      setLookupError("");
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-outline-primary"
                    disabled={lookupBusy || !lookupPhone.trim()}
                  >
                    {lookupBusy ? "Searching…" : "Search"}
                  </button>
                </form>

                {lookupError && (
                  <div className="mt-2 text-danger small">{lookupError}</div>
                )}

                {recipient && (
                  <div className="alert alert-success mt-2 mb-0 py-2 small">
                    Recipient found: <strong>{recipient.name}</strong> ({recipient.phoneNumber})
                    <br />
                    Wallet ID: <code>{recipient.walletId}</code>
                  </div>
                )}
              </div>

              <form onSubmit={handleReview}>
                <Field
                  label="Receiver Wallet ID"
                  placeholder="e.g. WX-XXXX-XXXX"
                  value={form.receiverWalletId}
                  onChange={(val) => {
                    setRecipient(null);
                    setForm({ ...form, receiverWalletId: val });
                  }}
                />

                <Field
                  label="Amount (₹)"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(val) => setForm({ ...form, amount: val })}
                />

                {/* Quick amount presets */}
                <div className="amount-presets mb-3 d-flex flex-wrap gap-2">
                  {AMOUNT_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="btn btn-sm btn-light preset-btn tabular-nums"
                      onClick={() => setForm({ ...form, amount: String(amt) })}
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted small tabular-nums">
                    {form.amount ? money(form.amount) : "Enter an amount"}
                  </span>
                  {wallet.balance !== null && (
                    <span className="text-muted small tabular-nums">
                      Available: <strong>{money(wallet.balance)}</strong>
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={!form.receiverWalletId || !form.amount}
                >
                  Review Transaction →
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </Page>
  );
}
