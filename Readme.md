# WalletX

A full-stack digital wallet application built with **React, Node.js, Express, PostgreSQL, and Redis**, designed to demonstrate secure authentication, transactional money transfers, caching, and scalable backend architecture.

> WalletX manages virtual wallet balances and does not process real bank/UPI funds.

## Tech Stack

**Frontend**

* React.js
* Bootstrap
* Axios

**Backend**

* Node.js
* Express.js
* PostgreSQL
* Redis
* JWT
* Argon2id

## Key Features

* User registration and authentication
* JWT access/refresh authentication using HttpOnly cookies
* Automatic wallet creation
* Phone-number-based recipient lookup
* UPI PIN protection with Argon2id
* Secure wallet-to-wallet transfers
* PostgreSQL transactions and row locking
* Idempotency protection for transfers
* Transaction and ledger records
* PDF wallet statements
* Redis caching
* Notifications and Web Push support
* Centralized error handling
* Responsive React frontend

## Architecture

```text
React + Bootstrap
       │
     Axios
       │
       ▼
Node.js + Express
       │
   ┌───┴────┐
   ▼        ▼
Redis   PostgreSQL
Cache     Database
```

Backend follows a layered structure:

```text
Routes → Controllers → Services → Database
                     ↓
                   Redis
```

## Project Structure

```text
WalletX/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── services/
│   └── package.json
│
└── README.md
```

## Requirements

* Node.js
* npm
* PostgreSQL
* Redis
* Git

## Environment Variables

### Backend

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=your_postgresql_connection_string
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

### Frontend

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Do not commit `.env` files or real secrets.

## Installation & Running

### 1. Start PostgreSQL and Redis

Make sure PostgreSQL is running and the `walletX` database exists.

Start Redis:

