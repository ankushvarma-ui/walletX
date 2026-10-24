import express from "express";

import {
    getMyLedger
} from "../controllers/ledger.controller.js";

import {
    downloadLedgerPdf
} from "../controllers/ledgerPdf.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    getMyLedger
);

router.get(
    "/pdf",
    authMiddleware,
    downloadLedgerPdf
);

export default router;