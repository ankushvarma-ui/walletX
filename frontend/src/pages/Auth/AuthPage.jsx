import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import * as THREE from "three";
import { animate } from "animejs";

import { useAuth } from "../../context/AuthContext";
import Alert from "../../components/Alert";
import Field from "../../components/Field";

import "./AuthPage.css";

function ThreeAuthBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // WebGL support check
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

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 25;

    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      container.appendChild(renderer.domElement);
    } catch {
      return;
    }

    // Lightweight particles
    const particleCount = 45;
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      velocities.push({
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x246bfe,
      size: 0.6,
      transparent: true,
      opacity: 0.45,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

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

    const onResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    const renderLoop = () => {
      if (isHidden) return;
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3] += velocities[i].x;
        pos[i * 3 + 1] += velocities[i].y;

        if (pos[i * 3] < -20 || pos[i * 3] > 20) velocities[i].x *= -1;
        if (pos[i * 3 + 1] < -15 || pos[i * 3 + 1] > 15) velocities[i].y *= -1;
      }
      geometry.attributes.position.needsUpdate = true;
      particles.rotation.z += 0.0005;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    const onVisibility = () => {
      if (document.hidden) {
        isHidden = true;
        if (animId) cancelAnimationFrame(animId);
      } else {
        isHidden = false;
        animId = requestAnimationFrame(renderLoop);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
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

  return <div ref={mountRef} className="auth-three-canvas" aria-hidden="true" />;
}

export default function AuthPage({ register: isRegister }) {
  const navigate = useNavigate();
  const { login, register, user, loading } = useAuth();
  const cardRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  // Anime.js card entrance
  useEffect(() => {
    if (!cardRef.current) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const anim = animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 320,
      ease: "outQuad",
    });

    return () => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    };
  }, [isRegister]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setNotice("");

    // Basic frontend validations
    if (isRegister) {
      if (!form.name.trim()) {
        return setError("Please enter your full name.");
      }
      const cleanPhone = form.phoneNumber.trim().replace(/\s+/g, "");
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return setError("Please enter a valid 10-digit mobile number (e.g. 9876543210).");
      }
    }

    if (!form.email.trim() || !form.email.includes("@")) {
      return setError("Please enter a valid email address.");
    }

    if (!form.password) {
      return setError("Please enter your password.");
    }

    setBusy(true);

    try {
      if (isRegister) {
        await register({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phoneNumber: form.phoneNumber.trim().replace(/\s+/g, ""),
          password: form.password,
        });

        setNotice("Wallet created successfully! Redirecting to login…");
        setTimeout(() => navigate("/login"), 1000);
      } else {
        await login({
          email: form.email.trim().toLowerCase(),
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
    <main className="auth-page">
      <ThreeAuthBackground />

      <NavLink className="brand auth-brand" to="/">
        <span className="brand-dot" />
        <span>WALLETX</span>
      </NavLink>

      <form ref={cardRef} className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">
          {isRegister ? "CREATE YOUR WALLET" : "WELCOME BACK"}
        </p>

        <h1>{isRegister ? "Start simply." : "Sign in securely."}</h1>

        {error && <Alert>{error}</Alert>}
        {notice && <div className="alert alert-success">{notice}</div>}

        {isRegister && (
          <>
            <Field
              label="Full name"
              placeholder="e.g. Ankush Varma"
              value={form.name}
              onChange={(name) => setForm({ ...form, name })}
            />

            <Field
              label="Phone number"
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              value={form.phoneNumber}
              onChange={(phoneNumber) => setForm({ ...form, phoneNumber })}
            />
          </>
        )}

        <Field
          label="Email address"
          type="email"
          placeholder="e.g. user@example.com"
          value={form.email}
          onChange={(email) => setForm({ ...form, email })}
        />

        <Field
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(password) => setForm({ ...form, password })}
        />

        <button className="btn btn-primary w-100 mt-2" disabled={busy}>
          {busy
            ? isRegister
              ? "Creating account…"
              : "Logging in…"
            : isRegister
            ? "Create wallet →"
            : "Log in →"}
        </button>

        <p className="form-foot">
          {isRegister ? (
            <>
              Already have an account? <NavLink to="/login">Log in</NavLink>
            </>
          ) : (
            <>
              New to WalletX?{" "}
              <NavLink to="/register">Create a wallet</NavLink>
            </>
          )}
        </p>
      </form>
    </main>
  );
}
