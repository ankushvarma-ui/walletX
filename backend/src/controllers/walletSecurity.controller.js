import {
    setUpiPin,
    isUpiPinSet,
    verifyUpiPin
} from "../services/walletSecurity.service.js";

export const setUpiPinController = async (req, res) => {
    const {
        currentPassword,
        upiPin,
        confirmUpiPin
    } = req.body;

    const result = await setUpiPin({
        userId: req.userId,
        currentPassword,
        upiPin,
        confirmUpiPin
    });

    res.status(201).json({
        success: true,
        message: "UPI PIN created successfully",
        data: result
    });
};


export const checkUpiPinController = async (req, res) => {
    const pinSet = await isUpiPinSet(req.userId);

    res.status(200).json({
        success: true,
        data: {
            pinSet
        }
    });
};


export const verifyUpiPinController = async (req, res) => {
    const { upiPin } = req.body;

    const result = await verifyUpiPin(
        req.userId,
        upiPin
    );

    res.status(200).json({
        success: true,
        message: "UPI PIN verified successfully",
        data: result
    });
};