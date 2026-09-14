import pool from "../config/db.js";

const User = {

    async findByEmail(email, client = pool) {

        const result = await client.query(
            `
            SELECT
                id,
                name,
                email,
                password,
                provider,
                provider_id,
                role,
                is_active,
                created_at,
                updated_at
            FROM users
            WHERE email = $1
            `,
            [email]
        );

        return result.rows[0] || null;
    },


    async findById(id, client = pool) {

        const result = await client.query(
            `
            SELECT
                id,
                name,
                email,
                password,
                provider,
                provider_id,
                role,
                is_active,
                created_at,
                updated_at
            FROM users
            WHERE id = $1
            `,
            [id]
        );

        return result.rows[0] || null;
    },


    async create({
        name,
        email,
        password,
        provider = "local",
        providerId = null,
        role = "user"
    }, client = pool) {

        const result = await client.query(
            `
            INSERT INTO users (
                name,
                email,
                password,
                provider,
                provider_id,
                role
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id,
                name,
                email,
                password,
                provider,
                provider_id,
                role,
                is_active,
                created_at,
                updated_at
            `,
            [
                name,
                email,
                password,
                provider,
                providerId,
                role
            ]
        );

        return result.rows[0];
    }
};

export default User;