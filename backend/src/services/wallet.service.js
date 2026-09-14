import Wallet from "../models/wallet.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/errors.js";
import { generateWalletId } from "../utils/walletId.js";


// ================= CREATE WALLET =================

export const createWallet = async (
    userId
) => {

    if (!userId) {
        throw new AppError(
            "User ID is required",
            400
        );
    }


    // ================= CHECK USER =================

    const user =
        await User.findById(userId);

    if (!user) {
        throw new AppError(
            "User not found",
            404
        );
    }


    // ================= CHECK ACCOUNT =================

    if (!user.is_active) {
        throw new AppError(
            "Account is inactive",
            403
        );
    }


    // ================= CHECK EXISTING WALLET =================

    const existingWallet =
        await Wallet.findByUserId(userId);

    if (existingWallet) {
        throw new AppError(
            "User already has a wallet",
            409
        );
    }


    // ================= GENERATE WALLET ID =================

    const walletId =
        generateWalletId();


    // ================= CREATE WALLET =================

    try {

        const wallet =
            await Wallet.create({
                userId,
                walletId
            });

        return wallet;

    } catch (error) {

        // PostgreSQL unique constraint

        if (error.code === "23505") {

            throw new AppError(
                "Wallet already exists",
                409
            );
        }

        throw error;
    }
};

