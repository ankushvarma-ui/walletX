import { useEffect, useRef } from "react";
import { animate } from "animejs";

export default function Page({
  title,
  subtitle,
  children,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const anim = animate(containerRef.current, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 300,
      ease: "outQuad",
    });

    return () => {
      if (anim && typeof anim.cancel === "function") {
        anim.cancel();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="page-container">
      <header className="page-heading">
        <p className="eyebrow">WALLETX</p>

        <h1>{title}</h1>

        <p>{subtitle}</p>
      </header>

      {children}
    </div>
  );
}