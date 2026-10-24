import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import pool from "./config/db.js";
import redis from "./config/redis.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";
import walletRoutes from "./routes/wallet.routes.js";
import walletSecurityRoutes from "./routes/walletSecurity.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import ledgerRoutes from "./routes/ledger.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// ================= API v1 Routes =================
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/wallet-security", walletSecurityRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/ledger", ledgerRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// ================= Legacy Route Aliases =================
app.use("/api/transactions", transactionRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/notifications", notificationRoutes);

// ================= Health Check =================
// Verifies application server, PostgreSQL, and Redis connectivity.
// Used by the frontend startup screen and health checking hook.
const healthCheckHandler = async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    server: "ok",
    database: "checking",
    cache: "checking",
  };

  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    checks.database = "connected";
  } catch (error) {
    console.error("Database health check failed:", error.message);
    checks.database = "disconnected";
  }

  try {
    await redis.ping();
    checks.cache = "connected";
  } catch (error) {
    console.error("Redis health check failed:", error.message);
    checks.cache = "disconnected";
  }

  const allHealthy = checks.database === "connected" && checks.cache === "connected";

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    message: allHealthy ? "WalletX backend is healthy" : "Some services unavailable",
    checks,
  });
};

app.get("/api/v1/health", healthCheckHandler);
app.get("/health", healthCheckHandler);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

export default app;