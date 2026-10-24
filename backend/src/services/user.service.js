import User from "../models/user.model.js";
import Wallet from "../models/wallet.model.js";

import {
    getUserFromCache,
    setUserCache
} from "./userCache.service.js";

import AppError from "../utils/errors.js";


// ================= GET USER BY ID =================

export const getUserById = async (
    userId
) => {

    const cachedUser =
        await getUserFromCache(
            userId
        );

    if (cachedUser) {

        return {
            success: true,
            message: "User found in Redis",
            source: "redis",
            user: cachedUser
        };
    }


    const user =
        await User.findById(
            userId
        );


    if (!user) {
        throw new AppError(
            "User not found",
            404
        );
    }


    if (!user.is_active) {
        throw new AppError(
            "Account is inactive",
            403
        );
    }


    const userData =
        await setUserCache(
            user
        );


    return {
        success: true,
        message: "User found",
        source: "postgresql",
        user: userData
    };
};


// ================= FIND RECIPIENT =================

export const getUserByPhoneNumber = async (
    phoneNumber
) => {

    // ================= VALIDATE =================

    if (
        !phoneNumber ||
        !phoneNumber.trim()
    ) {
        throw new AppError(
            "Phone number is required",
            400
        );
    }


    // ================= NORMALIZE =================

    const normalizedPhoneNumber =
        phoneNumber
            .trim()
            .replace(/\s+/g, "");


    // ================= VALIDATE PHONE =================

    if (
        !/^[6-9]\d{9}$/.test(
            normalizedPhoneNumber
        )
    ) {
        throw new AppError(
            "Enter a valid 10-digit phone number",
            400
        );
    }


    // ================= FIND USER =================

    const user =
        await User.findByPhoneNumber(
            normalizedPhoneNumber
        );


    // ================= USER NOT FOUND =================

    if (!user) {
        throw new AppError(
            "No WalletX account found with this phone number",
            404
        );
    }


    // ================= ACCOUNT CHECK =================

    if (!user.is_active) {
        throw new AppError(
            "Recipient account is inactive",
            403
        );
    }


    // ================= FIND WALLET =================

    const wallet =
        await Wallet.findByUserId(
            user.id
        );


    // ================= WALLET NOT FOUND =================

    if (!wallet) {
        throw new AppError(
            "Recipient wallet not found",
            404
        );
    }


    // ================= WALLET STATUS =================

    if (wallet.status !== "ACTIVE") {
        throw new AppError(
            "Recipient wallet is not active",
            403
        );
    }


    // ================= RETURN MINIMAL DATA =================

    return {
        success: true,
        message: "Recipient found",

        user: {
            id: user.id,
            name: user.name,
            phone_number:
                user.phone_number
        },

        wallet: {
            wallet_id:
                wallet.wallet_id
        }
    };
};