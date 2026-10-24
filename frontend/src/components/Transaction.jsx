import { entryAmount, entryIsCredit } from "../utils/format";
import { money } from "../utils/format";

// Shape comes straight from backend/src/services/ledgerStatement.service.js:
// { date, transaction, description, debit, credit, balance, currency }
export default function Transaction({ item }) {
  const credit = entryIsCredit(item);
  const amount = entryAmount(item);
  const dateFormatted = item.date
    ? new Date(item.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <article className="transaction">
      <span className={`txn-icon ${credit ? "credit" : "debit"}`} aria-hidden="true">
        {credit ? "↙" : "↗"}
      </span>

      <div>
        <strong>
          {item.description || (credit ? "Money received" : "Money sent")}
        </strong>

        <small title={item.date ? new Date(item.date).toISOString() : ""}>
          {dateFormatted}
          {item.transaction ? ` • ${item.transaction.slice(0, 8)}…` : ""}
        </small>
      </div>

      <b className={`${credit ? "credit-text" : "debit-text"} tabular-nums`}>
        {credit ? "+" : "-"}
        {money(amount)}
      </b>
    </article>
  );
}
