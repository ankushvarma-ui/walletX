
import asyncHandler from "../utils/asyncHandler.js";
import {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser
} from "../services/auth.service.js";


// ================= REGISTER =================

export const register = asyncHandler(
    async (req, res) => {

        const {
            name,
            email,
            password
        } = req.body;


        const result =
            await registerUser({
                name,
                email,
                password
            });


        res.status(201).json({
            success: true,
            message: "Account created successfully",
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
            {
                httpOnly: true,
                secure:
                    process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 15 * 60 * 1000
            }
        );


        res.cookie(
            "refreshToken",
            result.refreshToken,
            {
                httpOnly: true,
                secure:
                    process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000
            }
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
            {
                httpOnly: true,
                secure:
                    process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 15 * 60 * 1000
            }
        );


        res.status(200).json({
            success: true,
            message: "Access token refreshed"
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
            "accessToken"
        );

        res.clearCookie(
            "refreshToken"
        );


        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    }
);

