import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { animate } from "animejs";

import { walletApi } from "../../services/api";
import { money, entryIsCredit } from "../../utils/format";
import Alert from "../../components/Alert";

import "./Transactions.css";

const LIMIT = 10;

export default function Transactions() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Selected transaction for master-detail view
  const [selectedTx, setSelectedTx] = useState(null);

  const listRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    walletApi
      .ledger({ page, limit: LIMIT })
      .then((r) => {
        if (!active) return;
        const list = r.data?.entries || [];
        setEntries(list);
        if (list.length > 0) {
          setSelectedTx(list[0]);
        } else {
          setSelectedTx(null);
        }
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

  // Client-side filtering on database ledger records
  const filteredEntries = useMemo(() => {
    let result = entries;

    if (filterType === "credit") {
      result = result.filter(entryIsCredit);
    } else if (filterType === "debit") {
      result = result.filter((e) => !entryIsCredit(e));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.transaction && String(e.transaction).toLowerCase().includes(q)) ||
          (e.date && String(e.date).toLowerCase().includes(q))
      );
    }

    return result;
  }, [entries, filterType, searchTerm]);

  // Anime.js stagger
  useEffect(() => {
    if (!listRef.current || loading) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    animate(listRef.current.querySelectorAll(".tx-item-card"), {
      opacity: [0, 1],
      translateY: [6, 0],
      delay: (el, i) => i * 35,
      duration: 250,
      ease: "outQuad",
    });
  }, [filteredEntries, loading]);

  const handleExportPdf = () => {
    const url = walletApi.ledgerPdfUrl();
    window.open(url, "_blank");
  };

  const isCurrentDebit =
    selectedTx && selectedTx.debit !== null && selectedTx.debit !== undefined;
  const currentAmt = selectedTx
    ? isCurrentDebit
      ? selectedTx.debit
      : selectedTx.credit
    : 0;

  return (
    <div className="transactions-page">
      {/* HEADER */}
      <header className="tx-page-header">
        <div>
          <h1 className="tx-page-title">Transactions</h1>
          <p className="tx-page-subtitle">
            {filteredEntries.length} database record{filteredEntries.length === 1 ? "" : "s"} • Verified ledger entries
          </p>
        </div>

        <button
          type="button"
          className="btn-export-pdf"
          onClick={handleExportPdf}
          disabled={entries.length === 0}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export PDF
        </button>
      </header>

      {/* FILTER BAR */}
      <div className="tx-filter-bar">
        <div className="tx-search-input-wrap">
          <span className="tx-search-icon">🔍</span>
          <input
            type="text"
            className="tx-filter-input"
            placeholder="Search by description, date, or TXN ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tx-filter-actions">
          <select
            className="tx-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="debit">Debits only</option>
            <option value="credit">Credits only</option>
          </select>

          <button
            type="button"
            className="btn-filter-date"
            onClick={handleExportPdf}
          >
            Download PDF
          </button>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* 2-COLUMN MASTER-DETAIL GRID */}
      <div className="tx-master-detail-grid">
        {/* LEFT COLUMN: TRANSACTIONS LIST */}
        <div className="tx-list-column">
          <div ref={listRef} className="tx-cards-container">
            {loading ? (
              <div className="p-4 text-center text-muted">
                <small>Querying transactions from database…</small>
              </div>
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map((tx, idx) => {
                const isDebit = tx.debit !== null && tx.debit !== undefined;
                const amt = isDebit ? tx.debit : tx.credit;
                const isSelected = selectedTx?.transaction === tx.transaction;

                return (
                  <div
                    key={tx.transaction || idx}
                    className={`tx-item-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedTx(tx)}
                  >
                    <div className={`tx-dir-circle ${isDebit ? "debit" : "credit"}`}>
                      {isDebit ? "↗" : "↙"}
                    </div>

                    <div className="tx-item-info">
                      <strong className="tx-item-name">
                        {tx.description || (isDebit ? "Debit transfer" : "Credit transfer")}
                      </strong>
                      <small className="tx-item-sub">
                        {tx.date
                          ? new Date(tx.date).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Verified"} • TXN #{String(tx.transaction || "").slice(0, 8)}
                      </small>
                    </div>

                    <div className="tx-item-meta text-end">
                      <strong className={`tx-amt-num ${isDebit ? "debit" : "credit"}`}>
                        {isDebit ? `– ${money(amt)}` : `+ ${money(amt)}`}
                      </strong>
                      <div className="tx-status-pill completed">
                        <span className="dot" />
                        <span>Completed</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Honest empty state strictly reflecting real database status */
              <div className="p-5 text-center text-muted">
                <p className="mb-1 fw-semibold text-secondary">No transactions found in database.</p>
                <small>Send or receive money to populate your ledger records.</small>
              </div>
            )}
          </div>

          {/* Pagination */}
          {entries.length > 0 && (
            <div className="tx-pagination-row">
              <span className="tx-page-count">Page {page}</span>
              <div className="tx-pagination-buttons">
                <button
                  type="button"
                  className="btn-page-nav"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  ‹
                </button>
                <button type="button" className="btn-page-num active">
                  {page}
                </button>
                <button
                  type="button"
                  className="btn-page-nav"
                  disabled={entries.length < LIMIT}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TRANSACTION DETAILS */}
        <div className="tx-details-column">
          <div className="tx-details-card">
            <span className="txd-eyebrow">TRANSACTION DETAILS</span>

            {selectedTx ? (
              <>
                <strong className="txd-big-amount">
                  {isCurrentDebit ? `– ${money(currentAmt)}` : `+ ${money(currentAmt)}`}
                </strong>

                <div className="txd-status-badge">
                  <span className="dot" />
                  <span>Completed</span>
                </div>

                <hr className="txd-divider" />

                <div className="txd-key-values">
                  <div className="txd-row">
                    <span>TXN ID</span>
                    <code>#{String(selectedTx.transaction || "").slice(0, 12)}</code>
                  </div>

                  <div className="txd-row">
                    <span>Description</span>
                    <strong>{selectedTx.description || "Ledger Entry"}</strong>
                  </div>

                  <div className="txd-row">
                    <span>Date</span>
                    <span>
                      {selectedTx.date
                        ? new Date(selectedTx.date).toLocaleString("en-IN")
                        : "Just now"}
                    </span>
                  </div>

                  <div className="txd-row">
                    <span>Balance After</span>
                    <strong>{money(selectedTx.balance)}</strong>
                  </div>

                  <div className="txd-row">
                    <span>Currency</span>
                    <code>{selectedTx.currency || "INR"}</code>
                  </div>
                </div>

                <div className="txd-actions">
                  <button
                    type="button"
                    className="btn-txd-receipt"
                    onClick={handleExportPdf}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Download PDF statement
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-muted">
                <p className="mb-0">Select any transaction to inspect its audit details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
