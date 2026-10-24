export const createIdempotencyKey = async (
    client,
    {
        userId,
        idempotencyKey,
        requestHash
    }
) => {

    const query = `
        INSERT INTO idempotency_keys (
            user_id,
            idempotency_key,
            request_hash,
            status
        )
        VALUES ($1, $2, $3, 'PROCESSING')
        ON CONFLICT (user_id, idempotency_key)
        DO NOTHING
        RETURNING *;
    `;

    const result = await client.query(query, [
        userId,
        idempotencyKey,
        requestHash
    ]);

    return result.rows[0] || null;
};


export const getIdempotencyKeyForUpdate = async (
    client,
    {
        userId,
        idempotencyKey
    }
) => {

    const query = `
        SELECT
            id,
            user_id,
            idempotency_key,
            request_hash,
            transaction_id,
            status,
            response_data,
            response_status,
            created_at,
            updated_at
        FROM idempotency_keys
        WHERE user_id = $1
          AND idempotency_key = $2
        FOR UPDATE;
    `;

    const result = await client.query(query, [
        userId,
        idempotencyKey
    ]);

    return result.rows[0] || null;
};


export const completeIdempotencyKey = async (
    client,
    {
        idempotencyId,
        transactionId,
        responseData,
        responseStatus = 200
    }
) => {

    const query = `
        UPDATE idempotency_keys
        SET
            status = 'COMPLETED',
            transaction_id = $2,
            response_data = $3,
            response_status = $4,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *;
    `;

    const result = await client.query(query, [
        idempotencyId,
        transactionId,
        JSON.stringify(responseData),
        responseStatus
    ]);

    return result.rows[0];
};