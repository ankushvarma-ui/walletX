import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import * as THREE from "three";
import { animate } from "animejs";

import "./Landing.css";

function ThreeCoinVisual() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. WebGL Availability check
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        window.WebGLRenderingContext &&
        (testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl"));
      if (!gl) return;
    } catch {
      return;
    }

    // 2. Reduced motion check
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const width = container.clientWidth || 160;
    const height = container.clientHeight || 160;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.z = 4.2;

    // Renderer
    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);
    } catch {
      return;
    }

    // Geometry: 3D Ring/Token
    const geometry = new THREE.TorusGeometry(1.2, 0.32, 16, 48);
    const material = new THREE.MeshStandardMaterial({
      color: 0x246bfe,
      metalness: 0.85,
      roughness: 0.2,
      wireframe: false,
    });
    const token = new THREE.Mesh(geometry, material);
    token.rotation.x = 0.5;
    scene.add(token);

    // Inner core
    const innerGeom = new THREE.SphereGeometry(0.55, 16, 16);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.4,
      roughness: 0.3,
    });
    const innerCore = new THREE.Mesh(innerGeom, innerMat);
    scene.add(innerCore);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(3, 4, 5);
    scene.add(dirLight);

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
      return () => {
        geometry.dispose();
        material.dispose();
        innerGeom.dispose();
        innerMat.dispose();
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
      token.rotation.y += 0.015;
      token.rotation.z += 0.008;
      innerCore.rotation.y -= 0.01;
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
      innerGeom.dispose();
      innerMat.dispose();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  return <div ref={mountRef} className="three-token-container" aria-hidden="true" />;
}

function Landing() {
  const heroRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    let animHero = null;
    let animGrid = null;

    if (heroRef.current) {
      animHero = animate(heroRef.current.children, {
        opacity: [0, 1],
        translateY: [12, 0],
        delay: (el, i) => i * 60,
        duration: 350,
        ease: "outQuad",
      });
    }

    if (gridRef.current) {
      animGrid = animate(gridRef.current.children, {
        opacity: [0, 1],
        translateY: [10, 0],
        delay: (el, i) => 150 + i * 80,
        duration: 350,
        ease: "outQuad",
      });
    }

    return () => {
      if (animHero && typeof animHero.cancel === "function") animHero.cancel();
      if (animGrid && typeof animGrid.cancel === "function") animGrid.cancel();
    };
  }, []);

  return (
    <main className="landing">
      <nav>
        <span className="brand">
          <span className="brand-dot" />
          <span>WALLETX</span>
        </span>

        <div className="d-flex align-items-center gap-2">
          <NavLink className="btn btn-outline-primary" to="/login">
            Log in
          </NavLink>

          <NavLink className="btn btn-primary" to="/register">
            Create wallet
          </NavLink>
        </div>
      </nav>

      <section className="hero-wrap">
        <div ref={heroRef} className="hero-content">
          <p className="eyebrow">VIRTUAL MONEY, SIMPLIFIED</p>

          <h1>
            Simple payments.
            <br />
            Secure wallet.
          </h1>

          <p className="lead">
            WalletX gives you a clear, secure place to send, receive, and manage
            virtual money with instant PIN authorization and detailed ledger tracking.
          </p>

          <div className="hero-actions d-flex gap-3">
            <NavLink className="btn btn-primary btn-lg" to="/register">
              Get started →
            </NavLink>
            <NavLink className="btn btn-light btn-lg" to="/login">
              Sign in
            </NavLink>
          </div>
        </div>

        <div className="wallet-visual-container">
          <div className="wallet-visual">
            <div className="wallet-visual-top">
              <span>Available balance</span>
              <ThreeCoinVisual />
            </div>

            <strong className="tabular-nums">₹ 24,500.00</strong>

            <hr />

            <div className="d-flex justify-content-between align-items-center">
              <small>WALLETX •••• 8204</small>
              <span className="status-chip on">Active</span>
            </div>
          </div>
        </div>
      </section>

      <section ref={gridRef} className="feature-grid">
        <Info
          icon="↗"
          title="Fast transfers"
          text="Send money securely with idempotency protection and recipient lookup."
        />

        <Info
          icon="🛡"
          title="UPI PIN Security"
          text="Every outgoing transfer is protected by 6-digit PIN verification."
        />

        <Info
          icon="✓"
          title="Live Ledger"
          text="Track every debit, credit, and running balance in official statements."
        />
      </section>
    </main>
  );
}

function Info(p) {
  return (
    <article className="info">
      <span className="info-icon" aria-hidden="true">{p.icon}</span>
      <h2>{p.title}</h2>
      <p>{p.text}</p>
    </article>
  );
}

export default Landing;