# Soul Body API

Node.js + Express + TypeScript + Prisma (PostgreSQL). Serves the public site and the `/admin` panel.

## Run locally

```bash
cd backend
cp .env.example .env          # set JWT_SECRET (32+ chars) and the seed admin credentials
docker compose up -d          # PostgreSQL 16 (or point DATABASE_URL at your own)
npm install
npx prisma migrate dev --name init
npm run db:seed               # roles, permissions, super admin
npm run dev                   # http://localhost:4000
```

Then, in the repo root, `npm run dev` and open http://localhost:5173/admin/login.
Vite proxies `/api` to the backend, so the HTTP-only auth cookies are same-origin in development.

## Layout

`src/modules/<name>/{routes,controller,service,repository,schemas}` - one folder per feature.
`src/middleware` (auth/RBAC, validation, CSRF origin guard, rate limits, errors), `src/config`, `src/services`, `src/utils`.

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Backend, Prisma schema (all models), auth, RBAC, users, admin shell | done |
| 2 | Blog CMS, media library (S3) | next |
| 3 | Books, inventory, cart, checkout, orders | |
| 4 | Consultation services, availability, calendar, bookings | |
| 5 | Payment gateway, webhooks, refunds | |
| 6 | Email, analytics, coupons | |
| 7 | Hardening, tests, deployment | |

## Security notes

- Access token (15 min) and rotating refresh token live in HTTP-only cookies; refresh-token reuse revokes all sessions.
- Permissions are loaded from the database on every request, so role changes apply immediately.
- State-changing requests from browsers must come from `CORS_ORIGINS` (CSRF defence on top of SameSite cookies).
- Secrets come only from environment variables.
