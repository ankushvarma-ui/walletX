import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { animate } from "animejs";

import Empty from "./Empty";
import Transaction from "./Transaction";

export default function LedgerCard({
  title,
  entries,
  loading,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (loading || !entries.length || !listRef.current) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const items = listRef.current.querySelectorAll(".transaction");
    if (!items.length) return;

    const anim = animate(items, {
      opacity: [0, 1],
      translateY: [6, 0],
      delay: (el, i) => i * 35,
      duration: 250,
      ease: "outQuad",
    });

    return () => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    };
  }, [entries, loading]);

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>{title}</h2>

        <NavLink to="/statement" className="btn btn-outline-primary btn-sm">
          View statement →
        </NavLink>
      </div>

      {loading ? (
        <div className="skeleton-lines">
          <i />
          <i />
          <i />
        </div>
      ) : entries.length ? (
        <div ref={listRef} className="transaction-list">
          {entries.map((x, i) => (
            <Transaction
              key={x.transaction ? `${x.transaction}-${i}` : (x.id || i)}
              item={x}
            />
          ))}
        </div>
      ) : (
        <Empty text="No transactions to show yet." />
      )}
    </section>
  );
}