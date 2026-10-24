import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateWalletId = () => {
    let walletId = "WX";

    for (let i = 0; i < 12; i++) {
        walletId += ALPHABET[
            crypto.randomInt(0, ALPHABET.length)
        ];
    }

    return walletId;
};