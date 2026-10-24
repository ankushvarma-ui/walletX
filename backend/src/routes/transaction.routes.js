import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import {
    transferMoneyController
} from "../controllers/transaction.controller.js";

const router = express.Router();

// Transfer virtual money
router.post(
    "/transfer",
    authMiddleware,
    transferMoneyController
);

export default router;