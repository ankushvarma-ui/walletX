import pool from "../config/db.js";

const User = {

    // ================= FIND BY EMAIL =================

    async findByEmail(
        email,
        client = pool
    ) {

        const result =
            await client.query(
                `
                SELECT
                    id,
                    name,
                    email,
                    phone_number,
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


    // ================= FIND BY ID =================

    async findById(
        id,
        client = pool
    ) {

        const result =
            await client.query(
                `
                SELECT
                    id,
                    name,
                    email,
                    phone_number,
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


    // ================= FIND BY PHONE =================

    async findByPhoneNumber(
        phoneNumber,
        client = pool
    ) {

        const result =
            await client.query(
                `
                SELECT
                    id,
                    name,
                    email,
                    phone_number,
                    password,
                    provider,
                    provider_id,
                    role,
                    is_active,
                    created_at,
                    updated_at
                FROM users
                WHERE phone_number = $1
                `,
                [phoneNumber]
            );

        return result.rows[0] || null;
    },


    // ================= CREATE USER =================

    async create(
        {
            name,
            email,
            phoneNumber,
            password,
            provider = "local",
            providerId = null,
            role = "user"
        },
        client = pool
    ) {

        const result =
            await client.query(
                `
                INSERT INTO users (
                    name,
                    email,
                    phone_number,
                    password,
                    provider,
                    provider_id,
                    role
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7
                )
                RETURNING
                    id,
                    name,
                    email,
                    phone_number,
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
                    phoneNumber,
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