import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import pool from "../config/db.js";
import User from "../models/user.model.js";

import {
    setUserCache,
    deleteUserCache
} from "./userCache.service.js";

import {
    generateAccessToken,
    generateRefreshToken
} from "../utils/jwt.js";

import AppError from "../utils/errors.js";

import {
    createWallet
} from "./wallet.service.js";


// ================= REGISTER =================

export const registerUser = async ({
    name,
    email,
    phoneNumber,
    password
}) => {

    // ================= VALIDATION =================

    if (!name || !name.trim()) {
        throw new AppError(
            "Name is required",
            400
        );
    }

    if (!email || !email.trim()) {
        throw new AppError(
            "Email is required",
            400
        );
    }

    if (!phoneNumber || !phoneNumber.trim()) {
        throw new AppError(
            "Phone number is required",
            400
        );
    }

    if (!password) {
        throw new AppError(
            "Password is required",
            400
        );
    }


    // ================= NORMALIZE EMAIL =================

    const normalizedEmail =
        email
            .trim()
            .toLowerCase();


    // ================= NORMALIZE PHONE =================

    const normalizedPhoneNumber =
        phoneNumber
            .trim()
            .replace(/\s+/g, "");


    // ================= PHONE VALIDATION =================

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


    // ================= DATABASE CONNECTION =================

    const client =
        await pool.connect();

    try {

        // ================= START TRANSACTION =================

        await client.query("BEGIN");


        // ================= CHECK EXISTING EMAIL =================

        const existingUser =
            await User.findByEmail(
                normalizedEmail,
                client
            );

        if (existingUser) {
            throw new AppError(
                "Account already exists",
                409
            );
        }


        // ================= CHECK EXISTING PHONE =================

        const existingPhoneUser =
            await User.findByPhoneNumber(
                normalizedPhoneNumber,
                client
            );

        if (existingPhoneUser) {
            throw new AppError(
                "Phone number is already registered",
                409
            );
        }


        // ================= HASH PASSWORD =================

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );


        // ================= CREATE USER =================

        const user =
            await User.create(
                {
                    name: name.trim(),
                    email: normalizedEmail,
                    phoneNumber:
                        normalizedPhoneNumber,
                    password: hashedPassword,
                    provider: "local",
                    providerId: null,
                    role: "user"
                },
                client
            );


        // ================= CREATE WALLET =================

        const wallet =
            await createWallet(
                user.id,
                client
            );


        // ================= COMMIT =================

        await client.query("COMMIT");


        // ================= CACHE USER =================

        let userData = user;

        try {

            userData =
                await setUserCache(user);

        } catch (redisError) {

            console.error(
                "Redis cache failed:",
                redisError.message
            );

            // Redis is only a cache.
            // PostgreSQL remains the source of truth.
        }


        // ================= RESPONSE =================

        return {
            user: userData,
            wallet
        };


    } catch (error) {

        // ================= ROLLBACK =================

        try {

            await client.query("ROLLBACK");

        } catch (rollbackError) {

            console.error(
                "Rollback failed:",
                rollbackError.message
            );
        }


        // ================= APP ERROR =================

        if (
            error instanceof AppError
        ) {
            throw error;
        }


        // ================= POSTGRES UNIQUE ERROR =================

        if (
            error.code === "23505"
        ) {
            throw new AppError(
                "Email, phone number, or wallet ID is already registered",
                409
            );
        }


        // ================= UNKNOWN ERROR =================

        throw error;


    } finally {

        client.release();
    }
};


// ================= LOGIN =================

export const loginUser = async ({
    email,
    password
}) => {

    // ================= VALIDATION =================

    if (!email || !email.trim()) {
        throw new AppError(
            "Email is required",
            400
        );
    }

    if (!password) {
        throw new AppError(
            "Password is required",
            400
        );
    }


    // ================= NORMALIZE EMAIL =================

    const normalizedEmail =
        email
            .trim()
            .toLowerCase();


    // ================= FIND USER =================

    const user =
        await User.findByEmail(
            normalizedEmail
        );


    // ================= LOGIN FAILED =================

    if (!user) {
        throw new AppError(
            "Invalid email or password",
            401
        );
    }


    // ================= ACCOUNT INACTIVE =================

    if (!user.is_active) {
        throw new AppError(
            "Account is inactive",
            403
        );
    }


    // ================= OAUTH ACCOUNT =================

    if (!user.password) {
        throw new AppError(
            "This account does not support password login",
            400
        );
    }


    // ================= COMPARE PASSWORD =================

    const passwordMatch =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!passwordMatch) {
        throw new AppError(
            "Invalid email or password",
            401
        );
    }


    // ================= CACHE USER =================

    await setUserCache(user);


    // ================= GENERATE ACCESS TOKEN =================

    const accessToken =
        generateAccessToken({
            userId: user.id,
            role: user.role
        });


    // ================= GENERATE REFRESH TOKEN =================

    const refreshToken =
        generateRefreshToken({
            userId: user.id
        });


    // ================= RESPONSE =================

    return {
        user,
        accessToken,
        refreshToken
    };
};


// ================= REFRESH TOKEN =================

export const refreshAccessToken = async (
    refreshToken
) => {

    // ================= CHECK TOKEN =================

    if (!refreshToken) {
        throw new AppError(
            "Refresh token is required",
            401
        );
    }


    // ================= VERIFY TOKEN =================

    const decoded =
        jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );


    // ================= FIND USER =================

    const user =
        await User.findById(
            decoded.userId
        );


    if (!user) {
        throw new AppError(
            "User not found",
            404
        );
    }


    // ================= ACCOUNT INACTIVE =================

    if (!user.is_active) {
        throw new AppError(
            "Account is inactive",
            403
        );
    }


    // ================= CACHE USER =================

    await setUserCache(user);


    // ================= GENERATE NEW ACCESS TOKEN =================

    const accessToken =
        generateAccessToken({
            userId: user.id,
            role: user.role
        });


    // ================= RESPONSE =================

    return {
        accessToken
    };
};


// ================= LOGOUT =================

export const logoutUser = async (
    userId
) => {

    // ================= CHECK USER =================

    if (!userId) {
        throw new AppError(
            "User not found",
            404
        );
    }


    // ================= DELETE CACHE =================

    await deleteUserCache(
        userId
    );


    // ================= RESPONSE =================

    return {
        message: "Logged out successfully"
    };
};