import crypto from "crypto";


export const generateRequestHash = ({
    receiverWalletId,
    amount
}) => {

    const requestData = JSON.stringify({
        receiverWalletId,
        amount: String(amount)
    });

    return crypto
        .createHash("sha256")
        .update(requestData)
        .digest("hex");
};