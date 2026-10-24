import express from "express";

import {
    createWalletController,
    getMyWalletController
} from "../controllers/wallet.controller.js";

import authMiddleware
    from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    createWalletController
);

router.get(
    "/me",
    authMiddleware,
    getMyWalletController
);

router.get(
    "/",
    authMiddleware,
    getMyWalletController
);

export default router;