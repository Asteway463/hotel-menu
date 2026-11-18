#!/usr/bin/env bash
# Burger House — local menu server installer for Ubuntu 22.04/24.04 LTS.
# Run as a user with sudo privileges after copying the project to its final
# directory (default: /opt/burger-house-menu).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/burger-house-menu}"
SERVICE_NAME="burger-house-menu"

log()  { echo "[install] $*"; }
fail() { echo "[install] ERROR: $*" >&2; exit 1; }

log "Installing prerequisites..."
sudo apt-get update -y
sudo apt-get install -y curl git ca-certificates openssl ufw lsof

if ! command -v node >/dev/null 2>&1 || [ "$(node -p "process.versions.node.split('.')[0]")" -lt 20 ]; then
  log "Installing Node.js 22 LTS (NodeSource)..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
log "Node.js $(node -v), npm $(npm -v)"

log "Installing project dependencies in $APP_DIR..."
cd "$APP_DIR"
npm install
npm install-scripts approve @prisma/client @prisma/engines prisma sharp bcryptjs qrcode esbuild >/dev/null 2>&1 || true

log "Preparing environment files..."
if [ ! -f .env ]; then
  cp .env.example .env
fi
if [ ! -f apps/web/.env ]; then
  cp .env apps/web/.env
fi
# The Next.js runtime resolves relative SQLite paths from the app directory;
# use the absolute DB path there.
DB_ABS="$APP_DIR/packages/database/prisma/dev.db"
if grep -q '^DATABASE_URL=' apps/web/.env; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"file:$DB_ABS\"|" apps/web/.env
else
  printf 'DATABASE_URL="file:%s"\n' "$DB_ABS" >> apps/web/.env
fi

log "Generating Prisma client and applying migrations..."
npx prisma generate --schema packages/database/prisma/schema.prisma
npx prisma migrate deploy --schema packages/database/prisma/schema.prisma

log "Building production app..."
npm run build

log "Creating systemd service..."
sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" > /dev/null <<UNIT
[Unit]
Description=Burger House Local Menu Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=${APP_DIR}/.env

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
log "Installation complete."
log "Next steps:"
log "  1. npx tsx scripts/create-admin.ts   # seed first admin/restaurant"
log "  2. Edit .env + apps/web/.env (LAN_IP, Wi-Fi, admin credentials)."
log "  3. sudo systemctl enable --now ${SERVICE_NAME}"
log "  4. Reserve static LAN IP on the router (see docs/NETWORK.md)."
log "  5. Log in at http://<LAN_IP>:3000/login and generate QR codes."
