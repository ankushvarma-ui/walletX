import pool from "../config/db.js";
import AppError from "../utils/errors.js";

import {
    sendPushNotification,
} from "./push.service.js";


export const createNotification = async ({
    userId,
    type,
    title,
    message,
    data = null,
}) => {
    if (!userId) {
        throw new AppError("User ID is required", 400);
    }

    if (!type || !title || !message) {
        throw new AppError(
            "Notification type, title and message are required",
            400
        );
    }

    const result = await pool.query(
        `
        INSERT INTO notifications
            (
                user_id,
                type,
                title,
                message,
                data
            )
        VALUES
            ($1, $2, $3, $4, $5)
        RETURNING
            id,
            user_id,
            type,
            title,
            message,
            data,
            is_read,
            created_at
        `,
        [
            userId,
            type,
            title,
            message,
            data,
        ]
    );

    const notification = result.rows[0];

    // Send browser push notification
    await sendPushNotification({
        userId,
        title,
        message,
        data: {
            notificationId: notification.id,
            type,
            ...(
                data || {}
            ),
        },
    });

    return notification;
};


export const getUserNotifications = async (
    userId,
    { limit = 20, offset = 0 } = {}
) => {
    if (!userId) {
        throw new AppError("User ID is required", 400);
    }

    const safeLimit = Math.min(
        Math.max(Number(limit) || 20, 1),
        100
    );

    const safeOffset = Math.max(
        Number(offset) || 0,
        0
    );

    const result = await pool.query(
        `
        SELECT
            id,
            type,
            title,
            message,
            data,
            is_read,
            created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        OFFSET $3
        `,
        [
            userId,
            safeLimit,
            safeOffset,
        ]
    );

    return result.rows;
};


export const markNotificationAsRead = async (
    notificationId,
    userId
) => {
    if (!notificationId || !userId) {
        throw new AppError(
            "Notification ID and User ID are required",
            400
        );
    }

    const result = await pool.query(
        `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = $1
          AND user_id = $2
        RETURNING
            id,
            type,
            title,
            message,
            data,
            is_read,
            created_at
        `,
        [
            notificationId,
            userId,
        ]
    );

    if (result.rowCount === 0) {
        throw new AppError(
            "Notification not found",
            404
        );
    }

    return result.rows[0];
};


export const markAllNotificationsAsRead = async (
    userId
) => {
    if (!userId) {
        throw new AppError(
            "User ID is required",
            400
        );
    }

    const result = await pool.query(
        `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = $1
          AND is_read = FALSE
        `,
        [userId]
    );

    return {
        updatedCount: result.rowCount,
    };
};