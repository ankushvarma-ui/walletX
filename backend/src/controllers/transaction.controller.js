import { transferMoney } from "../services/transaction.service.js";
import AppError from "../utils/errors.js";

export const transferMoneyController = async (req, res) => {

    const {
        receiverWalletId,
        amount
    } = req.body;

    const senderWalletId = req.user.walletId;
    const userId = req.user.id;

    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey) {
        throw new AppError(
            "Idempotency-Key header is required",
            400
        );
    }

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