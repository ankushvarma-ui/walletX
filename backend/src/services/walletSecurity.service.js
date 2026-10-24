import argon2 from "argon2";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import AppError from "../utils/errors.js";
import { createNotification } from "./notification.service.js";

const MAX_PIN_ATTEMPTS = 3;
const LOCK_MINUTES = 15;

/*
 * Set UPI PIN
 */
export const setUpiPin = async ({
    userId,
    currentPassword,
    upiPin,
    confirmUpiPin
}) => {
    // Validate input
    if (!currentPassword || !upiPin || !confirmUpiPin) {
        throw new AppError(
            "Current password, UPI PIN and confirm UPI PIN are required",
            400
        );
    }

    // PIN must be exactly 6 digits
    if (!/^\d{6}$/.test(upiPin)) {
        throw new AppError(
            "UPI PIN must be exactly 6 digits",
            400
        );
    }

    // Confirm PIN
    if (upiPin !== confirmUpiPin) {
        throw new AppError(
            "UPI PINs do not match",
            400
        );
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /*
         * 1. Get user
         *
         * Your users table uses:
         * password
         *
         * NOT password_hash
         */
        const userResult = await client.query(
            `
            SELECT id, password
            FROM users
            WHERE id = $1
            FOR UPDATE
            `,
            [userId]
        );

        if (userResult.rows.length === 0) {
            throw new AppError(
                "User not found",
                404
            );
        }

        const user = userResult.rows[0];

        /*
         * 2. Verify current account password
         */
        const passwordValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!passwordValid) {
            throw new AppError(
                "Current password is incorrect",
                401
            );
        }

        /*
         * 3. Find user's wallet
         *
         * wallet_security.wallet_id references
         * wallets.id, not wallets.wallet_id
         */
        const walletResult = await client.query(
            `
            SELECT id, wallet_id, status
            FROM wallets
            WHERE user_id = $1
            FOR UPDATE
            `,
            [userId]
        );

        if (walletResult.rows.length === 0) {
            throw new AppError(
                "Wallet not found",
                404
            );
        }

        const wallet = walletResult.rows[0];

        /*
         * 4. Make sure wallet is active
         */
        if (wallet.status !== "ACTIVE") {
            throw new AppError(
                "Wallet is not active",
                403
            );
        }

        /*
         * 5. Check if PIN already exists
         */
        const securityResult = await client.query(
            `
            SELECT wallet_id
            FROM wallet_security
            WHERE wallet_id = $1
            FOR UPDATE
            `,
            [wallet.id]
        );

        if (securityResult.rows.length > 0) {
            throw new AppError(
                "UPI PIN is already set. Use change PIN instead.",
                409
            );
        }

        /*
         * 6. Hash UPI PIN using Argon2id
         *
         * Plaintext PIN is never stored.
         */
        const pinHash = await argon2.hash(upiPin, {
            type: argon2.argon2id
        });

        /*
         * 7. Store PIN hash
         */
        await client.query(
            `
            INSERT INTO wallet_security (
                wallet_id,
                upi_pin_hash,
                failed_attempts,
                locked_until,
                pin_created_at,
                created_at,
                updated_at
            )
            VALUES (
                $1,
                $2,
                0,
                NULL,
                NOW(),
                NOW(),
                NOW()
            )
            `,
            [wallet.id, pinHash]
        );

        /*
         * 8. Commit
         */
        await client.query("COMMIT");

        try {
            await createNotification({
                userId,
                type: "SECURITY_UPDATE",
                title: "UPI PIN Set",
                message: "Your UPI PIN was successfully configured.",
                data: { walletId: wallet.wallet_id }
            });
        } catch (notifErr) {
            console.error("Non-blocking notification error:", notifErr.message);
        }

        return {
            walletId: wallet.wallet_id,
            pinSet: true
        };

    } catch (error) {

        /*
         * Rollback only if transaction is still active.
         */
        try {
            await client.query("ROLLBACK");
        } catch {
            // Ignore rollback error
        }

        throw error;

    } finally {
        client.release();
    }
};


