import jwt from "jsonwebtoken";

import AppError from "../utils/errors.js";
import {
    getUserFromCache,
    setUserCache
} from "../services/userCache.service.js";

import User from "../models/user.model.js";

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            throw new AppError("Authentication required", 401);
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Store user ID for controllers
        req.userId = decoded.userId;

        // First check Redis
        let user = await getUserFromCache(decoded.userId);

        if (!user) {
            // Redis miss → PostgreSQL
            user = await User.findById(decoded.userId);

            if (!user) {
                throw new AppError("User not found", 401);
            }

            if (!user.is_active) {
                throw new AppError("Account is inactive", 403);
            }

            // Put user into Redis
            user = await setUserCache(user);
        } else {
            // Redis hit
            if (!user.isActive) {
                throw new AppError("Account is inactive", 403);
            }
        }

        // Make authenticated user available to later middleware/controllers
        req.user = user;

        next();

    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return next(
                new AppError("Invalid access token", 401)
            );
        }

        if (error.name === "TokenExpiredError") {
            return next(
                new AppError("Access token expired", 401)
            );
        }

        next(error);
    }
};

export default authMiddleware;