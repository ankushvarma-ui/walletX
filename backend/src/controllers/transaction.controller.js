import { transferMoney } from "../services/transaction.service.js";
import AppError from "../utils/errors.js";
import pool from "../config/db.js";

export const transferMoneyController = async (req, res) => {
    const {
        receiverWalletId,
        amount
    } = req.body;

    const userId = req.userId;

    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey) {
        throw new AppError(
            "Idempotency-Key header is required",
            400
        );
    }

    const walletResult = await pool.query(
        `
        SELECT wallet_id
        FROM wallets
        WHERE user_id = $1
        `,
        [userId]
    );

    if (walletResult.rowCount === 0) {
        throw new AppError(
            "Sender wallet not found",
            404
        );
    }

    const senderWalletId = walletResult.rows[0].wallet_id;

    const result = await transferMoney(
        senderWalletId,
        receiverWalletId,
        amount,
        userId,
        idempotencyKey
    );

    res.status(200).json({
        success: true,
        message: result.duplicate
            ? "Duplicate request. Original transaction returned"
            : "Money transferred successfully",
        data: result
    });
};