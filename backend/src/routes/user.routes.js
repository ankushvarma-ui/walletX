import express from "express";

import authMiddleware
    from "../middleware/auth.middleware.js";

import {
    validateRecipientPhone
} from "../middleware/validate.middleware.js";

import {
    getProfile,
    findRecipient
} from "../controllers/user.controller.js";


const router = express.Router();


// ================= PROFILE =================

router.get(
    "/me",
    authMiddleware,
    getProfile
);


// ================= FIND RECIPIENT =================

router.post(
    "/recipient",
    authMiddleware,
    validateRecipientPhone,
    findRecipient
);


export default router;