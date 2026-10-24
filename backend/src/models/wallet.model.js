import pool from "../config/db.js";

const Wallet = {

    // ================= CREATE WALLET =================

    async create(
        {
            userId,
            walletId
        },
        client = pool
    ) {

        const result =
            await client.query(
                `
                INSERT INTO wallets (
                    user_id,
                    wallet_id
                )
                VALUES ($1, $2)
                RETURNING
                    id,
                    user_id,
                    wallet_id,
                    balance,
                    currency,
                    status,
                    created_at,
                    updated_at
                `,
                [
                    userId,
                    walletId
                ]
            );

        return result.rows[0];
    },


    // ================= FIND BY USER ID =================

    async findByUserId(
        userId,
        client = pool
    ) {

        const result =
            await client.query(
                `
                SELECT
                    id,
                    user_id,
                    wallet_id,
                    balance,
                    currency,
                    status,
                    created_at,
                    updated_at
                FROM wallets
                WHERE user_id = $1
                `,
                [userId]
            );

        return result.rows[0] || null;
    },


    // ================= FIND BY WALLET ID =================

    async findByWalletId(
        walletId,
        client = pool
    ) {

        const result =
            await client.query(
                `
                SELECT
                    id,
                    user_id,
                    wallet_id,
                    balance,
                    currency,
                    status,
                    created_at,
                    updated_at
                FROM wallets
                WHERE wallet_id = $1
                `,
                [walletId]
            );

        return result.rows[0] || null;
    }
};

export default Wallet;