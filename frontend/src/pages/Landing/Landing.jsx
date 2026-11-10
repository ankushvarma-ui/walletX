import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { animate } from "animejs";

import Coin3D from "../../components/Coin3D";
import "./Landing.css";

export default function Landing() {
  const heroRef = useRef(null);
  const [balanceHidden, setBalanceHidden] = useState(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    if (heroRef.current) {
      animate(heroRef.current.children, {
        opacity: [0, 1],
        translateY: [18, 0],
        delay: (el, i) => i * 65,
        duration: 400,
        ease: "outQuad",
      });
    }
  }, []);

  return (
    <div className="walletx-landing-page">
      {/* 1. TOP NAVBAR (Matches WalletXLanding.png) */}
      <nav className="landing-navbar">
        <div className="landing-nav-container">
          <div className="landing-brand-group">
            <NavLink to="/" className="landing-brand-logo">
              <div className="landing-logo-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="15" rx="3" fill="#2563eb" />
                  <path
                    d="M17 12.5C17 11.6716 17.6716 11 18.5 11H22V14H18.5C17.6716 14 17 13.3284 17 12.5Z"
                    fill="#ffffff"
                  />
                </svg>
              </div>
              <span className="landing-brand-name">WalletX</span>
            </NavLink>
            <span className="landing-badge-virtual">VIRTUAL MONEY</span>
          </div>

          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#security">Security</a>
            <a href="#about">About</a>
          </div>

          <div className="landing-nav-actions">
            <NavLink to="/login" className="landing-link-login">
              Log in
            </NavLink>
            <NavLink to="/register" className="landing-btn-getstarted">
              Get Started
            </NavLink>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <header className="landing-hero-section">
        <div className="landing-hero-container">
          {/* Hero Left Content */}
          <div ref={heroRef} className="landing-hero-content">
            <div className="landing-hero-pill">
              <span className="pill-tag">New</span>
              <span>Idempotent transfers • UPI PIN secured • Instant receipts</span>
            </div>

            <h1 className="landing-hero-headline">
              Your Money.
              <br />
              Your Control.
              <br />
              <span className="hero-gradient-text">Your WalletX.</span>
            </h1>

            <p className="landing-hero-subtext">
              Experience a smarter way to manage virtual money.
              Send, receive, track, and secure your digital wallet with confidence.
            </p>

            <div className="landing-hero-buttons">
              <NavLink to="/register" className="btn-hero-primary">
                Get Started
              </NavLink>
              <a href="#features" className="btn-hero-secondary">
                Explore WalletX
              </a>
            </div>

            {/* Hero Stats */}
            <div className="landing-hero-stats">
              <div className="hero-stat-item">
                <strong>₹50,000.00</strong>
                <span>Example wallet balance • INR</span>
              </div>
              <div className="hero-stat-item">
                <strong>6-step</strong>
                <span>Guided send-money flow</span>
              </div>
              <div className="hero-stat-item">
                <strong>
                  <span className="stat-icon-shield">🛡️</span> Freeze
                </strong>
                <span>Instant wallet protection</span>
              </div>
            </div>
          </div>

          {/* Hero Right 3D Visual & Showcase */}
          <div className="landing-hero-visual-col">
            <div className="hero-3d-orbit-system">
              <div className="orbit-ring orbit-ring-outer" />
              <div className="orbit-ring orbit-ring-inner" />
              <div className="orbit-particle p1" />
              <div className="orbit-particle p2" />

              <span className="orbit-wallet-tag">WX • 8421 0093</span>

              {/* High-Performance 3D Coin */}
              <div className="hero-coin-centerpiece">
                <Coin3D size={220} interactive={true} spinSpeed={0.016} />
              </div>

              {/* Floating notification badges */}
              <div className="floating-badge badge-received">
                <div className="badge-icon-down">↙</div>
                <div>
                  <strong>+ ₹12,500.00</strong>
                  <small>Received</small>
                </div>
              </div>

              <div className="floating-badge badge-pin-locked">
                <span className="badge-shield">🛡️</span>
                <div>
                  <strong>UPI PIN locked</strong>
                  <small>Verified transfer</small>
                </div>
              </div>

              <div className="floating-balance-card">
                <div className="fbc-top">
                  <span>Available balance</span>
                </div>
                <strong className="fbc-amount">₹50,000.00</strong>
                <div className="fbc-actions">
                  <NavLink to="/send" className="fbc-btn-send">Send</NavLink>
                  <NavLink to="/receive" className="fbc-btn-receive">Receive</NavLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Ledger Ticker */}
        <div className="landing-ticker-strip">
          <div className="ticker-items">
            <span className="ticker-dot" />
            <span className="ticker-entry">TXN #884120 • +₹4,200.00 • Completed</span>
            <span className="ticker-entry">TXN #884119 • -₹1,150.00 • Completed</span>
            <span className="ticker-entry">TXN #884118 • +₹9,999.00 • Completed</span>
          </div>
          <NavLink to="/transactions" className="ticker-link">
            Live ledger preview →
          </NavLink>
        </div>

        {/* Feature Pills Strip */}
        <div className="landing-pills-bar">
          <span>VIRTUAL WALLET ONLY</span>
          <span>NO BANK CONNECTION</span>
          <span>JWT + HTTPONLY SESSION</span>
          <span>PDF RECEIPTS</span>
          <span>NOTIFICATION CENTER</span>
        </div>
      </header>

      {/* 3. FEATURES GRID SECTION (Matches WalletXLanding.png) */}
      <section id="features" className="landing-section-features">
        <div className="landing-section-header">
          <span className="section-eyebrow">WalletX features</span>
          <div className="features-title-row">
            <h2 className="section-headline">
              Everything a virtual wallet
              <br />
              should do. Nothing it
              <br />
              shouldn't.
            </h2>
            <p className="section-description">
              No fake credit cards, no investments, no bank
              claims. Just fast, transparent virtual-money tools.
            </p>
          </div>
        </div>

        <div className="features-cards-grid">
          <div className="feature-card">
            <div className="feature-icon-box blue-bg">✈️</div>
            <h3>Send with UPI PIN</h3>
            <p>
              Find anyone by Wallet ID or phone, confirm details, enter amount and UPI PIN.
              Duplicate taps are blocked.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box dark-bg">📱</div>
            <h3>Receive & share</h3>
            <p>
              Share your Wallet ID and phone with copy buttons and clear instructions for other WalletX users.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box green-bg">📄</div>
            <h3>Receipts & ledger</h3>
            <p>
              Every transfer gets a transaction ID, status timeline and downloadable PDF receipt when supported.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box amber-bg">🔔</div>
            <h3>Notifications that matter</h3>
            <p>
              Credit, debit and security alerts with read/unread states, empty and error handling built in.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box cyan-bg">🛡️</div>
            <h3>Freeze in one tap</h3>
            <p>
              Lost your phone? Freeze instantly to block debits, reopen when safe — with explicit confirmation dialogs.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box purple-bg">👁️‍🗨️</div>
            <h3>Privacy by design</h3>
            <p>
              HttpOnly cookies, no tokens in storage, PIN never in URLs or logs. Balance hides with one tap.
            </p>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS & PRODUCT PREVIEW SECTION */}
      <section id="how-it-works" className="landing-section-flow">
        <div className="flow-grid-container">
          {/* Left Flow Card */}
          <div className="flow-card-steps">
            <span className="flow-eyebrow">How virtual transfers work</span>
            <h2 className="flow-headline">Six calm steps. Zero guesswork.</h2>

            <div className="flow-steps-list">
              <div className="flow-step-item">
                <div className="step-icon">🔍</div>
                <div>
                  <small>STEP 01</small>
                  <strong>Find recipient by Wallet ID or phone</strong>
                </div>
              </div>

              <div className="flow-step-item">
                <div className="step-icon">✓</div>
                <div>
                  <small>STEP 02</small>
                  <strong>Verify name shown by the backend</strong>
                </div>
              </div>

              <div className="flow-step-item">
                <div className="step-icon">₹</div>
                <div>
                  <small>STEP 03</small>
                  <strong>Enter amount with balance check</strong>
                </div>
              </div>

              <div className="flow-step-item">
                <div className="step-icon">🔑</div>
                <div>
                  <small>STEP 04</small>
                  <strong>Confirm with UPI PIN</strong>
                </div>
              </div>

              <div className="flow-step-item">
                <div className="step-icon">⏳</div>
                <div>
                  <small>STEP 05</small>
                  <strong>Wait for backend confirmation</strong>
                </div>
              </div>

              <div className="flow-step-item">
                <div className="step-icon">📄</div>
                <div>
                  <small>STEP 06</small>
                  <strong>Get receipt & ledger entry</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="flow-card-preview">
            <div className="preview-top-bar">
              <strong>Product preview</strong>
              <span className="live-mock-chip">• Dashboard live mock</span>
            </div>

            {/* Live Mock Balance Box */}
            <div className="mock-balance-box">
              <div className="mock-bb-header">
                <span>AVAILABLE BALANCE • INR</span>
                <button
                  type="button"
                  className="mock-eye-toggle"
                  onClick={() => setBalanceHidden(!balanceHidden)}
                >
                  👁️ {balanceHidden ? "Show" : "Hide"}
                </button>
              </div>
              <strong className="mock-bb-sum">
                {balanceHidden ? "••••••••" : "₹50,000.00"}
              </strong>
              <div className="mock-bb-buttons">
                <NavLink to="/send" className="mock-btn-send">
                  Send money
                </NavLink>
                <NavLink to="/receive" className="mock-btn-receive">
                  Receive
                </NavLink>
              </div>
            </div>

            {/* Mock Transactions List */}
            <div className="mock-tx-list">
              <div className="mock-tx-row">
                <div className="mock-tx-icon red-arrow">↗</div>
                <div className="mock-tx-info">
                  <strong>Aarav Mehta • WX48210</strong>
                  <small>Today, 2:41 PM • Completed</small>
                </div>
                <span className="mock-tx-amount debit">– ₹2,400.00</span>
              </div>

              <div className="mock-tx-row">
                <div className="mock-tx-icon green-arrow">↙</div>
                <div className="mock-tx-info">
                  <strong>Salary top-up • Virtual</strong>
                  <small>Yesterday, 9:02 AM • Completed</small>
                </div>
                <span className="mock-tx-amount credit">+ ₹12,500.00</span>
              </div>

              <div className="mock-tx-row">
                <div className="mock-tx-icon red-arrow">↗</div>
                <div className="mock-tx-info">
                  <strong>Sana Kapoor • WX91027</strong>
                  <small>Mon, 6:18 PM • Completed</small>
                </div>
                <span className="mock-tx-amount debit">– ₹850.00</span>
              </div>
            </div>

            <div className="mock-honest-banner">
              <span className="honest-info-icon">ℹ️</span>
              <p>
                <strong>Honest by design:</strong> WalletX uses virtual money only.
                This preview shows example figures — your real balance comes from the backend after login.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECURITY & CONTROL SECTION */}
      <section id="security" className="landing-section-security">
        <div className="security-title-row">
          <div>
            <span className="section-eyebrow">Security & control</span>
            <h2 className="section-headline">
              Protection you can
              <br />
              actually understand.
            </h2>
          </div>
          <NavLink to="/security" className="btn-security-guide">
            Open security guide →
          </NavLink>
        </div>

        <div className="security-cards-grid">
          <div className="sec-card">
            <span className="sec-card-icon">🔒</span>
            <h3>UPI PIN for every debit</h3>
            <p>No PIN, no transfer. PINs are never stored or logged in the browser.</p>
          </div>

          <div className="sec-card">
            <span className="sec-card-icon">❄️</span>
            <h3>Freeze / reopen wallet</h3>
            <p>One action blocks outgoing transfers until you explicitly reopen.</p>
          </div>

          <div className="sec-card">
            <span className="sec-card-icon">🍪</span>
            <h3>HttpOnly sessions</h3>
            <p>Axios withCredentials, silent refresh, clean 401 handling. No token in localStorage.</p>
          </div>

          <div className="sec-card">
            <span className="sec-card-icon">📄</span>
            <h3>Transparent ledger</h3>
            <p>Search, filter, paginate and inspect every transaction with IDs and timestamps.</p>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="landing-section-cta">
        <div className="cta-banner-container">
          <div className="cta-text-side">
            <h2>Start your WalletX in minutes.</h2>
            <p>Register, verify your session, and explore the full wallet dashboard.</p>
          </div>
          <div className="cta-btn-side">
            <NavLink to="/register" className="btn-cta-create">
              Create account
            </NavLink>
            <NavLink to="/login" className="btn-cta-login">
              Log in
            </NavLink>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer id="about" className="landing-footer">
        <div className="footer-top-row">
          <div className="footer-brand-col">
            <div className="landing-brand-group">
              <div className="landing-logo-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="15" rx="3" fill="#2563eb" />
                  <path
                    d="M17 12.5C17 11.6716 17.6716 11 18.5 11H22V14H18.5C17.6716 14 17 13.3284 17 12.5Z"
                    fill="#ffffff"
                  />
                </svg>
              </div>
              <span className="landing-brand-name">WalletX</span>
            </div>
            <p className="footer-disclaimer">
              A virtual-money wallet for learning and demos.
              <br />
              Not a bank. No real UPI or bank transfers.
            </p>
          </div>

          <div className="footer-links-col">
            <h4>PRODUCT</h4>
            <a href="#features">Features</a>
            <NavLink to="/security">Security</NavLink>
            <NavLink to="/statement">Receipts</NavLink>
          </div>

          <div className="footer-links-col">
            <h4>ACCOUNT</h4>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register">Register</NavLink>
            <NavLink to="/security">Freeze wallet</NavLink>
          </div>

          <div className="footer-links-col">
            <h4>DEVELOPERS</h4>
            <a href="#api-mapping">API mapping</a>
            <a href="#status">Status</a>
            <a href="#support">Support</a>
          </div>
        </div>

        <div className="footer-bottom-row">
          <span>© 2026 WalletX • Virtual money only • Made for portfolios</span>
          <div className="footer-legal-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#disclosure">Responsible disclosure</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
