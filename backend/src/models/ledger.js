import pool from "../config/db.js";


export const createLedgerEntry = async (
    client,
    {
        transactionId,
        walletId,
        entryType,
        amount,
        balanceBefore,
        balanceAfter,
        currency = "INR",
        description
    }
) => {

    const query = `
        INSERT INTO ledger_entries (
            transaction_id,
            wallet_id,
            entry_type,
            amount,
            balance_before,
            balance_after,
            currency,
            description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;

    const values = [
        transactionId,
        walletId,
        entryType,
        amount,
        balanceBefore,
        balanceAfter,
        currency,
        description
    ];

    const result = await client.query(query, values);

    return result.rows[0];
};


export const getLedgerEntriesByWallet = async (
    walletId,
    limit,
    offset
) => {

    const query = `
        SELECT
            id,
            transaction_id,
            wallet_id,
            entry_type,
            amount,
            balance_before,
            balance_after,
            currency,
            description,
            created_at
        FROM ledger_entries
        WHERE wallet_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        OFFSET $3;
    `;

    const result = await pool.query(query, [
        walletId,
        limit,
        offset
    ]);

    return result.rows;
};