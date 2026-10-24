import asyncHandler from "../utils/asyncHandler.js";

import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from "../services/notification.service.js";

import {
    savePushSubscription,
} from "../services/push.service.js";


export const getNotifications = asyncHandler(
    async (req, res) => {
        const userId = req.user.id;

        const {
            limit = 20,
            offset = 0,
        } = req.query;

        const notifications =
            await getUserNotifications(
                userId,
                {
                    limit,
                    offset,
                }
            );

        res.status(200).json({
            success: true,
            notifications,
        });
    }
);


export const readNotification = asyncHandler(
    async (req, res) => {
        const userId = req.user.id;

        const { notificationId } =
            req.params;

        const notification =
            await markNotificationAsRead(
                notificationId,
                userId
            );

        res.status(200).json({
            success: true,
            message:
                "Notification marked as read",
            notification,
        });
    }
);


export const readAllNotifications =
    asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const result =
            await markAllNotificationsAsRead(
                userId
            );

        res.status(200).json({
            success: true,
            message:
                "All notifications marked as read",
            updatedCount:
                result.updatedCount,
        });
    });


export const subscribeToPush =
    asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const subscription = req.body;

        const savedSubscription =
            await savePushSubscription({
                userId,
                subscription,
            });

        res.status(201).json({
            success: true,
            message:
                "Push notification subscription saved",
            subscription: savedSubscription,
        });
    });