import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import Page from "../../components/Page";

import "./Receive.css";

export default function Receive() {
  const { wallet, user, fetchWallet } = useAuth();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!wallet.walletId) {
      void fetchWallet();
    }
  }, [wallet.walletId, fetchWallet]);

  const handleCopy = async () => {
    if (!wallet.walletId) return;
    try {
      await navigator.clipboard.writeText(wallet.walletId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <Page
      title="Receive money"
      subtitle="Share your Wallet ID or phone number to receive money instantly."
    >
      <section className="receive-card">
        <div className="wallet-mark" aria-hidden="true">W</div>

        <p className="receive-label mb-1">Your Wallet ID</p>

        <div className="wallet-chip-container mb-3">
          <code className="wallet-id-chip fs-5 py-2 px-3">
            {wallet.walletId || "Loading Wallet ID…"}
          </code>
        </div>

        <button
          className="btn btn-primary mb-3"
          disabled={!wallet.walletId}
          onClick={handleCopy}
        >
          {copied ? "✓ Copied to clipboard" : "Copy Wallet ID"}
        </button>

        {user?.phoneNumber && (
          <div className="p-3 bg-light rounded border w-100 mb-3 text-start">
            <span className="d-block text-muted small mb-1">Direct Mobile Lookup</span>
            <span className="fw-semibold text-navy">{user.phoneNumber}</span>
            <p className="text-muted small mt-1 mb-0">
              Other WalletX users can find and pay you directly using this registered phone number.
            </p>
          </div>
        )}

        {!wallet.walletId && (
          <div className="alert alert-info py-2 px-3 small w-100">
            ℹ If your Wallet ID is not displayed yet, complete a transfer or configure your{" "}
            <Link to="/security" className="alert-link">
              UPI PIN in Security
            </Link>{" "}
            to initialize your credentials.
          </div>
        )}
      </section>
    </Page>
  );
}
