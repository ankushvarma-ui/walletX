import { useEffect, useState, useRef } from "react";
import { animate } from "animejs";
import { useAuth } from "../../context/AuthContext";
import Page from "../../components/Page";

import "./Profile.css";

export default function Profile() {
  const { user, wallet, fetchWallet } = useAuth();
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!wallet.walletId) {
      void fetchWallet();
    }
  }, [wallet.walletId, fetchWallet]);

  useEffect(() => {
    if (!cardRef.current) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const anim = animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 300,
      ease: "outQuad",
    });

    return () => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    };
  }, []);

  const handleCopyWalletId = () => {
    if (!wallet.walletId) return;
    void navigator.clipboard?.writeText(wallet.walletId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <Page title="Profile" subtitle="Your WalletX account details and status.">
      <section className="panel profile-panel" ref={cardRef}>
        <div className="profile-header mb-4">
          <div className="profile-avatar">{initial}</div>
          <div>
            <h3 className="profile-name mb-0">{user?.name || "Wallet User"}</h3>
            <span className="profile-email text-muted">{user?.email || "—"}</span>
          </div>
        </div>

        <dl className="profile-details">
          <dt>Full Name</dt>
          <dd>{user?.name || "—"}</dd>

          <dt>Email Address</dt>
          <dd>{user?.email || "—"}</dd>

          {user?.phoneNumber && (
            <>
              <dt>Phone Number</dt>
              <dd>{user.phoneNumber}</dd>
            </>
          )}

          <dt>Account Role</dt>
          <dd className="text-capitalize">{user?.role || "user"}</dd>

          <dt>Account Status</dt>
          <dd>
            <span className={`status-chip ${user?.isActive ? "on" : "off"}`}>
              {user?.isActive ? "Active" : "Inactive"}
            </span>
          </dd>

          <dt>Wallet ID</dt>
          <dd>
            {wallet.walletId ? (
              <div className="d-inline-flex align-items-center gap-2">
                <code className="wallet-id-chip">{wallet.walletId}</code>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary py-0 px-2"
                  onClick={handleCopyWalletId}
                  title="Copy Wallet ID"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            ) : (
              <span className="text-muted">Loading…</span>
            )}
          </dd>

          <dt>Wallet Status</dt>
          <dd className="text-capitalize">{wallet.status || "Active"}</dd>
        </dl>
      </section>
    </Page>
  );
}
