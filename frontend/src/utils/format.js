export const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(n || 0));

// Ledger entries from GET /api/ledger and /api/ledger/pdf are shaped as
// { date, transaction, description, debit, credit, balance, currency } -
// see backend/src/services/ledgerStatement.service.js. There is no
// entry_type/amount/created_at field on this response.
export const entryIsCredit = (entry) =>
  entry?.credit !== null && entry?.credit !== undefined;

export const entryAmount = (entry) =>
  entryIsCredit(entry) ? entry.credit : entry.debit;

export const relativeTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
