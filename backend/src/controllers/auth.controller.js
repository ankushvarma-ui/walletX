import asyncHandler from "../utils/asyncHandler.js";

import {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser
} from "../services/auth.service.js";


const getCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    ...(maxAge ? { maxAge } : {})
});

// ================= REGISTER =================

export const register = asyncHandler(
    async (req, res) => {

        const {
            name,
            email,
            phoneNumber,
            password
        } = req.body;


        const result =
            await registerUser({
                name,
                email,
                phoneNumber,
                password
            });


        res.status(201).json({
            success: true,
            message:
                "Account created successfully",

            user: result.user
        });
    }
);


// ================= LOGIN =================

export const login = asyncHandler(
    async (req, res) => {

        const {
            email,
            password
        } = req.body;


        const result =
            await loginUser({
                email,
                password
            });


        res.cookie(
            "accessToken",
            result.accessToken,
            getCookieOptions(15 * 60 * 1000)
        );


        res.cookie(
            "refreshToken",
            result.refreshToken,
            getCookieOptions(7 * 24 * 60 * 60 * 1000)
        );


        res.status(200).json({
            success: true,
            message: "Login successful",
            user: result.user
        });
    }
);


// ================= REFRESH =================

export const refresh = asyncHandler(
    async (req, res) => {

        const refreshToken =
            req.cookies.refreshToken;


        const result =
            await refreshAccessToken(
                refreshToken
            );


        res.cookie(
            "accessToken",
            result.accessToken,
            getCookieOptions(15 * 60 * 1000)
        );


        res.status(200).json({
            success: true,
            message:
                "Access token refreshed"
        });
    }
);


// ================= LOGOUT =================

export const logout = asyncHandler(
    async (req, res) => {

        await logoutUser(
            req.userId
        );


        res.clearCookie(
            "accessToken",
            getCookieOptions()
        );

        res.clearCookie(
            "refreshToken",
            getCookieOptions()
        );


        res.status(200).json({
            success: true,
            message:
                "Logged out successfully"
        });
    }
);