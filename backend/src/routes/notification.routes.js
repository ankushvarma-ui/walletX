import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";

import {
    getNotifications,
    readNotification,
    readAllNotifications,
    subscribeToPush,
} from "../controllers/notification.controller.js";

const router = express.Router();


router.get(
    "/",
    authMiddleware,
    getNotifications
);


router.patch(
    "/:notificationId/read",
    authMiddleware,
    readNotification
);


router.patch(
    "/read-all",
    authMiddleware,
    readAllNotifications
);


router.post(
    "/push/subscribe",
    authMiddleware,
    subscribeToPush
);


export default router;