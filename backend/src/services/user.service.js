import User from "../models/user.model.js";

import {
  getUserFromCache,
  setUserCache
} from "./userCache.service.js";

import AppError from "../utils/errors.js";


export const getUserById = async (userId) => {

  // 1. Redis
  const cachedUser = await getUserFromCache(userId);

  if (cachedUser) {
    return {
      success: true,
      message: "User found in Redis",
      source: "redis",
      user: cachedUser
    };
  }


  // 2. PostgreSQL
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }


  if (!user.is_active) {
    throw new AppError("Account is inactive", 403);
  }


  // 3. Cache PostgreSQL user
  const userData = await setUserCache(user);

  return {
    success: true,
    message: "User found",
    source: "postgresql",
    user: userData
  };
};