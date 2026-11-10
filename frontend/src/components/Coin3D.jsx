import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Creates a procedural 512x512 canvas texture representing the minted gold coin face
 * with concentric engraved ridges, the bold '₹' symbol, and 'WALLETX' currency stamp.
 */
function createCoinFaceTexture(text = "₹", subtext = "WALLETX") {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const center = size / 2;
  const radius = size / 2 - 12;

  // Outer rim gradient
  const bgGrad = ctx.createRadialGradient(
    center * 0.85,
    center * 0.75,
    radius * 0.2,
    center,
    center,
    radius
  );
  bgGrad.addColorStop(0, "#ffd966");
  bgGrad.addColorStop(0.45, "#e5a712");
  bgGrad.addColorStop(0.85, "#c68808");
  bgGrad.addColorStop(1, "#8e5c02");

  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  // Outer border ring
  ctx.strokeStyle = "rgba(255, 245, 200, 0.75)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(center, center, radius - 6, 0, Math.PI * 2);
  ctx.stroke();

  // Outer decorative dots / notches
  const numNotches = 48;
  for (let i = 0; i < numNotches; i++) {
    const angle = (i * Math.PI * 2) / numNotches;
    const x = center + Math.cos(angle) * (radius - 16);
    const y = center + Math.sin(angle) * (radius - 16);
    ctx.fillStyle = i % 2 === 0 ? "rgba(255, 240, 180, 0.9)" : "rgba(120, 75, 5, 0.7)";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Inner inset border ring
  ctx.strokeStyle = "rgba(100, 60, 2, 0.65)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(center, center, radius - 30, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 235, 160, 0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(center, center, radius - 34, 0, Math.PI * 2);
  ctx.stroke();

  // Inner recessed plate
  const innerGrad = ctx.createRadialGradient(
    center * 0.9,
    center * 0.8,
    radius * 0.1,
    center,
    center,
    radius - 36
  );
  innerGrad.addColorStop(0, "#f7c744");
  innerGrad.addColorStop(0.7, "#d49208");
  innerGrad.addColorStop(1, "#a86b03");

  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(center, center, radius - 36, 0, Math.PI * 2);
  ctx.fill();

  // Subtle engraved brushed metal rings
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  for (let r = 50; r < radius - 45; r += 20) {
    ctx.beginPath();
    ctx.arc(center, center, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw Engraved Currency Symbol (Rupee symbol '₹')
  ctx.font = "900 190px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Engraved shadow (dark bottom/right)
  ctx.fillStyle = "rgba(70, 40, 2, 0.85)";
  ctx.fillText(text, center + 4, center - 6 + 4);

  // Engraved highlight (light top/left)
  ctx.fillStyle = "rgba(255, 250, 210, 0.95)";
  ctx.fillText(text, center - 2, center - 6 - 2);

  // Core fill
  ctx.fillStyle = "#5c3702";
  ctx.fillText(text, center, center - 6);

  // Subtext: "WALLETX" curved or centered below
  if (subtext) {
    ctx.font = "700 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillStyle = "rgba(80, 45, 3, 0.9)";
    ctx.fillText(subtext, center + 1, center + 91);
    ctx.fillStyle = "rgba(255, 245, 200, 0.9)";
    ctx.fillText(subtext, center, center + 90);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * High-efficiency 3D Gold Coin Component
 *
 * @param {Object} props
 * @param {number} [props.size=160] Diameter in pixels
 * @param {string} [props.className=""] Additional CSS classes
 * @param {boolean} [props.interactive=true] Tilt toward mouse cursor
 * @param {number} [props.spinSpeed=0.015] Y-axis rotation increment per frame
 * @param {boolean} [props.subtext=true] Show 'WALLETX' text on coin
 */
export default function Coin3D({
  size = 160,
  className = "",
  interactive = true,
  spinSpeed = 0.018,
  subtext = true,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect WebGL support safely
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        window.WebGLRenderingContext &&
        (testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl"));
      if (!gl) return;
    } catch {
      return;
    }

    // 2. Accessibility: Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const width = size;
    const height = size;

    // 3. Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.4);

    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
    } catch {
      return;
    }

    // 4. Create Procedural Textures & Materials
    const faceTexture = createCoinFaceTexture("₹", subtext ? "WALLETX" : "");
    const rimTexture = createCoinFaceTexture("₹", subtext ? "WALLETX" : "");

    // Materials: [Side Rim, Top Cap (Front), Bottom Cap (Back)]
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0xdca017,
      metalness: 0.88,
      roughness: 0.28,
    });

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: faceTexture,
      metalness: 0.8,
      roughness: 0.22,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      map: rimTexture,
      metalness: 0.8,
      roughness: 0.22,
    });

    // 5. Coin Geometry (Cylinder with radius 1.25, thickness 0.18, 48 segments)
    const geometry = new THREE.CylinderGeometry(1.25, 1.25, 0.18, 48, 1, false);

    const coin = new THREE.Mesh(geometry, [sideMaterial, frontMaterial, backMaterial]);
    coin.rotation.x = Math.PI / 2; // Face forward initially
    coin.rotation.z = -0.15; // Subtle natural tilt
    scene.add(coin);

    // 6. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xfffae8, 1.1);
    scene.add(ambientLight);

    // Strong key light for rich golden specular reflections
    const dirLight1 = new THREE.DirectionalLight(0xfff3d1, 2.4);
    dirLight1.position.set(3, 4, 5);
    scene.add(dirLight1);

    // Rim backlight for 3D depth and edge highlights
    const dirLight2 = new THREE.DirectionalLight(0xe8a822, 1.4);
    dirLight2.position.set(-3, -2, -3);
    scene.add(dirLight2);

    // If user prefers reduced motion, render once and finish
    if (prefersReducedMotion) {
      renderer.render(scene, camera);
      return () => {
        geometry.dispose();
        sideMaterial.dispose();
        frontMaterial.dispose();
        backMaterial.dispose();
        faceTexture.dispose();
        rimTexture.dispose();
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    }

    // 7. Interactive Tilt Tracking
    let targetRotX = Math.PI / 2;
    let targetRotY = 0;
    let currentRotY = 0;

    const handlePointerMove = (e) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotX = Math.PI / 2 - ny * 0.35;
      targetRotY = nx * 0.45;
    };

    const handlePointerLeave = () => {
      targetRotX = Math.PI / 2;
      targetRotY = 0;
    };

    if (interactive) {
      container.addEventListener("pointermove", handlePointerMove);
      container.addEventListener("pointerleave", handlePointerLeave);
    }

    // 8. Performance-Aware Render Loop
    let animId = null;
    let isPaused = false;

    const render = () => {
      if (isPaused) return;

      currentRotY += spinSpeed;
      coin.rotation.y = currentRotY + targetRotY;
      coin.rotation.x += (targetRotX - coin.rotation.x) * 0.08;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Pause rendering when tab is hidden to save battery & CPU/GPU
    const handleVisibility = () => {
      if (document.hidden) {
        isPaused = true;
        if (animId) cancelAnimationFrame(animId);
      } else {
        isPaused = false;
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Pause rendering when scrolled out of viewport
    let observer = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && !entry.isIntersecting) {
            isPaused = true;
            if (animId) cancelAnimationFrame(animId);
          } else if (entry && entry.isIntersecting && !document.hidden) {
            isPaused = false;
            animId = requestAnimationFrame(render);
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(container);
    }

    // 9. Comprehensive Cleanup on Unmount
    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (observer) observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (interactive) {
        container.removeEventListener("pointermove", handlePointerMove);
        container.removeEventListener("pointerleave", handlePointerLeave);
      }

      geometry.dispose();
      sideMaterial.dispose();
      frontMaterial.dispose();
      backMaterial.dispose();
      faceTexture.dispose();
      rimTexture.dispose();

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, [size, interactive, spinSpeed, subtext]);

  return (
    <div
      ref={mountRef}
      className={`coin-3d-wrapper ${className}`}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    />
  );
}
