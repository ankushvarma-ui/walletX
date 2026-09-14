import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    user: "postgres",
    password: "Ankush@3373",
    host: "localhost",
    port: 5432,
    database: "walletX",

    ssl: false,

    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", error);
});

export const connectDB = async () => {
    const client = await pool.connect();

    try {
        await client.query("SELECT 1");
        console.log("PostgreSQL connected");
    } finally {
        client.release();
    }
};

export default pool;