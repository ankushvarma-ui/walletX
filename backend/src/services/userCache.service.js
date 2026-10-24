import redis from "../config/redis.js";

const USER_CACHE_TTL = 600; // 10 minutes

export const getUserFromCache = async (userId) => {
    const key = `user:${userId}`;

    const user = await redis.get(key);

    if (!user) {
        return null;
    }

    return JSON.parse(user);
};

export const setUserCache = async (user) => {
    const key = `user:${user.id}`;

    const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active
    };

    await redis.set(
        key,
        JSON.stringify(userData),
        "EX",
        USER_CACHE_TTL
    );

    return userData;
};

export const deleteUserCache = async (userId) => {
    await redis.del(`user:${userId}`);
};