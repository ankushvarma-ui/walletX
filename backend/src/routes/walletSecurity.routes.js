import express from "express";

import {
    setUpiPinController,
    checkUpiPinController,
    verifyUpiPinController
} from "../controllers/walletSecurity.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/set-pin",
    authMiddleware,
    setUpiPinController
);

router.get(
    "/pin-status",
    authMiddleware,
    checkUpiPinController
);

router.post(
    "/verify-pin",
    authMiddleware,
    verifyUpiPinController
);

export default router;