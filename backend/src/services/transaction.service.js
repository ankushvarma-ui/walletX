import pool from "../config/db.js";
import AppError from "../utils/errors.js";

import {
    createIdempotencyKey,
    getIdempotencyKeyForUpdate,
    completeIdempotencyKey
} from "../models/idempotency.model.js";

import { generateRequestHash } from "../utils/idempotency.js";

export const transferMoney = async (
    senderWalletId,
    receiverWalletId,
    amount,
    userId,
    idempotencyKey
) => {

    const client = await pool.connect();

    try {

        // --------------------------------
        // 1. BASIC VALIDATION
        // --------------------------------

        if (!userId) {
            throw new AppError(
                "Authenticated user is required",
                401
            );
        }

        if (!senderWalletId || !receiverWalletId) {
            throw new AppError(
                "Sender and receiver wallet are required",
                400
            );
        }

        if (senderWalletId === receiverWalletId) {
            throw new AppError(
                "Cannot transfer money to the same wallet",
                400
            );
        }

        if (
            amount === undefined ||
            amount === null ||
            Number(amount) <= 0
        ) {
            throw new AppError(
                "Amount must be greater than 0",
                400
            );
        }

        if (!idempotencyKey || !idempotencyKey.trim()) {
            throw new AppError(
                "Idempotency key is required",
                400
            );
        }

        const normalizedIdempotencyKey =
            idempotencyKey.trim();

        if (normalizedIdempotencyKey.length > 100) {
            throw new AppError(
                "Idempotency key must not exceed 100 characters",
                400
            );
        }

        const transferAmount = amount.toString();


        // --------------------------------
        // 2. GENERATE REQUEST HASH
        // --------------------------------

        const requestHash = generateRequestHash({
            receiverWalletId,
            amount: transferAmount
        });


        // --------------------------------
        // 3. START DATABASE TRANSACTION
        // --------------------------------

        await client.query("BEGIN");


        // --------------------------------
        // 4. CREATE IDEMPOTENCY RECORD
        // --------------------------------

        const createdIdempotency =
            await createIdempotencyKey(
                client,
                {
                    userId,
                    idempotencyKey: normalizedIdempotencyKey,
                    requestHash
                }
            );


        // --------------------------------
        // 5. HANDLE EXISTING IDEMPOTENCY KEY
        // --------------------------------

        let idempotencyRecord;

        if (createdIdempotency) {

            // New request
            idempotencyRecord = createdIdempotency;

        } else {

            // Same key already exists
            idempotencyRecord =
                await getIdempotencyKeyForUpdate(
                    client,
                    {
                        userId,
                        idempotencyKey:
                            normalizedIdempotencyKey
                    }
                );

            if (!idempotencyRecord) {
                throw new AppError(
                    "Unable to process idempotency key",
                    500
                );
            }

            // --------------------------------
            // REQUEST MISMATCH
            // --------------------------------

            if (
                idempotencyRecord.request_hash !==
                requestHash
            ) {
                throw new AppError(
                    "Idempotency key was already used for a different request",
                    409
                );
            }


            // --------------------------------
            // DUPLICATE COMPLETED REQUEST
            // --------------------------------

            if (
                idempotencyRecord.status ===
                "COMPLETED"
            ) {

                await client.query("COMMIT");

                return {
                    duplicate: true,
                    ...idempotencyRecord.response_data
                };
            }


            // --------------------------------
            // REQUEST STILL PROCESSING
            // --------------------------------

            if (
                idempotencyRecord.status ===
                "PROCESSING"
            ) {
                throw new AppError(
                    "Transaction is already being processed",
                    409
                );
            }
        }


        // --------------------------------
        // 6. FIND BOTH WALLETS
        // --------------------------------

        const walletResult = await client.query(
            `
            SELECT
                id,
                wallet_id,
                balance,
                currency,
                status
            FROM wallets
            WHERE wallet_id IN ($1, $2)
            `,
            [
                senderWalletId,
                receiverWalletId
            ]
        );


        if (walletResult.rowCount !== 2) {
            throw new AppError(
                "Sender or receiver wallet not found",
                404
            );
        }


        // --------------------------------
        // 7. SORT WALLET UUIDs
        // --------------------------------
        // Always lock wallets in the same order.
        // This reduces deadlock risk.

        const wallets =
            walletResult.rows.sort((a, b) =>
                a.id.localeCompare(b.id)
            );

        const firstWalletId =
            wallets[0].id;

        const secondWalletId =
            wallets[1].id;


        // --------------------------------
        // 8. LOCK BOTH WALLETS
        // --------------------------------

        const lockedWalletResult =
            await client.query(
                `
                SELECT
                    id,
                    wallet_id,
                    balance,
                    currency,
                    status
                FROM wallets
                WHERE id IN ($1, $2)
                ORDER BY id
                FOR UPDATE
                `,
                [
                    firstWalletId,
                    secondWalletId
                ]
            );


        const lockedWallets =
            lockedWalletResult.rows;


        // --------------------------------
        // 9. IDENTIFY SENDER / RECEIVER
        // --------------------------------

        const sender =
            lockedWallets.find(
                wallet =>
                    wallet.wallet_id ===
                    senderWalletId
            );

        const receiver =
            lockedWallets.find(
                wallet =>
                    wallet.wallet_id ===
                    receiverWalletId
            );


        if (!sender || !receiver) {
            throw new AppError(
                "Sender or receiver wallet not found",
                404
            );
        }


        // --------------------------------
        // 10. CHECK WALLET STATUS
        // --------------------------------

        if (sender.status !== "ACTIVE") {
            throw new AppError(
                "Sender wallet is not active",
                403
            );
        }

        if (receiver.status !== "ACTIVE") {
            throw new AppError(
                "Receiver wallet is not active",
                403
            );
        }


        // --------------------------------
        // 11. CHECK CURRENCY
        // --------------------------------

        if (
            sender.currency !==
            receiver.currency
        ) {
            throw new AppError(
                "Wallet currency mismatch",
                400
            );
        }


        // --------------------------------
        // 12. CHECK BALANCE
        // --------------------------------

        if (
            Number(sender.balance) <
            Number(transferAmount)
        ) {
            throw new AppError(
                "Insufficient wallet balance",
                400
            );
        }


        // --------------------------------
        // 13. CALCULATE BALANCES
        // --------------------------------

        const senderBalanceBefore =
            Number(sender.balance);

        const senderBalanceAfter =
            senderBalanceBefore -
            Number(transferAmount);

        const receiverBalanceBefore =
            Number(receiver.balance);

        const receiverBalanceAfter =
            receiverBalanceBefore +
            Number(transferAmount);


        // --------------------------------
        // 14. DEBIT SENDER
        // --------------------------------

        await client.query(
            `
            UPDATE wallets
            SET
                balance = balance - $1,
                updated_at = NOW()
            WHERE id = $2
            `,
            [
                transferAmount,
                sender.id
            ]
        );


        // --------------------------------
        // 15. CREDIT RECEIVER
        // --------------------------------

        await client.query(
            `
            UPDATE wallets
            SET
                balance = balance + $1,
                updated_at = NOW()
            WHERE id = $2
            `,
            [
                transferAmount,
                receiver.id
            ]
        );


        // --------------------------------
        // 16. CREATE TRANSACTION
        // --------------------------------

        const transactionResult =
            await client.query(
                `
                INSERT INTO transactions (
                    sender_wallet_id,
                    receiver_wallet_id,
                    amount,
                    currency,
                    status,
                    completed_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    'SUCCESS',
                    NOW()
                )
                RETURNING
                    id,
                    amount,
                    currency,
                    status,
                    created_at,
                    completed_at
                `,
                [
                    sender.id,
                    receiver.id,
                    transferAmount,
                    sender.currency
                ]
            );


        const transaction =
            transactionResult.rows[0];


        // --------------------------------
        // 17. CREATE SENDER LEDGER
        // --------------------------------

        await client.query(
            `
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
            VALUES (
                $1,
                $2,
                'DEBIT',
                $3,
                $4,
                $5,
                $6,
                $7
            )
            `,
            [
                transaction.id,
                sender.id,
                transferAmount,
                senderBalanceBefore,
                senderBalanceAfter,
                sender.currency,
                "Money sent"
            ]
        );


        // --------------------------------
        // 18. CREATE RECEIVER LEDGER
        // --------------------------------

        await client.query(
            `
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
            VALUES (
                $1,
                $2,
                'CREDIT',
                $3,
                $4,
                $5,
                $6,
                $7
            )
            `,
            [
                transaction.id,
                receiver.id,
                transferAmount,
                receiverBalanceBefore,
                receiverBalanceAfter,
                receiver.currency,
                "Money received"
            ]
        );


        // --------------------------------
        // 19. PREPARE RESPONSE
        // --------------------------------

        const responseData = {
            transactionId: transaction.id,
            senderWalletId: sender.wallet_id,
            receiverWalletId: receiver.wallet_id,
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
            createdAt: transaction.created_at
        };


        // --------------------------------
        // 20. COMPLETE IDEMPOTENCY RECORD
        // --------------------------------

        await completeIdempotencyKey(
            client,
            {
                idempotencyId:
                    idempotencyRecord.id,

                transactionId:
                    transaction.id,

                responseData,

                responseStatus: 200
            }
        );


        // --------------------------------
        // 21. COMMIT EVERYTHING
        // --------------------------------

        await client.query("COMMIT");


        // --------------------------------
        // 22. RETURN RESULT
        // --------------------------------

        return {
            duplicate: false,
            ...responseData
        };

    } catch (error) {

        // --------------------------------
        // ROLLBACK
        // --------------------------------

        try {
            await client.query("ROLLBACK");
        } catch {
            // Ignore rollback error
        }


        // --------------------------------
        // PRESERVE APP ERRORS
        // --------------------------------

        if (error instanceof AppError) {
            throw error;
        }


        // --------------------------------
        // UNKNOWN ERROR
        // --------------------------------

        throw new AppError(
            "Money transfer failed",
            500
        );

    } finally {

        // --------------------------------
        // RELEASE CONNECTION
        // --------------------------------

        client.release();
    }
};