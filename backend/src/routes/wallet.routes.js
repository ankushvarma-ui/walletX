import express from "express";

import {
    createWalletController
} from "../controllers/wallet.controller.js";

import authMiddleware
    from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    createWalletController
);

export default router;