```bash
docker compose up -d
```

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:3000
```

### 3. Start Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on the Vite development URL, typically:

```text
http://localhost:5173
```

## Engineering Practices

WalletX demonstrates:

* **Layered architecture** — routes, controllers, services and database logic are separated.
* **ACID transactions** — balance updates and related transaction records are handled atomically.
* **Concurrency control** — wallet rows are locked during transfers to prevent inconsistent balances.
* **Idempotency** — transfer requests use idempotency keys to prevent duplicate processing.
* **Database indexing** — frequently searched fields such as email and phone number are indexed.
* **Caching** — Redis reduces repeated database reads for suitable data.
* **Centralized error handling** — application errors are handled consistently through middleware.
* **Security** — JWT authentication, HttpOnly cookies and Argon2id protect authentication and wallet operations.
* **Connection pooling** — PostgreSQL connections are reused instead of creating a new connection for every request.

## API

Base URL:

```text
/api/v1
```

Main API groups:

```text
/auth
/users
/wallet
/transactions
/notifications
/ledger
```

## Development

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

For API verification, tools such as **Postman** or browser developer tools can be used.

## Database Schema

WalletX uses PostgreSQL with relational constraints, foreign keys, unique constraints, and indexes for frequently queried fields.

### Users

| Column         | Type      | Constraints      |
| -------------- | --------- | ---------------- |
| `id`           | UUID      | Primary Key      |
| `name`         | VARCHAR   | NOT NULL         |
| `email`        | VARCHAR   | UNIQUE, NOT NULL |
| `phone_number` | VARCHAR   | UNIQUE, NOT NULL |
| `password`     | TEXT      | NOT NULL         |
| `provider`     | VARCHAR   | DEFAULT `local`  |
| `provider_id`  | VARCHAR   | Indexed          |
| `role`         | VARCHAR   | DEFAULT `user`   |
| `is_active`    | BOOLEAN   | DEFAULT `true`   |
| `created_at`   | TIMESTAMP | —                |

### Wallets

| Column       | Type        | Constraints               |
| ------------ | ----------- | ------------------------- |
| `id`         | UUID        | Primary Key               |
| `user_id`    | UUID        | FK → `users.id`, UNIQUE   |
| `wallet_id`  | VARCHAR(16) | UNIQUE                    |
| `balance`    | NUMERIC     | DEFAULT `50000.00`        |
| `currency`   | VARCHAR     | DEFAULT `INR`             |
| `status`     | VARCHAR     | ACTIVE / BLOCKED / CLOSED |
| `created_at` | TIMESTAMP   | —                         |

### Wallet Security

| Column            | Type      | Constraints       |
| ----------------- | --------- | ----------------- |
| `id`              | UUID      | Primary Key       |
| `wallet_id`       | UUID      | FK → `wallets.id` |
| `upi_pin_hash`    | TEXT      | Argon2id hash     |
| `failed_attempts` | INTEGER   | DEFAULT `0`       |
| `locked_until`    | TIMESTAMP | Nullable          |
| `pin_created_at`  | TIMESTAMP | Nullable          |
| `pin_reset_at`    | TIMESTAMP | Nullable          |

### Transactions

| Column               | Type      | Constraints        |
| -------------------- | --------- | ------------------ |
| `id`                 | UUID      | Primary Key        |
| `sender_wallet_id`   | UUID      | FK → `wallets.id`  |
| `receiver_wallet_id` | UUID      | FK → `wallets.id`  |
| `amount`             | NUMERIC   | NOT NULL           |
| `currency`           | VARCHAR   | INR                |
| `status`             | VARCHAR   | Transaction status |
| `reference_id`       | VARCHAR   | Unique             |
| `created_at`         | TIMESTAMP | —                  |

### Ledger Entries

| Column           | Type      | Constraints            |
| ---------------- | --------- | ---------------------- |
| `id`             | UUID      | Primary Key            |
| `transaction_id` | UUID      | FK → `transactions.id` |
| `wallet_id`      | UUID      | FK → `wallets.id`      |
| `entry_type`     | VARCHAR   | DEBIT / CREDIT         |
| `amount`         | NUMERIC   | NOT NULL               |
| `balance_after`  | NUMERIC   | NOT NULL               |
| `created_at`     | TIMESTAMP | —                      |

### Idempotency Keys

| Column       | Type      | Constraints     |
| ------------ | --------- | --------------- |
| `id`         | UUID      | Primary Key     |
| `user_id`    | UUID      | FK → `users.id` |
| `key`        | VARCHAR   | Unique per user |
| `response`   | JSONB     | Stored result   |
| `created_at` | TIMESTAMP | —               |

### Notifications

| Column       | Type      | Constraints       |
| ------------ | --------- | ----------------- |
| `id`         | UUID      | Primary Key       |
| `user_id`    | UUID      | FK → `users.id`   |
| `title`      | VARCHAR   | NOT NULL          |
| `message`    | TEXT      | NOT NULL          |
| `type`       | VARCHAR   | Notification type |
| `is_read`    | BOOLEAN   | DEFAULT `false`   |
| `created_at` | TIMESTAMP | —                 |

### Relationships

```text
users
  │
  └── 1 : 1 ── wallets
                 │
                 └── 1 : 1 ── wallet_security

users
  │
  ├── 1 : N ── transactions
  │
  └── 1 : N ── notifications

transactions
  │
  └── 1 : N ── ledger_entries
```

### Database Engineering

* PostgreSQL transactions ensure atomic wallet transfers.
* Foreign keys maintain referential integrity.
* Unique constraints prevent duplicate users, wallets, and idempotency keys.
* Indexes optimize frequently used lookups such as email and phone-number recipient searches.
* PostgreSQL connection pooling manages database connections efficiently.



## Future Improvements

* Automated unit/integration testing
* CI/CD pipeline
* Rate limiting
* Structured logging and monitoring
* Production deployment
* Load testing
* Database migrations

## License

This project is developed as a software engineering portfolio project.
