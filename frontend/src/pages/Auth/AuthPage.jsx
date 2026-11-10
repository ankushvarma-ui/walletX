import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { animate } from "animejs";

import { useAuth } from "../../context/AuthContext";
import { walletApi } from "../../services/api";
import Coin3D from "../../components/Coin3D";
import Alert from "../../components/Alert";

import "./AuthPage.css";

export default function AuthPage({ register: isRegister }) {
  const navigate = useNavigate();
  const { login, register, user, loading } = useAuth();
  const formRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    emailOrPhone: "",
    email: "",
    phoneNumber: "",
    password: "",
    upiPin: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  // Anime.js form card entrance animation
  useEffect(() => {
    if (!formRef.current) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const anim = animate(formRef.current, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 350,
      ease: "outQuad",
    });

    return () => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    };
  }, [isRegister]);

  // Password validation checks
  const hasMinLength = form.password.length >= 8;
  const hasNumber = /\d/.test(form.password);
  const hasSymbol = /[^A-Za-z0-9]/.test(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      if (isRegister) {
        if (!form.name.trim()) throw new Error("Full name is required.");
        if (!form.phoneNumber.trim()) throw new Error("Phone number is required.");
        if (!form.email.trim()) throw new Error("Email address is required.");
        if (!form.password) throw new Error("Password is required.");
        if (!hasMinLength) throw new Error("Password must be at least 8 characters.");

        // Register user
        await register({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phoneNumber: form.phoneNumber.trim().replace(/\s+/g, ""),
          password: form.password,
        });

        // If user provided a 6-digit UPI PIN, log in and set it immediately
        if (form.upiPin.length === 6) {
          try {
            await login({
              email: form.email.trim().toLowerCase(),
              password: form.password,
            });

            await walletApi.setPin({
              currentPassword: form.password,
              upiPin: form.upiPin,
              confirmUpiPin: form.upiPin,
            });

            navigate("/dashboard");
            return;
          } catch {
            // Fall through to standard redirect
          }
        }

        setNotice("Wallet created successfully! Redirecting to login…");
        setTimeout(() => navigate("/login"), 900);
      } else {
        const identifier = form.emailOrPhone.trim();
        if (!identifier) throw new Error("Please enter your email or phone number.");
        if (!form.password) throw new Error("Please enter your password.");

        await login({
          email: identifier.toLowerCase(),
          password: form.password,
        });

        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-split-layout">
      {/* LEFT BRAND PANEL (Matches Login.png and Register.png) */}
      <section className="auth-brand-panel">
        <NavLink className="auth-brand-logo" to="/">
          <div className="auth-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="15" rx="3" fill="#2563eb" />
              <path
                d="M17 12.5C17 11.6716 17.6716 11 18.5 11H22V14H18.5C17.6716 14 17 13.3284 17 12.5Z"
                fill="#ffffff"
              />
            </svg>
          </div>
          <span className="auth-logo-text">WalletX</span>
        </NavLink>

        <div className="auth-coin-showcase">
          <Coin3D size={200} interactive={true} spinSpeed={0.015} />

          <h2 className="auth-showcase-title">
            Virtual money, handled with care.
          </h2>

          <p className="auth-showcase-lead">
            UPI PIN-secured transfers, transparent ledger, instant freeze.
            No banks, no fine print.
          </p>

          <div className="auth-badges-row">
            <span className="auth-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              PIN locked
            </span>
            <span className="auth-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              PDF receipts
            </span>
            <span className="auth-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Idempotent
            </span>
          </div>
        </div>

        <div className="auth-brand-footer">
          WalletX is a virtual-money demo. Not a bank.
        </div>
      </section>

      {/* RIGHT FORM PANEL (Matches Login.png and Register.png) */}
      <section className="auth-form-panel">
        <div ref={formRef} className="auth-form-container">
          <header className="auth-form-header">
            <h1 className="auth-form-title">
              {isRegister ? "Create your wallet" : "Welcome back"}
            </h1>
            <p className="auth-form-subtitle">
              {isRegister
                ? "Only the fields the backend needs. Nothing extra."
                : "Log in to access your virtual wallet. Sessions restore via secure cookies."}
            </p>
          </header>

          {error && <Alert>{error}</Alert>}
          {notice && <div className="alert alert-success">{notice}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {isRegister ? (
              <>
                <div className="auth-row-2col">
                  <div className="auth-field">
                    <label htmlFor="reg-name">Full name</label>
                    <input
                      id="reg-name"
                      type="text"
                      className="auth-input"
                      placeholder="Aarav Mehta"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <label htmlFor="reg-phone">Phone</label>
                    <div className="auth-input-wrapper">
                      <input
                        id="reg-phone"
                        type="tel"
                        className="auth-input"
                        placeholder="+91 98200 12345"
                        value={form.phoneNumber}
                        onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                        required
                      />
                      {form.phoneNumber.trim().length >= 10 && (
                        <span className="auth-input-success-icon">✓</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="reg-email">Email</label>
                  <input
                    id="reg-email"
                    type="email"
                    className="auth-input"
                    placeholder="you@example.in"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="auth-row-2col">
                  <div className="auth-field">
                    <label htmlFor="reg-password">Password</label>
                    <div className="auth-input-wrapper">
                      <input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        className="auth-input"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  <div className="auth-field">
                    <label>Set UPI PIN (4–6 digits)</label>
                    <div className="auth-pin-boxes">
                      {[0, 1, 2, 3, 4, 5].map((idx) => {
                        const digit = form.upiPin[idx];
                        return (
                          <div
                            key={idx}
                            className={`auth-pin-box ${digit ? "filled" : ""}`}
                          >
                            {digit ? "•" : ""}
                          </div>
                        );
                      })}
                    </div>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      className="auth-pin-hidden-input"
                      value={form.upiPin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setForm({ ...form, upiPin: val });
                      }}
                      placeholder="Enter 6-digit PIN"
                    />
                  </div>
                </div>

                {/* Password strength indicators */}
                <div className="auth-strength-chips">
                  <span className={`auth-chip ${hasMinLength ? "valid" : ""}`}>
                    {hasMinLength ? "✓" : "✗"} 8+ chars
                  </span>
                  <span className={`auth-chip ${hasNumber ? "valid" : ""}`}>
                    {hasNumber ? "✓" : "✗"} Number
                  </span>
                  <span className={`auth-chip ${hasSymbol ? "valid" : ""}`}>
                    {hasSymbol ? "✓" : "✗"} Symbol
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="auth-field">
                  <label htmlFor="login-identity">Email or phone</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="login-identity"
                      type="text"
                      className="auth-input"
                      placeholder="aarav@example.in"
                      value={form.emailOrPhone}
                      onChange={(e) => setForm({ ...form, emailOrPhone: e.target.value })}
                      required
                    />
                    {form.emailOrPhone.trim().length > 3 && (
                      <span className="auth-input-success-icon">✓</span>
                    )}
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="login-password">Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      className="auth-input"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={busy}
            >
              {busy
                ? isRegister
                  ? "Creating wallet…"
                  : "Logging in securely…"
                : isRegister
                ? "Create virtual wallet"
                : "Log in securely"}
            </button>
          </form>

          <footer className="auth-form-footer">
            <div className="auth-switch-links">
              {isRegister ? (
                <span>
                  Already have an account?{" "}
                  <NavLink to="/login" className="auth-link">
                    Log in
                  </NavLink>
                </span>
              ) : (
                <>
                  <span>
                    New to WalletX?{" "}
                    <NavLink to="/register" className="auth-link">
                      Create account
                    </NavLink>
                  </span>
                  <span className="auth-help-link">Need help?</span>
                </>
              )}
            </div>

            <div className="auth-security-divider">
              <span>PROTECTED BY UPI PIN + HTTPONLY SESSION</span>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
