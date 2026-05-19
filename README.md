# Car Rental System

Full-stack car rental application with **Client Portal** and **Admin Dashboard**.

- **Backend:** Node.js, Express, PostgreSQL, JWT, **Paystack** (payments)
- **Frontend:** React (Vite), React Router, Tailwind CSS

## Phase 1

- User authentication (register, login, profile)
- Database schema with Paystack payment fields
- Landing page, login/register, protected `/dashboard` and `/admin` routes

## Phase 2

- Vehicle search by date range (fuel/transmission filters)
- Booking creation with tax + deposit calculation
- Paystack deposit payment (initialize, verify, webhook)
- My reservations with cancellation + refund policy

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Database

```bash
createdb rental_service
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, PAYSTACK_* keys

npm install
npm run db:migrate
npm run db:seed-admin
npm run db:seed-vehicles
npm run dev
```

Default admin (after seed): `admin@rental.local` / `Admin123!`

Override with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` in `.env`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — API is proxied to http://localhost:5000.

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs (7-day expiry) |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (Phase 2+) |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key (frontend, Phase 2+) |
| `EMAIL_SERVICE_API_KEY` | Email provider API key (Phase 4) |
| `CLIENT_URL` | Frontend origin for CORS |

## API

### Auth

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public (role: client) |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| PUT | `/api/auth/profile` | Authenticated |

### Vehicles & bookings (Phase 2)

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/vehicles?start_date&end_date` | Public |
| GET | `/api/vehicles/:id` | Public |
| POST | `/api/bookings` | Client |
| GET | `/api/bookings/my-bookings` | Client |
| GET | `/api/bookings/:id` | Client |
| POST | `/api/bookings/:id/cancel` | Client |
| POST | `/api/payments/initialize` | Client |
| POST | `/api/payments/verify` | Client |
| POST | `/api/payments/webhook` | Paystack |

## Paystack (vs Stripe)

All payment flows use **Paystack** instead of Stripe:

- `payments.paystack_reference` — transaction reference from initialize
- `payments.paystack_transaction_id` — confirmed transaction ID from webhook
- Deposit/refund via [Paystack API](https://paystack.com/docs/api/)

Set `PAYSTACK_DEV_MODE=true` in `.env` to test payments locally without Paystack API keys (auto-redirects to callback).

## Project structure

```
rental-service/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   └── routes/
│   └── scripts/seed-admin.js
└── frontend/
    └── src/
        ├── context/AuthContext.jsx
        ├── components/ProtectedRoute.jsx
        └── pages/
```

## Roadmap

- **Phase 2:** Vehicle search, bookings, Paystack checkout
- **Phase 3:** Admin fleet, bookings, clients, maintenance
- **Phase 4:** Settings, notifications, reports, invoices, audit log
- **Phase 5:** Edge cases, deployment, documentation
