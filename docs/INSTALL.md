# Installation (Ubuntu 24.04 LTS)

## Development

```bash
cd restaurant-menu-system
npm install
cp .env.example .env
# set apps/web/.env DATABASE_URL to the absolute path of packages/database/prisma/dev.db
npx prisma migrate deploy --schema packages/database/prisma/schema.prisma
npx tsx scripts/create-admin.ts
npm run dev
```

## Production (local restaurant server)

Hardware: old laptop, Intel NUC, or Raspberry Pi (4+ GB RAM, 16+ GB storage).
OS: Ubuntu 22.04/24.04 LTS. Node.js 20+ LTS (22 recommended).

1. Copy the project to the server, e.g. `/opt/burger-house-menu`.
2. Run `sudo bash scripts/install.sh` (installs Node, dependencies, Prisma client, DB,
   systemd service).
3. Edit `/opt/burger-house-menu/.env` and `apps/web/.env`:
   - `DATABASE_URL` — absolute path to the SQLite file
   - `LAN_IP` / `LAN_HOST` — server's static LAN address / mDNS name
   - `WIFI_SSID` / `WIFI_PASSWORD` — restaurant Wi-Fi credentials for the Wi-Fi QR
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
4. Seed the first admin: `cd /opt/burger-house-menu && npx tsx scripts/create-admin.ts`.
5. Build and start:
   ```bash
   npm run build
   sudo systemctl enable --now burger-house-menu
   sudo systemctl status burger-house-menu
   ```
6. Configure the router DHCP reservation (see NETWORK.md), then log in at
   `http://<LAN_IP>:3000/login` and generate the QR codes.

## Auto-start and recovery

The systemd unit (`/etc/systemd/system/burger-house-menu.service`) sets
`Restart=on-failure` and waits for `network-online.target`. The server starts
automatically after power-on and restarts after a crash.

## Backups

- Admin dashboard: **Settings → Download backup** (`/api/backup`, admin-only).
- Cron example (daily at 02:00):
  ```cron
  0 2 * * * cp /opt/burger-house-menu/packages/database/prisma/dev.db /backups/burger-house-$(date +\%F).db
  ```
- Keep at least 7 daily copies and one weekly off-device copy.
