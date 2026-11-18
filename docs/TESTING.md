# Production Testing & Offline Verification

Automated E2E (headless Chrome, server must be running):

```bash
npm run build
npm run start
npm run test:e2e
```

The test covers: online menu load, Service Worker registration/control, **browser offline
emulation with cached menu rendering**, and cart → real order placement with order number.

Verified result (Ubuntu 24.04, Node 26, Chrome headless, 2026-11-18):

```
PASS onlineMenu      PASS serviceWorker   PASS offlineMenu
PASS orderPlaced     PASS noJsErrors
```

## Manual offline checklist (internet fully disconnected)

1. Disconnect the WAN/internet cable or disable the router's WAN port; keep the
   restaurant Wi-Fi and local server powered.
2. Power-cycle the local server; confirm it starts (systemd `burger-house-menu`).
3. Phone: connect to restaurant Wi-Fi, scan the menu QR.
4. Verify:
   - [ ] Restaurant name, logo, story and all categories render.
   - [ ] Product images, descriptions, prices and ingredients render.
   - [ ] Search works; language switch (አማርኛ) works.
   - [ ] Add items, select quantity, submit order → unique order number shown.
   - [ ] Admin can log in, see the order, and update its status.
   - [ ] Admin changes to price/availability appear after refresh.
   - [ ] QR codes generate and download.
   - [ ] Database backup downloads.
5. Reconnect the internet; verify the server still works (it does not depend on it).

## API smoke checks

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/restaurants/burgerhouse
curl -X POST http://localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@burgerhouse.local","password":"BurgerHouse2026!"}' -c cookies.txt
curl -b cookies.txt http://localhost:3000/api/stats
curl "http://localhost:3000/api/qr?type=menu" -o menu-qr.png
```

## Security checks

- [ ] `/admin` without session → 307 redirect to `/login`.
- [ ] `/api/categories`, `/api/products`, `/api/orders` (GET), `/api/stats`,
      `/api/backup`, `/api/upload` without session → 401.
- [ ] Order POST with a manipulated total: server recalculates from DB prices.
- [ ] Replaying the same `idempotencyKey` returns the existing order (no duplicate).
- [ ] Response headers include nosniff, DENY framing, referrer policy.

## Backup / restore drill

1. Admin → Settings → Download backup (or `GET /api/backup`).
2. Stop server, replace `dev.db` with the backup, start server.
3. Confirm menu and orders are intact.
