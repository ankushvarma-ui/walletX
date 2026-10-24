import asyncHandler from "../utils/asyncHandler.js";

import {
    getUserById,
    getUserByPhoneNumber
} from "../services/user.service.js";


// ================= GET PROFILE =================

export const getProfile = asyncHandler(
    async (req, res) => {

        const result =
            await getUserById(
                req.userId
            );

        res.status(200).json({
            success: true,
            message:
                "Profile fetched successfully",
            user: result.user
        });
    }
);


// ================= FIND RECIPIENT =================

export const findRecipient = asyncHandler(
    async (req, res) => {

        const {
            phoneNumber
        } = req.body;


        const result =
            await getUserByPhoneNumber(
                phoneNumber
            );


        res.status(200).json({
            success: true,
            message: "Recipient found",

            recipient: {
                name:
                    result.user.name,

                phoneNumber:
                    result.user.phone_number,

                walletId:
                    result.wallet.wallet_id
            }
        });
    }
);