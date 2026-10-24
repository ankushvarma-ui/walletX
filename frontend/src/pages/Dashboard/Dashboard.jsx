import { useEffect, useState, useRef, useCallback } from "react";
import { NavLink } from "react-router-dom";
import * as THREE from "three";
import { animate } from "animejs";

import { useAuth } from "../../context/AuthContext";
import { walletApi } from "../../services/api";
import { money } from "../../utils/format";

import Page from "../../components/Page";
import LedgerCard from "../../components/LedgerCard";

import "./Dashboard.css";

function ThreeBalanceMicroCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // WebGL check
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        window.WebGLRenderingContext &&
        (testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl"));
      if (!gl) return;
    } catch {
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const width = 85;
    const height = 85;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.8;

    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);
    } catch {
      return;
    }

    // Geometry: 3D Diamond / Octahedron
    const geometry = new THREE.OctahedronGeometry(1.2, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x6ba4ff,
      metalness: 0.9,
      roughness: 0.15,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
      return () => {
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    }

    let animId = null;
    let isHidden = false;

    const renderLoop = () => {
      if (isHidden) return;
      mesh.rotation.x += 0.012;
      mesh.rotation.y += 0.016;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    const handleVisibility = () => {
      if (document.hidden) {
        isHidden = true;
        if (animId) cancelAnimationFrame(animId);
      } else {
        isHidden = false;
        animId = requestAnimationFrame(renderLoop);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      document.removeEventListener("visibilitychange", handleVisibility);
      geometry.dispose();
      material.dispose();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  return <div ref={mountRef} className="balance-micro-canvas" aria-hidden="true" />;
}

export default function Dashboard() {
  const { user, wallet, fetchWallet } = useAuth();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pinSet, setPinSet] = useState(null);
  const [copied, setCopied] = useState(false);

  const quickGridRef = useRef(null);

  const loadData = useCallback(() => {
    setLoading(true);
    void fetchWallet();

    walletApi
      .ledger({ limit: 5 })
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

  // Anime.js staggered entrance for quick action cards
  useEffect(() => {
    if (!quickGridRef.current) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const anim = animate(quickGridRef.current.children, {
      opacity: [0, 1],
      translateY: [8, 0],
      delay: (el, i) => i * 45,
      duration: 280,
      ease: "outQuad",
    });

    return () => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    };
  }, []);

  const handleCopyWalletId = async () => {
    if (!wallet.walletId) return;
    try {
      await navigator.clipboard.writeText(wallet.walletId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const balanceKnown = wallet.balance !== null && wallet.balance !== undefined;

  return (
    <Page
      title={`Hello, ${user?.name || "Member"}`}
      subtitle="Here is your real-time WalletX balance and activity."
    >
      {error && <div className="alert alert-danger">{error}</div>}

      <section className="balance-card">
        <div className="balance-card-header">
          <div>
            <span className="balance-label">Available balance</span>
            <strong className="tabular-nums">
              {balanceKnown ? money(wallet.balance) : "₹ 0.00"}
            </strong>
          </div>
          <ThreeBalanceMicroCanvas />
        </div>

        <div className="balance-meta mt-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <small>Wallet ID:</small>
              <code className="wallet-code">
                {wallet.walletId || "Loading Wallet ID…"}
              </code>
              {wallet.walletId && (
                <button
                  type="button"
                  className="btn btn-sm copy-btn"
                  onClick={handleCopyWalletId}
                  title="Copy Wallet ID"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              )}
            </div>

            {pinSet !== null && (
              <span className={`status-chip ${pinSet ? "on" : "off"}`}>
                {pinSet ? "✓ UPI PIN Set" : "⚠ UPI PIN Not Set"}
              </span>
            )}
          </div>
        </div>
      </section>

      <section ref={quickGridRef} className="quick-grid">
        <NavLink to="/send" className="quick-action-card">
          <span className="quick-icon" aria-hidden="true">↗</span>
          <span className="quick-label">Send money</span>
        </NavLink>

        <NavLink to="/receive" className="quick-action-card">
          <span className="quick-icon" aria-hidden="true">↙</span>
          <span className="quick-label">Receive money</span>
        </NavLink>

        <NavLink to="/transactions" className="quick-action-card">
          <span className="quick-icon" aria-hidden="true">⇄</span>
          <span className="quick-label">Transactions</span>
        </NavLink>

        <NavLink to="/security" className="quick-action-card">
          <span className="quick-icon" aria-hidden="true">🛡</span>
          <span className="quick-label">Security</span>
        </NavLink>
      </section>

      <LedgerCard
        title="Recent activity"
        entries={entries.slice(0, 5)}
        loading={loading}
      />
    </Page>
  );
}
