# Burger House — Offline QR Menu System

A production-quality, mobile-first, multi-tenant digital menu platform for burger houses. It runs entirely on a local server on the restaurant's Wi-Fi network — **no internet connection is required at runtime**.

## Features

- **Customer menu** — animated intro, restaurant story, categories, search, product pages,
  high-quality presentation, featured/combo badges, prices in ETB, Amharic + English.
- **Ordering** — cart with quantity controls, special instructions, dine-in / takeaway /
  delivery, cash or manually-confirmed card payment, unique order numbers, and server-side
  price calculation with duplicate-submission protection.
- **Admin dashboard** — restaurant profile, logo upload, category and product CRUD,
  pricing, promotions/combos, availability, order queue, status updates, daily sales,
  QR code generation, and database backups.
- **Offline architecture** — Service Worker (Workbox) + IndexedDB cache + locally bundled
  fonts/images. Wi-Fi QR + menu QR. Clear connection/offline states.
- **Security** — bcrypt password hashing, hashed session tokens in SQLite, httpOnly cookies,
  RBAC roles, Zod validation, rate limiting, server-side totals, safe uploads, security
  headers, idempotency keys, and downloadable DB backups.

## Architecture

```
restaurant-menu-system/
├── apps/web/          Next.js 15 App Router app (customer + admin + REST API)
│   ├── src/app/       Routes: / , /product/[id] , /admin/* , /login , /api/*
│   ├── src/server/    Auth, rate limiting, domain services
│   ├── src/store/     Cart + UI (language/theme) state
│   └── public/        Local fonts, icons, manifest, uploads, generated SW
├── packages/database/ Prisma schema + migrations + generated client (SQLite)
├── packages/shared/   Types, constants, Zod schemas, EN/AM dictionaries
├── scripts/           Install, seed, DB-check, cleanup helpers
├── tests/             Browser/offline E2E tests
└── docs/              INSTALL, NETWORK, TESTING
```

Multi-tenant: each `Restaurant` row owns its categories, products, orders, admin users,
branding, and Wi-Fi settings. Run one server per restaurant or host several restaurants
on one server (each with its own slug, e.g. `/api/restaurants/burgerhouse`).

## Quick start (development)

```bash
npm install
cp .env.example .env
# For the Next.js runtime, apps/web/.env must point DATABASE_URL at an absolute
# path to packages/database/prisma/dev.db (see .env.example).
npx prisma migrate deploy --schema packages/database/prisma/schema.prisma
npx tsx scripts/create-admin.ts
npm run dev
```

Open `http://localhost:3000`. Admin login: `/login` → `admin@burgerhouse.local` /
`BurgerHouse2026!` (change immediately).

## Production (local server)

1. Follow [docs/INSTALL.md](docs/INSTALL.md) for Ubuntu installation and auto-start.
2. Follow [docs/NETWORK.md](docs/NETWORK.md) for router/static-IP/Wi-Fi QR setup.
3. Build: `npm run build`; run: `npm run start` (binds `0.0.0.0:3000`).
4. Generate and print the Wi-Fi QR and menu QR from the admin dashboard.
5. Verify with [docs/TESTING.md](docs/TESTING.md).

## QR codes

Printable PNGs are generated into `apps/web/public/`:

- `wifi-qr.png` — joins the restaurant Wi-Fi (`WIFI:T:WPA;S:<SSID>;P:<password>;;`)
- `menu.png` — opens the local menu at `http://<LAN_IP>:3000/`

Regenerate after changing the network: `npm run qr:generate`
(or `LAN_IP=192.168.1.10 npm run qr:generate` for a different address).
Dynamic versions are available via `/api/qr?type=wifi` and `/api/qr?type=menu`.

The app never claims the menu is reachable before the phone joins the restaurant network.
If offline, the customer sees an explicit connection state and the cached menu.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run db:migrate` | Apply migrations (dev) |
| `npm run db:generate` | Regenerate Prisma client |
| `npx tsx scripts/create-admin.ts` | Seed/reset default admin + restaurant |
| `npm run test:e2e` | Headless browser E2E + offline test |

## Browser support

Chrome, Firefox, Safari, Edge (Android + iOS). Installable PWA via "Add to Home Screen".
Works on low-end Android phones: local assets, compressed lazy-loaded images, minimal JS.

## License / notes

All runtime dependencies are local — no CDN, Google Fonts, external APIs, or online payment
gateways. Card payments are recorded manually as confirmed offline transactions; no card
processing is claimed to happen offline.
# hotel-menu
