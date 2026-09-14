import asyncHandler from "../utils/asyncHandler.js";
import {
    createWallet
} from "../services/wallet.service.js";


// ================= CREATE WALLET =================

export const createWalletController =
    asyncHandler(async (req, res) => {

        const wallet =
            await createWallet(
                req.userId
            );


        res.status(201).json({

            success: true,

            message:
                "Wallet created successfully",

            wallet
        });
    });
