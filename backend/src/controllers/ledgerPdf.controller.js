import pool from "../config/db.js";
import AppError from "../utils/errors.js";
import { generateLedgerPdf } from "../services/ledgerPdf.service.js";

export const downloadLedgerPdf = async (req, res) => {
    // Find wallet using logged-in user's ID
    const walletResult = await pool.query(
        `
        SELECT id, wallet_id
        FROM wallets
        WHERE user_id = $1
        `,
        [req.userId]
    );

    if (walletResult.rows.length === 0) {
        throw new AppError("Wallet not found", 404);
    }

    const wallet = walletResult.rows[0];

    const { fromDate, toDate } = req.query;

    // Get ledger entries
    let query = `
        SELECT
            le.id,
            le.transaction_id,
            le.entry_type,
            le.amount,
            le.balance_before,
            le.balance_after,
            le.description,
            le.created_at
        FROM ledger_entries le
        WHERE le.wallet_id = $1
    `;

    const values = [wallet.id];

    // Optional starting date
    if (fromDate) {
        values.push(fromDate);

        query += `
            AND le.created_at >= $${values.length}
        `;
    }

    // Optional ending date
    if (toDate) {
        values.push(toDate);

        query += `
            AND le.created_at <= $${values.length}
        `;
    }

    query += `
        ORDER BY le.created_at ASC
    `;

    const ledgerResult = await pool.query(
        query,
        values
    );

    // Convert database rows into PDF format
    const entries = ledgerResult.rows.map((entry) => ({
        date: entry.created_at,

        transaction: entry.transaction_id,

        description: entry.description || "-",

        debit:
            entry.entry_type === "DEBIT"
                ? entry.amount
                : null,

        credit:
            entry.entry_type === "CREDIT"
                ? entry.amount
                : null,

        balance: entry.balance_after
    }));

    // Generate PDF directly into HTTP response
    generateLedgerPdf(res, {
        walletId: wallet.wallet_id,
        entries,
        fromDate,
        toDate
    });
};