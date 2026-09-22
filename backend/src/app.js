import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";
import walletRoutes from "./routes/wallet.routes.js";
import walletSecurityRoutes from "./routes/walletSecurity.routes.js"; 
import transactionRoutes from "./routes/transaction.routes.js";
import ledgerRoutes from "./routes/ledger.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use(
    "/api/v1/wallet",
    walletRoutes
);
app.use(
    "/api/notifications",
    notificationRoutes
);
app.use("/api/transactions", transactionRoutes);
app.use(
  "/api/v1/wallet-security",
  walletSecurityRoutes
);
app.use("/api/ledger", ledgerRoutes);


//404 handler
app.use((req, res, next) => {

  res.status(404).json({
    success: false,
    message: "Route not found"
  });

});


app.use(errorMiddleware);

export default app;