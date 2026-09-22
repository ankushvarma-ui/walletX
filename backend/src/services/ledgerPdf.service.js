import PDFDocument from "pdfkit";

export const generateLedgerPdf = (
    res,
    {
        walletId,
        entries,
        fromDate,
        toDate
    }
) => {
    const doc = new PDFDocument({
        size: "A4",
        margin: 40
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        'attachment; filename="walletX-statement.pdf"'
    );

    doc.pipe(res);

    // HEADER
    doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("WALLETX", { align: "center" });

    doc
        .moveDown(0.3)
        .fontSize(14)
        .text("ACCOUNT STATEMENT", { align: "center" });

    doc.moveDown(1);

    // ACCOUNT DETAILS
    doc
        .font("Helvetica")
        .fontSize(10)
        .text(`Wallet ID: ${walletId}`);

    if (fromDate || toDate) {
        doc.text(
            `Period: ${fromDate || "Beginning"} to ${toDate || "Present"}`
        );
    }

    doc.moveDown(1);

    // TOTALS
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
        if (entry.debit) {
            totalDebit += Number(entry.debit);
        }

        if (entry.credit) {
            totalCredit += Number(entry.credit);
        }
    }

    const closingBalance =
        entries.length > 0
            ? Number(entries[entries.length - 1].balance)
            : 0;

    const openingBalance =
        entries.length > 0
            ? closingBalance + totalDebit - totalCredit
            : 0;

    // SUMMARY
    doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("STATEMENT SUMMARY");

    doc.moveDown(0.4);

    doc
        .font("Helvetica")
        .fontSize(9)
        .text(`Opening Balance: ₹${openingBalance.toFixed(2)}`);

    doc.text(`Total Debit: ₹${totalDebit.toFixed(2)}`);

    doc.text(`Total Credit: ₹${totalCredit.toFixed(2)}`);

    doc.text(`Closing Balance: ₹${closingBalance.toFixed(2)}`);

    doc.moveDown(1);

    // TABLE
    const tableTop = doc.y;

    const columns = {
        date: 40,
        transaction: 115,
        description: 190,
        debit: 320,
        credit: 385,
        balance: 455
    };

    drawTableHeader(doc, tableTop, columns);

    let y = tableTop + 25;

    for (const entry of entries) {
        if (y > 730) {
            doc.addPage();

            y = 50;

            drawTableHeader(doc, y, columns);

            y += 25;
        }

        const date = entry.date
            ? formatDate(entry.date)
            : "-";

        const transaction = entry.transaction
            ? String(entry.transaction).substring(0, 10)
            : "-";

        const description = entry.description || "-";

        const debit = entry.debit
            ? `₹${Number(entry.debit).toFixed(2)}`
            : "-";

        const credit = entry.credit
            ? `₹${Number(entry.credit).toFixed(2)}`
            : "-";

        const balance = entry.balance
            ? `₹${Number(entry.balance).toFixed(2)}`
            : "-";

        doc
            .font("Helvetica")
            .fontSize(7);

        doc.text(
            date,
            columns.date,
            y,
            { width: 70 }
        );

        doc.text(
            transaction,
            columns.transaction,
            y,
            { width: 70 }
        );

        doc.text(
            description,
            columns.description,
            y,
            { width: 120 }
        );

        doc.text(
            debit,
            columns.debit,
            y,
            {
                width: 60,
                align: "right"
            }
        );

        doc.text(
            credit,
            columns.credit,
            y,
            {
                width: 60,
                align: "right"
            }
        );

        doc.text(
            balance,
            columns.balance,
            y,
            {
                width: 70,
                align: "right"
            }
        );

        doc
            .moveTo(40, y + 20)
            .lineTo(555, y + 20)
            .stroke();

        y += 30;
    }

    // FOOTER
    doc
        .font("Helvetica")
        .fontSize(8)
        .text(
            "This statement is generated electronically by WalletX.",
            40,
            780,
            {
                width: 515,
                align: "center"
            }
        );

    doc.end();
};

const drawTableHeader = (doc, y, columns) => {
    doc
        .font("Helvetica-Bold")
        .fontSize(8);

    doc.text("DATE", columns.date, y);

    doc.text(
        "TRANSACTION",
        columns.transaction,
        y
    );

    doc.text(
        "DESCRIPTION",
        columns.description,
        y
    );

    doc.text(
        "DEBIT",
        columns.debit,
        y,
        {
            width: 60,
            align: "right"
        }
    );

    doc.text(
        "CREDIT",
        columns.credit,
        y,
        {
            width: 60,
            align: "right"
        }
    );

    doc.text(
        "BALANCE",
        columns.balance,
        y,
        {
            width: 70,
            align: "right"
        }
    );

    doc
        .moveTo(40, y + 15)
        .lineTo(555, y + 15)
        .stroke();
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
};