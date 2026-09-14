import asyncHandler from "../utils/asyncHandler.js";
import {
    getUserById
} from "../services/user.service.js";
import AppError from "../utils/errors.js";

export const getProfile = asyncHandler(async (req, res) => {
    const user = await getUserById(req.userId);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return res.status(200).json({
        success: true,
        user
    });
});