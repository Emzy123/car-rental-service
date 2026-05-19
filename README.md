# DriveRent - Premium Car Rental Service

Full-stack car rental application with **Client Portal** and **Admin Dashboard**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![React](https://img.shields.io/badge/react-19+-blue.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-14+-blue.svg)

## Tech Stack

### Backend
- **Runtime:** Node.js 18+ with ES modules
- **Framework:** Express.js with security middleware (helmet, cors, rate-limiting)
- **Database:** PostgreSQL 14+ with connection pooling
- **Authentication:** JWT (7-day expiry) with role-based access control
- **Payments:** Paystack (initialize, verify, webhooks, refunds)
- **Caching:** Redis (optional) for vehicle availability and sessions
- **File Uploads:** Multer for profile photos with 5MB limit
- **Validation:** Custom middleware for dates, payments, and file uploads
- **Testing:** Vitest with setup utilities

### Frontend
- **Framework:** React 19 with Vite build tool
- **Routing:** React Router v7 with protected routes
- **Styling:** Tailwind CSS v4 with custom theme colors
- **UI Components:** Radix UI primitives (dialog, dropdown, tabs, toast)
- **State Management:** React Query for server state, Zustand for client state
- **Animations:** Framer Motion for page transitions and interactions
- **Icons:** Lucide React
- **PWA:** Manifest, service worker with caching and offline support
- **Error Tracking:** Sentry integration (disabled for React 19 compatibility)

## Features

### Client Portal
- 🔐 **Authentication:** Registration, login, JWT token storage in localStorage
- 🔍 **Vehicle Search:** Full-text search, filters by category/fuel/transmission/seats
- 📅 **Availability:** Real-time vehicle availability by date range
- 📝 **Booking Flow:** Select dates → vehicle details → confirm → payment
- 💳 **Payments:** Paystack integration with 20% deposit, automatic refunds
- 📊 **My Bookings:** View upcoming/past reservations, cancel with refund policy
- ✏️ **Booking Modification:** Change dates, pickup/return locations, times
- ❤️ **Saved Vehicles:** Bookmark favorite vehicles
- 👤 **Profile:** Update personal info, upload profile photo (5MB limit)
- 📱 **Responsive:** Mobile-first design with dark sidebar navigation

### Admin Dashboard
- 📈 **Dashboard:** Revenue stats, active bookings, fleet utilization
- 🚗 **Fleet Management:** Add, edit, activate/deactivate vehicles
- 📋 **Bookings:** View all bookings, filter by status, process returns
- 👥 **Clients:** Client list with booking history
- 📍 **Locations:** Manage pickup/return locations
- 📄 **CSV Export:** Export bookings and client data

### Production Enhancements
- 📄 **Pagination:** Middleware for paginated API responses
- 🔍 **Full-Text Search:** PostgreSQL GIN index on vehicles
- 📱 **PWA Support:** Installable app, offline caching, background sync
- 🖼️ **Avatar Uploads:** Profile photo uploads with validation
- ✏️ **Booking Modification:** Update bookings before pickup
- ⚡ **Caching:** Redis integration for performance
- 🛡️ **Security:** Helmet, rate limiting, CORS, input validation
- 📊 **Error Tracking:** Sentry integration for production monitoring

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis (optional, for caching)
- Paystack account (for payments)

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/Emzy123/car-rental-service.git
cd car-rental-service
```

### 2. Database Setup

```bash
# Create database
sudo -u postgres createdb rental_service

# Or with psql
psql -U postgres -c "CREATE DATABASE rental_service;"
```

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration

npm install
npm run db:migrate
npm run db:seed-admin
npm run db:seed-locations
npm run db:seed-vehicles
npm run dev
```

**Default Admin Credentials:**
- Email: `admin@drive.com`
- Password: `password`

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `PORT` | No | Server port (default: 5000) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: http://localhost:5173) |
| `REDIS_URL` | No | Redis connection for caching |
| `PAYSTACK_SECRET_KEY` | Yes* | Paystack secret key |
| `PAYSTACK_PUBLIC_KEY` | Yes* | Paystack public key |
| `PAYSTACK_DEV_MODE` | No | Skip real payments (default: false) |
| `ADMIN_EMAIL` | No | Admin email for seeding |
| `ADMIN_PASSWORD` | No | Admin password for seeding |
| `ADMIN_NAME` | No | Admin name for seeding |
| `SENTRY_DSN` | No | Sentry error tracking |
| `UPLOAD_DIR` | No | Profile photo upload directory |

*Required for payments. Use `PAYSTACK_DEV_MODE=true` for testing without keys.

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (default: /api) |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key for inline payments |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking |
| `VITE_APP_VERSION` | App version for Sentry releases |

## Database Schema

### Core Tables
- `users` - Clients and admins with role-based access
- `vehicles` - Fleet inventory with photos, rates, availability
- `bookings` - Reservations with status, pricing, dates
- `payments` - Paystack transactions (deposit, balance, refund)
- `locations` - Pickup/return locations

### Migrations
```bash
npm run db:migrate          # Run all pending migrations
npm run db:migrate:rollback # Rollback last migration
```

### Seed Data
```bash
npm run db:seed-admin       # Create admin user
npm run db:seed-locations   # Add pickup locations
npm run db:seed-vehicles    # Add sample vehicles
```

## API Documentation

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new client |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Auth | Get current user |
| PUT | `/api/auth/profile` | Auth | Update profile |
| POST | `/api/auth/avatar` | Auth | Upload profile photo |

### Vehicles

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/vehicles` | Public | List available vehicles with filters |
| GET | `/api/vehicles/:id` | Public | Get vehicle details |
| GET | `/api/vehicles/search?q=` | Public | Full-text search |

### Bookings (Client)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/bookings` | Client | Create new booking |
| GET | `/api/bookings/my-bookings` | Client | List my bookings |
| GET | `/api/bookings/:id` | Client | Get booking details |
| PATCH | `/api/bookings/:id` | Client | Modify booking |
| POST | `/api/bookings/:id/cancel` | Client | Cancel with refund |
| POST | `/api/bookings/preview` | Client | Calculate pricing |

### Payments

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/payments/initialize` | Client | Start Paystack payment |
| POST | `/api/payments/verify` | Client | Verify payment callback |
| POST | `/api/payments/webhook` | Paystack | Receive webhooks |

### Admin

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |
| GET | `/api/admin/bookings` | Admin | All bookings |
| GET | `/api/admin/bookings/export` | Admin | Export to CSV |
| GET | `/api/admin/clients` | Admin | Client list |
| GET | `/api/admin/clients/export` | Admin | Export to CSV |
| GET | `/api/admin/fleet` | Admin | Fleet overview |
| POST | `/api/admin/vehicles` | Admin | Add vehicle |
| PUT | `/api/admin/vehicles/:id` | Admin | Update vehicle |

## Payment Flow (Paystack)

1. **Initialize:** Client clicks "Pay" → Backend creates transaction → Returns auth URL
2. **Payment:** User completes payment on Paystack → Redirects to callback URL
3. **Verify:** Callback page calls `/payments/verify` → Backend confirms with Paystack API
4. **Webhook:** Paystack sends webhook → Backend updates booking status
5. **Refund:** On cancellation, refund calculated based on policy → Initiated via Paystack API

### Refund Policy
- > 7 days before pickup: 100% refund
- 3-7 days before: 50% refund
- < 3 days: 0% refund

## Testing

```bash
# Backend tests
cd backend
npm test

# With coverage
npm run test:coverage
```

## Project Structure

```
rental-service/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment config
│   │   ├── controllers/     # Route controllers
│   │   ├── db/              # Migrations and pool
│   │   ├── middleware/      # Auth, validation, upload, pagination
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (payments, email, cache)
│   │   ├── utils/           # Helpers (booking, currency, dates)
│   │   └── tests/           # Test files
│   └── scripts/             # Seed scripts
├── frontend/
│   ├── public/              # PWA manifest, service worker
│   └── src/
│       ├── api/             # API client
│       ├── components/      # UI components
│       ├── context/         # Auth context
│       ├── hooks/           # Custom hooks
│       ├── pages/           # Route pages
│       ├── stores/          # State stores
│       └── utils/           # Helpers
└── README.md
```

## Development Scripts

### Backend
```bash
npm run dev              # Start development server
npm run start            # Start production server
npm run db:migrate       # Run migrations
npm run db:seed-admin    # Seed admin user
npm run db:seed-locations # Seed locations
npm run db:seed-vehicles  # Seed vehicles
npm test                 # Run tests
```

### Frontend
```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
```

## Deployment

### Backend
1. Set `NODE_ENV=production`
2. Configure `DATABASE_URL` with production Postgres
3. Set strong `JWT_SECRET`
4. Configure `PAYSTACK_*` keys for live payments
5. Set `CLIENT_URL` to production frontend domain
6. Enable Redis for caching (optional)

### Frontend
1. Set `VITE_API_URL` to production backend
2. Configure `VITE_PAYSTACK_PUBLIC_KEY`
3. Run `npm run build`
4. Serve `dist/` folder via CDN or static host

## Security Features

- JWT authentication with 7-day expiry
- Role-based access control (client/admin)
- Password hashing with bcrypt (10 rounds)
- Helmet.js for security headers
- Rate limiting on API endpoints
- CORS configuration
- Input validation middleware
- SQL injection protection (parameterized queries)
- File upload size and type restrictions

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - see LICENSE file for details

## Roadmap

- [x] Phase 1: Authentication, database, protected routes
- [x] Phase 2: Vehicle search, bookings, Paystack payments
- [x] Phase 3: Admin dashboard, fleet, clients management
- [x] Phase 4: Production enhancements (PWA, pagination, uploads)
- [ ] Phase 5: Notifications, reports, deployment optimization

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## Support

For issues or questions, please open a GitHub issue.
