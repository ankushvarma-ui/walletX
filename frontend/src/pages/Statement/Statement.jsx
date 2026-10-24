import { useEffect, useState, useRef } from "react";
import { animate } from "animejs";

import { walletApi } from "../../services/api";

import Alert from "../../components/Alert";
import EmptyState from "../../components/EmptyState";
import Page from "../../components/Page";
import Transaction from "../../components/Transaction";

import "./Statement.css";

const LIMIT = 20;

export default function Statement() {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  // Anime.js stagger
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
      delay: (el, i) => i * 30,
      duration: 250,
      ease: "outQuad",
    });

    return () => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    };
  }, [entries, loading]);

  const handlePageChange = (newPage) => {
    setLoading(true);
    setPage(newPage);
  };

  return (
    <Page title="Statement" subtitle="Your official wallet statement and records.">
      <section className="panel">
        <div className="panel-title mb-3">
          <h2>Ledger statement</h2>
          <span className="badge bg-light text-navy border px-2 py-1">Official Records</span>
        </div>

        <div className="statement-filters mb-4 p-3 bg-light rounded border d-flex flex-wrap align-items-end gap-3">
          <div className="field-inline">
            <label htmlFor="stmt-from" className="form-label mb-1">
              From Date
            </label>
            <input
              id="stmt-from"
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="field-inline">
            <label htmlFor="stmt-to" className="form-label mb-1">
              To Date
            </label>
            <input
              id="stmt-to"
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <a
            className="btn btn-primary"
            href={walletApi.ledgerPdfUrl({ fromDate, toDate })}
            target="_blank"
            rel="noreferrer"
          >
            <span>Download Official PDF</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>

        <p className="text-muted small mb-3">
          Date filters scope the official generated PDF download. On-screen rows show your complete paginated ledger entries.
        </p>

        {error ? (
          <Alert>{error}</Alert>
        ) : loading ? (
          <div className="skeleton-lines">
            <i />
            <i />
            <i />
            <i />
          </div>
        ) : entries.length ? (
          <div ref={listRef} className="transaction-list">
            {entries.map((x, i) => (
              <Transaction
                key={x.transaction ? `${x.transaction}-${i}` : i}
                item={x}
              />
            ))}
          </div>
        ) : (
          <EmptyState text="No ledger entries recorded yet." />
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
