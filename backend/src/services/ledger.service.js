import {
    createLedgerEntry,
    getLedgerEntriesByWallet
} from "../models/ledger.js";


export const createDebitLedger = async (
    client,
    {
        transactionId,
        walletId,
        amount,
        balanceBefore,
        balanceAfter,
        description
    }
) => {

    return await createLedgerEntry(client, {
        transactionId,
        walletId,
        entryType: "DEBIT",
        amount,
        balanceBefore,
        balanceAfter,
        description
    });
};


export const createCreditLedger = async (
    client,
    {
        transactionId,
        walletId,
        amount,
        balanceBefore,
        balanceAfter,
        description
    }
) => {

    return await createLedgerEntry(client, {
        transactionId,
        walletId,
        entryType: "CREDIT",
        amount,
        balanceBefore,
        balanceAfter,
        description
    });
};


export const getWalletLedger = async (
    walletId,
    page = 1,
    limit = 20
) => {

    const offset = (page - 1) * limit;

    return await getLedgerEntriesByWallet(
        walletId,
        limit,
        offset
    );
};