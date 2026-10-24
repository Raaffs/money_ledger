# MiniLedger 💳

A modern, full-stack application designed to track money lent to and borrowed from friends with complete transparency, partial repayment installments, automated status transitions, and overdue tracking.

---

## 🛠️ Built With

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-58-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![JWT](https://img.shields.io/badge/JWT-Tokens-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

---

## ✨ Features

- **Passwordless Phone Login**: Quick 2-step OTP flow (`request-otp` ➔ `verify-otp`) with signed JWT sessions.
- **Two-Sided Ledger**: Tracks both sides of every transaction (Lender and Borrower are both registered users).
- **Flexible Installments**: Borrowers can repay in partial chunks (e.g., ₹100, ₹200) or settle in full.
- **Automated State Machine**: Loans automatically transition (`PENDING` ➔ `PARTIALLY_PAID` ➔ `REPAID`) based on the sum of logged installments.
- **Overdue Detection**: Highlights overdue loans past their due date and factors them into summary calculations.
- **Dashboard Metrics**: Real-time aggregated financial summary: `total_lent`, `total_repaid`, and `overdue_amount`.
- **True Cross-Platform**: React Native frontend runs directly in Chrome (via Expo Web) and on native iOS/Android (via Expo Go).

---

## 🚀 Getting Started & Setup Instructions

### 1. Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher; v22 recommended)
- [PostgreSQL](https://www.postgresql.org/) running locally on port `5432`

---

### 2. Installation

Clone the repository and install dependencies for both the backend and mobile apps:

```bash
# 1. Install root & backend dependencies
npm install

# 2. Install mobile app dependencies
cd mobile && npm install && cd ..
```

---

### 3. Environment Variables Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Verify the values in your `.env`:

```env
PORT=5000
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=loan_share
DATABASE_URL=postgresql://postgres:root@localhost:5432/loan_share

# JWT Secret
JWT_SECRET=miniledger_super_secret_jwt_key_2026_x89q2
JWT_EXPIRES_IN=7d
```

---

### 4. Database Setup & Migrations

#### Step A: Create the Database
Ensure your PostgreSQL server is running, then create the `loan_share` database:

```bash
# Using psql (enter password when prompted)
psql -U postgres -h localhost -c "CREATE DATABASE loan_share;"
```

#### Step B: Run Database Migrations
Migrations are written in pure, standard **`.sql`** format (`-- Up Migration` and `-- Down Migration` sections) and managed via **`node-pg-migrate`**:

```bash
# Apply all up migrations
npm run migrate:up
```

---

### 5. Running the Application

You can run the application in two ways: **Local Development** (no external tunnels required) or **Remote / Ngrok Tunnel** (to test on a real phone over the internet).

#### Method A: Local Development (Default — No Ngrok Required)

Open **two terminal tabs** in the project root:

**Terminal 1 — Start Backend Server:**
```bash
npm run dev
```
- API Server runs at: **`http://localhost:5000`**
- Health check: **`http://localhost:5000/health`**

**Terminal 2 — Start Frontend (Web / Emulator / Local LAN):**
```bash
# Option 1: Run in Chrome / Web Browser (Fastest)
npm run mobile:web

# Option 2: Run in Android Emulator
npm run android

# Option 3: Run on local Wi-Fi for Expo Go (same network)
npm run mobile
```
*(By default, the mobile app automatically communicates with `http://localhost:5000/api` on Web and `http://10.0.2.2:5000/api` on the Android emulator)*

---

#### Method B: Remote Device Testing via Ngrok Tunnel

If you want to test the app on a physical phone that is on mobile data or a different Wi-Fi network, you can route both the backend and Expo bundler through your own ngrok tunnel:

1. **Start the backend server:**
   ```bash
   npm run dev
   ```

2. **Start your own ngrok tunnel** forwarding to port 5000:
   ```bash
   # Via native ngrok CLI:
   ngrok http 5000

   # Or via Docker:
   docker run --net=host -it -e NGROK_AUTHTOKEN=<YOUR_TOKEN> ngrok/ngrok:latest http 5000
   ```
   *Copy your generated forwarding URL (e.g., `https://your-domain.ngrok-free.dev`).*

3. **Start Expo with your ngrok URL:**
   ```bash
   EXPO_PUBLIC_NGROK_URL=https://your-domain.ngrok-free.dev npm run mobile:tunnel
   ```
   *(Or save `EXPO_PUBLIC_NGROK_URL=https://your-domain.ngrok-free.dev` inside `mobile/.env` and run `npm run mobile:tunnel`)*

4. **Scan the QR Code** in the **Expo Go** app on your phone.

---

### 6. Development Authentication Note

When logging in from the mobile interface:
1. Enter any 10-digit phone number (e.g., `9876543210`). The app automatically prepends `+91`.
2. Tap **"Get Verification Code"**.
3. Use the mock OTP:
   ```
   123456
   ```
4. You will instantly receive a JWT session and arrive at the dashboard!

---

## 📡 API Endpoints Reference

All endpoints (except public auth) require the header:  
`Authorization: Bearer <jwt_token>`

| Category | Method | Endpoint | Auth | Description | Request Body / Params |
|---|---|---|---|---|---|
| **System** | `GET` | `/health` | No | Server health check | — |
| **Auth** | `POST` | `/api/auth/request-otp` | No | Generate & log mock OTP | `{"phone": "+919876543210"}` |
| **Auth** | `POST` | `/api/auth/verify-otp` | No | Verify OTP & return JWT token | `{"phone": "+919876543210", "otp": "123456"}` |
| **User** | `GET` | `/api/users/me` | Yes | Get authenticated user profile | — |
| **Loans** | `GET` | `/api/loans/summary` | Yes | Get total lent, repaid & overdue metrics | — |
| **Loans** | `GET` | `/api/loans` | Yes | List user loans (lent & borrowed) | Optional Query: `status`, `startDate`, `endDate` |
| **Loans** | `POST` | `/api/loans` | Yes | Create a new loan entry to a friend | `{"borrowerIdentifier": "alice", "amount": 1000, "dueDate": "2026-11-01", "notes": "Dinner"}` |
| **Loans** | `GET` | `/api/loans/:id` | Yes | Get loan details with all payments | — |
| **Loans** | `POST` | `/api/loans/:id/payments` | Yes | Record a partial or full repayment | `{"amount": 300, "notes": "UPI Part 1"}` |

---

## 🗄️ Database Schema & ERD

```mermaid
erDiagram
    users ||--o{ loans : "lends (as lender)"
    users ||--o{ loans : "borrows (as borrower)"
    users ||--o{ otp_verifications : "requests"
    loans ||--o{ loan_payments : "has installments"

    users {
        uuid id PK "gen_random_uuid()"
        varchar phone UK "E.164 phone number"
        varchar username UK "Unique user handle"
        varchar display_name "Display / full name"
        timestamptz created_at
        timestamptz updated_at
    }

    otp_verifications {
        uuid id PK "gen_random_uuid()"
        varchar phone
        varchar otp_code "Mock OTP (123456)"
        timestamptz expires_at
        timestamptz consumed_at "Null until verified"
        timestamptz created_at
    }

    loans {
        uuid id PK "gen_random_uuid()"
        uuid lender_id FK "References users(id)"
        uuid borrower_id FK "References users(id)"
        numeric principal_amount "Amount > 0"
        date due_date "Repayment deadline"
        loan_status status "PENDING, PARTIALLY_PAID, REPAID"
        text notes "Optional description"
        timestamptz created_at
        timestamptz updated_at
    }

    loan_payments {
        uuid id PK "gen_random_uuid()"
        uuid loan_id FK "References loans(id) ON DELETE CASCADE"
        numeric amount "Installment amount > 0"
        timestamptz paid_at
        text notes "Optional payment note"
        timestamptz created_at
    }
```
---

## 📂 Project Directory Structure

```
loan-share/
├── migrations/                  # Pure .sql migration files
│   └── 1792746511161_init-schema.sql
├── mobile/                      # React Native (Expo) frontend
│   ├── src/
│   │   ├── api/                 # Dynamic API client (local / ngrok)
│   │   ├── components/          # SummaryCards, LoanTable, CreateLoanModal, Calendar
│   │   ├── context/             # AuthContext (JWT session state)
│   │   ├── screens/             # PhoneLoginScreen, OtpVerifyScreen, DashboardScreen, LoanDetailScreen
│   │   ├── theme/               # Modern dark color palette
│   │   └── types/               # TypeScript interfaces
│   ├── App.tsx                  # Root navigation component
│   └── package.json
├── src/                         # Node.js + TypeScript backend
│   ├── config/                  # Environment loader
│   ├── db/                      # PostgreSQL connection pool & error handler
│   ├── middlewares/             # JWT auth & clean error handler
│   ├── models/                  # Data access layer (User, Loan, Payment, OTP models)
│   ├── modules/                 # Modular domains (auth, user, loan)
│   └── index.ts                 # Express server entry point
├── .env.example
├── package.json
└── tsconfig.json
```
