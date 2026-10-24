import AppError from "../utils/errors.js";


// ================= VALIDATE RECIPIENT PHONE =================

export const validateRecipientPhone = (
    req,
    res,
    next
) => {

    let {
        phoneNumber
    } = req.body;


    // ================= REQUIRED =================

    if (
        phoneNumber === undefined ||
        phoneNumber === null
    ) {

        return next(
            new AppError(
                "Phone number is required",
                400
            )
        );
    }


    // ================= TYPE =================

    if (
        typeof phoneNumber !== "string"
    ) {

        return next(
            new AppError(
                "Phone number must be a string",
                400
            )
        );
    }


    // ================= NORMALIZE =================

    phoneNumber =
        phoneNumber
            .trim()
            .replace(/\s+/g, "");


    // ================= EMPTY =================

    if (!phoneNumber) {

        return next(
            new AppError(
                "Phone number is required",
                400
            )
        );
    }


    // ================= VALIDATE =================

    if (
        !/^[6-9]\d{9}$/.test(
            phoneNumber
        )
    ) {

        return next(
            new AppError(
                "Enter a valid 10-digit phone number",
                400
            )
        );
    }


    // ================= SAVE NORMALIZED VALUE =================

    req.body.phoneNumber =
        phoneNumber;


    next();
};