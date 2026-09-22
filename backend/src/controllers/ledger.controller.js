import { getWalletLedger } from "../services/ledger.service.js";
import { formatLedgerStatement } from "../services/ledgerStatement.service.js";
import pool from "../config/db.js";
import AppError from "../utils/errors.js";

export const getMyLedger = async (req, res) => {
    // Find wallet using authenticated user ID
    const walletResult = await pool.query(
        `
        SELECT id
        FROM wallets
        WHERE user_id = $1
        `,
        [req.userId]
    );

    if (walletResult.rows.length === 0) {
        throw new AppError("Wallet not found", 404);
    }

    // This is wallets.id (UUID), which ledger_entries.wallet_id references
    const walletId = walletResult.rows[0].id;

    const page = Math.max(
        parseInt(req.query.page) || 1,
        1
    );

    const limit = Math.min(
        Math.max(parseInt(req.query.limit) || 20, 1),
        100
    );

    const ledger = await getWalletLedger(
        walletId,
        page,
        limit
    );

    const statement = formatLedgerStatement(ledger);

    res.status(200).json({
        success: true,
        message: "Ledger fetched successfully",
        data: {
            page,
            limit,
            entries: statement
        }
    });
};