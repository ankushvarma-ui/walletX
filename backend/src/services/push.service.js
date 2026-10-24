import webpush from "web-push";
import pool from "../config/db.js";
import AppError from "../utils/errors.js";

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);


// Save browser subscription
export const savePushSubscription = async ({
    userId,
    subscription,
}) => {
    if (!userId) {
        throw new AppError("User ID is required", 400);
    }

    if (
        !subscription ||
        !subscription.endpoint ||
        !subscription.keys?.p256dh ||
        !subscription.keys?.auth
    ) {
        throw new AppError(
            "Invalid push subscription",
            400
        );
    }

    const result = await pool.query(
        `
        INSERT INTO push_subscriptions
            (user_id, endpoint, p256dh, auth)
        VALUES
            ($1, $2, $3, $4)
        ON CONFLICT (endpoint)
        DO UPDATE SET
            user_id = EXCLUDED.user_id,
            p256dh = EXCLUDED.p256dh,
            auth = EXCLUDED.auth,
            updated_at = NOW()
        RETURNING
            id,
            user_id,
            endpoint,
            created_at,
            updated_at
        `,
        [
            userId,
            subscription.endpoint,
            subscription.keys.p256dh,
            subscription.keys.auth,
        ]
    );

    return result.rows[0];
};


// Send push notification
export const sendPushNotification = async ({
    userId,
    title,
    message,
    data = {},
}) => {
    if (!userId) {
        throw new AppError("User ID is required", 400);
    }

    const result = await pool.query(
        `
        SELECT
            id,
            endpoint,
            p256dh,
            auth
        FROM push_subscriptions
        WHERE user_id = $1
        `,
        [userId]
    );

    const subscriptions = result.rows;

    if (subscriptions.length === 0) {
        return {
            sent: 0,
            message: "No push subscription found",
        };
    }

    const payload = JSON.stringify({
        title,
        message,
        data,
    });

    let sent = 0;

    for (const subscription of subscriptions) {
        try {
            await webpush.sendNotification(
                {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth,
                    },
                },
                payload
            );

            sent++;
        } catch (error) {
            // Subscription expired or is no longer valid
            if (
                error.statusCode === 404 ||
                error.statusCode === 410
            ) {
                await pool.query(
                    `
                    DELETE FROM push_subscriptions
                    WHERE id = $1
                    `,
                    [subscription.id]
                );
            }
        }
    }

    return {
        sent,
    };
};