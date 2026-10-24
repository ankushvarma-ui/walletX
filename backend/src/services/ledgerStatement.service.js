export const formatLedgerEntry = (entry) => {

    return {
        date: entry.created_at,

        transaction: entry.transaction_id,

        description: entry.description || "Wallet transaction",

        debit:
            entry.entry_type === "DEBIT"
                ? entry.amount
                : null,

        credit:
            entry.entry_type === "CREDIT"
                ? entry.amount
                : null,

        balance: entry.balance_after,

        currency: entry.currency
    };
};


export const formatLedgerStatement = (entries) => {

    return entries.map(formatLedgerEntry);
};