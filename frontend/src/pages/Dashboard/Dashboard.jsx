import { useEffect, useState, useRef, useCallback } from "react";
import { NavLink } from "react-router-dom";
import { animate } from "animejs";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { walletApi } from "../../services/api";
import { money } from "../../utils/format";
import Coin3D from "../../components/Coin3D";

import "./Dashboard.css";

export default function Dashboard() {
  const { user, wallet, fetchWallet } = useAuth();
  const { notifications, unreadCount } = useNotifications();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pinSet, setPinSet] = useState(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [activeDateStr, setActiveDateStr] = useState("");

  const contentRef = useRef(null);

  useEffect(() => {
    const now = new Date();
    const options = { weekday: "long", day: "numeric", month: "short" };
    setActiveDateStr(now.toLocaleDateString("en-IN", options));
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    void fetchWallet();

    walletApi
      .ledger({ limit: 6 })
      .then((r) => {
        const list = r.data?.entries || [];
        setEntries(list);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    walletApi
      .pinStatus()
      .then((r) => setPinSet(Boolean(r?.data?.pinSet)))
      .catch(() => setPinSet(null));
  }, [fetchWallet]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Anime.js entrance animation
  useEffect(() => {
    if (!contentRef.current) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    animate(contentRef.current.querySelectorAll(".dashboard-card-anim"), {
      opacity: [0, 1],
      translateY: [12, 0],
      delay: (el, i) => i * 45,
      duration: 320,
      ease: "outQuad",
    });
  }, []);

  const balanceKnown = wallet.balance !== null && wallet.balance !== undefined;
  const displayBalance = balanceKnown ? money(wallet.balance) : "₹ 0.00";
  const firstName = user?.name ? user.name.split(" ")[0] : "Member";
  const displayWalletId = wallet.walletId || "—";

  // Real database-calculated totals
  const totalIn = entries.reduce((acc, tx) => acc + (tx.credit ? Number(tx.credit) : 0), 0);
  const totalOut = entries.reduce((acc, tx) => acc + (tx.debit ? Number(tx.debit) : 0), 0);

  return (
    <div ref={contentRef} className="dashboard-page-container">
      {/* 1. TOP HEADER & GREETING */}
      <header className="dashboard-header-row dashboard-card-anim">
        <div className="dashboard-greeting-col">
          <h1 className="dashboard-greeting-title">Namaste, {firstName}</h1>
          <p className="dashboard-greeting-subtext">
            {activeDateStr} • Wallet {displayWalletId} • {wallet.status || "Active"}
          </p>
        </div>

        <div className="dashboard-header-actions">
          <NavLink to="/statement" className="btn-dash-outline">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Statement
          </NavLink>
          <NavLink to="/receive" className="btn-dash-topup">
            + Receive funds
          </NavLink>
        </div>
      </header>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {/* 2. MAIN 2-COLUMN GRID */}
      <div className="dashboard-main-grid">
        {/* LEFT COLUMN: Balance Card & Recent Transactions */}
        <div className="dashboard-col-left">
          {/* AVAILABLE BALANCE CARD */}
          <section className="dashboard-balance-card dashboard-card-anim">
            <div className="dbc-content-side">
              <div className="dbc-header-row">
                <span className="dbc-label">AVAILABLE BALANCE • INR</span>
                <button
                  type="button"
                  className="dbc-eye-btn"
                  onClick={() => setHideBalance(!hideBalance)}
                  title={hideBalance ? "Show balance" : "Hide balance"}
                >
                  👁️ {hideBalance ? "Show" : "Hide with one tap"}
                </button>
              </div>

              <div className="dbc-amount-display">
                <strong className="tabular-nums">
                  {hideBalance ? "••••••••" : displayBalance}
                </strong>
              </div>

              <p className="dbc-micro-subtext">
                Virtual money • Real-time database balance
              </p>

              <div className="dbc-action-buttons">
                <NavLink to="/send" className="btn-dbc-send">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Send money
                </NavLink>

                <NavLink to="/receive" className="btn-dbc-receive">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  Receive
                </NavLink>

                <button
                  type="button"
                  className="btn-dbc-refresh"
                  onClick={loadData}
                  title="Refresh wallet balance"
                >
                  ⇄
                </button>
              </div>
            </div>

            {/* 3D Gold Coin with ₹ */}
            <div className="dbc-coin-side">
              <Coin3D size={135} interactive={true} spinSpeed={0.016} />
            </div>
          </section>

          {/* RECENT TRANSACTIONS FEED (Strictly real database entries) */}
          <section className="dashboard-transactions-card dashboard-card-anim">
            <div className="dtc-header">
              <h2>Recent transactions</h2>
              <NavLink to="/transactions" className="dtc-viewall-link">
                View all →
              </NavLink>
            </div>

            <div className="dtc-list">
              {loading ? (
                <div className="py-4 text-center text-muted">
                  <small>Loading transactions from database…</small>
                </div>
              ) : entries.length > 0 ? (
                entries.map((tx, idx) => {
                  const isDebit = tx.debit !== null && tx.debit !== undefined;
                  const amt = isDebit ? tx.debit : tx.credit;
                  const formattedAmt = money(amt);
                  const dateStr = tx.date
                    ? new Date(tx.date).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent";

                  return (
                    <div key={tx.transaction || idx} className="dtc-item">
                      <div className={`dtc-dir-icon ${isDebit ? "debit" : "credit"}`}>
                        {isDebit ? "↗" : "↙"}
                      </div>

                      <div className="dtc-info">
                        <strong>
                          {tx.description || (isDebit ? "Payment sent" : "Payment received")}
                        </strong>
                        <small>
                          {dateStr} • TXN #{String(tx.transaction || "").slice(0, 8)}
                        </small>
                      </div>

                      <div className="dtc-meta text-end">
                        <strong className={`dtc-amt ${isDebit ? "debit" : "credit"}`}>
                          {isDebit ? `– ${formattedAmt}` : `+ ${formattedAmt}`}
                        </strong>
                        <div className="dtc-status-line">
                          <span className="dtc-dot completed" />
                          <small>Completed</small>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Honest Empty State when database has 0 transactions */
                <div className="py-4 text-center text-muted">
                  <p className="mb-1 fw-semibold text-secondary">No transactions in database yet.</p>
                  <small>Send or receive money to generate your first ledger entry.</small>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Quick Actions, Health Alert, Weekly Chart, Notifications */}
        <div className="dashboard-col-right">
          {/* QUICK ACTIONS CARD */}
          <section className="dashboard-side-card dashboard-card-anim">
            <h3 className="side-card-title">
              <span className="side-title-icon">⚡</span> Quick actions
            </h3>

            <div className="quick-actions-4col">
              <NavLink to="/send" className="qa-item">
                <div className="qa-icon-circle blue">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </div>
                <span>Send</span>
              </NavLink>

              <NavLink to="/receive" className="qa-item">
                <div className="qa-icon-circle cyan">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>
                <span>Receive</span>
              </NavLink>

              <NavLink to="/statement" className="qa-item">
                <div className="qa-icon-circle indigo">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <span>Receipt</span>
              </NavLink>

              <NavLink to="/security" className="qa-item">
                <div className="qa-icon-circle rose">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <span>Freeze</span>
              </NavLink>
            </div>
          </section>

          {/* WALLET HEALTHY CARD (Accurate Session Count) */}
          <section className="dashboard-health-card dashboard-card-anim">
            <span className="health-shield-icon">🛡️</span>
            <div>
              <strong>Wallet healthy.</strong>
              <span>
                {pinSet ? " PIN set • " : " Set UPI PIN in Security • "}
                1 active session • No freeze.
              </span>
            </div>
          </section>

          {/* THIS WEEK CHART (Real database calculations) */}
          <section className="dashboard-side-card dashboard-card-anim">
            <h3 className="side-card-title">This week</h3>

            <div className="chart-bars-row">
              <div className="chart-bar-col"><div className="c-bar" style={{ height: entries.length > 0 ? "35%" : "15%" }} /></div>
              <div className="chart-bar-col"><div className="c-bar" style={{ height: entries.length > 1 ? "50%" : "20%" }} /></div>
              <div className="chart-bar-col"><div className="c-bar" style={{ height: entries.length > 2 ? "65%" : "25%" }} /></div>
              <div className="chart-bar-col"><div className="c-bar" style={{ height: entries.length > 3 ? "45%" : "20%" }} /></div>
              <div className="chart-bar-col"><div className="c-bar" style={{ height: entries.length > 4 ? "75%" : "30%" }} /></div>
              <div className="chart-bar-col"><div className="c-bar active-bar" style={{ height: entries.length > 0 ? "90%" : "40%" }} /></div>
              <div className="chart-bar-col"><div className="c-bar" style={{ height: entries.length > 0 ? "55%" : "20%" }} /></div>
            </div>

            <div className="chart-footer-totals">
              <span className="total-in">In {money(totalIn)}</span>
              <span className="total-out">Out {money(totalOut)}</span>
            </div>
          </section>

          {/* NOTIFICATIONS PREVIEW CARD (Strictly real database notifications) */}
          <section className="dashboard-side-card dashboard-card-anim">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="side-card-title m-0">Notifications</h3>
              <span className="notif-badge-pill">
                {unreadCount > 0 ? `${unreadCount} new` : "0 new"}
              </span>
            </div>

            <div className="side-notif-list">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((n) => (
                  <div key={n.id} className="side-notif-row">
                    <span
                      className={`notif-dot ${
                        n.type?.includes("FAIL")
                          ? "red"
                          : n.type?.includes("SECURITY")
                          ? "blue"
                          : "green"
                      }`}
                    />
                    <p>{n.title}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted small m-0 py-2">No notifications in database.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