/*
 * Check whether UPI PIN is configured
 */
export const isUpiPinSet = async (userId) => {

    const result = await pool.query(
        `
        SELECT ws.wallet_id
        FROM wallet_security ws
        INNER JOIN wallets w
            ON w.id = ws.wallet_id
        WHERE w.user_id = $1
        `,
        [userId]
    );

    return result.rows.length > 0;
};


/*
 * Verify UPI PIN
 */
export const verifyUpiPin = async (userId, upiPin) => {

    // Validate PIN
    if (!upiPin || !/^\d{6}$/.test(upiPin)) {
        throw new AppError(
            "UPI PIN must be exactly 6 digits",
            400
        );
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /*
         * 1. Find user's wallet
         */
        const walletResult = await client.query(
            `
            SELECT id, status
            FROM wallets
            WHERE user_id = $1
            FOR UPDATE
            `,
            [userId]
        );

        if (walletResult.rows.length === 0) {
            throw new AppError(
                "Wallet not found",
                404
            );
        }

        const wallet = walletResult.rows[0];

        /*
         * 2. Check wallet status
         */
        if (wallet.status !== "ACTIVE") {
            throw new AppError(
                "Wallet is not active",
                403
            );
        }

        /*
         * 3. Get wallet security record
         *
         * wallet_security.wallet_id = wallets.id
         */
        const securityResult = await client.query(
            `
            SELECT
                upi_pin_hash,
                failed_attempts,
                locked_until
            FROM wallet_security
            WHERE wallet_id = $1
            FOR UPDATE
            `,
            [wallet.id]
        );

        /*
         * 4. PIN doesn't exist
         */
        if (securityResult.rows.length === 0) {
            throw new AppError(
                "UPI PIN is not set",
                404
            );
        }

        const security = securityResult.rows[0];

        /*
         * 5. Check temporary lock
         */
        if (
            security.locked_until &&
            new Date(security.locked_until) > new Date()
        ) {
            throw new AppError(
                "UPI PIN is temporarily locked. Try again later.",
                423
            );
        }

        /*
         * 6. Verify Argon2id hash
         */
        const valid = await argon2.verify(
            security.upi_pin_hash,
            upiPin
        );

        /*
         * 7. Wrong PIN
         */
        if (!valid) {

            const attempts =
                security.failed_attempts + 1;

            /*
             * 3 failed attempts
             */
            if (attempts >= MAX_PIN_ATTEMPTS) {

                await client.query(
                    `
                    UPDATE wallet_security
                    SET
                        failed_attempts = 0,
                        locked_until =
                            NOW() + INTERVAL '15 minutes',
                        updated_at = NOW()
                    WHERE wallet_id = $1
                    `,
                    [wallet.id]
                );

                await client.query("COMMIT");

                throw new AppError(
                    "Too many incorrect PIN attempts. PIN locked for 15 minutes.",
                    423
                );
            }

            /*
             * Increase failed attempts
             */
            await client.query(
                `
                UPDATE wallet_security
                SET
                    failed_attempts = $1,
                    updated_at = NOW()
                WHERE wallet_id = $2
                `,
                [
                    attempts,
                    wallet.id
                ]
            );

            await client.query("COMMIT");

            throw new AppError(
                `Incorrect UPI PIN. ${
                    MAX_PIN_ATTEMPTS - attempts
                } attempts remaining.`,
                401
            );
        }

        /*
         * 8. Correct PIN
         *
         * Reset failed attempts and unlock.
         */
        await client.query(
            `
            UPDATE wallet_security
            SET
                failed_attempts = 0,
                locked_until = NULL,
                updated_at = NOW()
            WHERE wallet_id = $1
            `,
            [wallet.id]
        );

        await client.query("COMMIT");

        return {
            verified: true
        };

    } catch (error) {

        /*
         * Rollback only if necessary.
         */
        try {
            await client.query("ROLLBACK");
        } catch {
            // Ignore rollback error
        }

        throw error;

    } finally {
        client.release();
    }
};