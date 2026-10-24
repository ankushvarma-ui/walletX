import asyncHandler from "../utils/asyncHandler.js";
import {
    createWallet
} from "../services/wallet.service.js";
import Wallet from "../models/wallet.model.js";


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


// ================= GET MY WALLET =================

export const getMyWalletController =
    asyncHandler(async (req, res) => {

        const wallet =
            await Wallet.findByUserId(
                req.userId
            );

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Wallet fetched successfully",
            wallet: {
                id: wallet.id,
                walletId: wallet.wallet_id,
                balance: wallet.balance,
                currency: wallet.currency,
                status: wallet.status,
                createdAt: wallet.created_at,
                updatedAt: wallet.updated_at
            }
        });
    });
