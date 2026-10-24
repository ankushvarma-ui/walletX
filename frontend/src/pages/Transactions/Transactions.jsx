import { useEffect, useState, useRef, useMemo } from "react";
import { animate } from "animejs";

import { walletApi } from "../../services/api";
import { entryIsCredit } from "../../utils/format";

import Alert from "../../components/Alert";
import EmptyState from "../../components/EmptyState";
import Page from "../../components/Page";
import Transaction from "../../components/Transaction";

import "./Transactions.css";

const LIMIT = 20;

export default function Transactions() {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "credit" | "debit"

  const listRef = useRef(null);

  useEffect(() => {
    let active = true;

    walletApi
      .ledger({ page, limit: LIMIT })
      .then((r) => {
        if (!active) return;
        setEntries(r.data?.entries || []);
        setError("");
      })
      .catch((e) => {
        if (!active) return;
        setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  const filteredEntries = useMemo(() => {
    if (filter === "credit") return entries.filter(entryIsCredit);
    if (filter === "debit") return entries.filter((e) => !entryIsCredit(e));
    return entries;
  }, [entries, filter]);

  // Anime.js stagger
  useEffect(() => {
    if (loading || !filteredEntries.length || !listRef.current) return;

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
      delay: (el, i) => i * 30,
      duration: 250,
      ease: "outQuad",
    });

    return () => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    };
  }, [filteredEntries, loading]);

  const handlePageChange = (newPage) => {
    setLoading(true);
    setPage(newPage);
  };

  return (
    <Page
      title="Transactions"
      subtitle="Complete ledger of your incoming and outgoing transfers."
    >
      <section className="panel">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div className="filter-tabs d-flex gap-1 bg-light p-1 rounded border">
            <button
              type="button"
              className={`filter-tab-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${filter === "credit" ? "active" : ""}`}
              onClick={() => setFilter("credit")}
            >
              Received
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${filter === "debit" ? "active" : ""}`}
              onClick={() => setFilter("debit")}
            >
              Sent
            </button>
          </div>

          <span className="text-muted small">
            Showing {filteredEntries.length} of {entries.length} items
          </span>
        </div>

        {error ? (
          <Alert>{error}</Alert>
        ) : loading ? (
          <div className="skeleton-lines">
            <i />
            <i />
            <i />
            <i />
          </div>
        ) : filteredEntries.length ? (
          <div ref={listRef} className="transaction-list">
            {filteredEntries.map((x, i) => (
              <Transaction
                key={x.transaction ? `${x.transaction}-${i}` : i}
                item={x}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            text={
              filter !== "all"
                ? `No ${filter === "credit" ? "received" : "sent"} transactions on this page.`
                : "No transactions recorded yet."
            }
          />
        )}

        <div className="pagination-row">
          <button
            className="btn btn-light"
            disabled={page <= 1 || loading}
            onClick={() => handlePageChange(Math.max(1, page - 1))}
          >
            ← Previous
          </button>

          <span className="fw-semibold text-navy">Page {page}</span>

          <button
            className="btn btn-light"
            disabled={loading || entries.length < LIMIT}
            onClick={() => handlePageChange(page + 1)}
          >
            Next →
          </button>
        </div>
      </section>
    </Page>
  );
}
