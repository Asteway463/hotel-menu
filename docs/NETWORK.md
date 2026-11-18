# Network Setup (local Wi-Fi, no internet)

## Architecture

```
Phone ──(1) scan Wi-Fi QR──▶ joins restaurant Wi-Fi (no WAN needed)
Phone ──(2) scan Menu QR──▶ http://192.168.1.50:3000 ──▶ local server
```

The menu address is a **LAN address**, never an internet URL. A phone cannot open it
until it is on the restaurant network — the app handles this explicitly.

## Router setup

1. Give the server a DHCP reservation (recommended): MAC address → `192.168.1.50`.
2. Set `LAN_IP=192.168.1.50` in `.env` / `apps/web/.env`.
3. Optionally publish an mDNS name `burgerhouse.local` on the router (or Avahi on the server).
4. Point the restaurant Wi-Fi SSID/password in admin settings (Settings → Wi-Fi) so the
   Wi-Fi QR is generated correctly.
5. No WAN/internet connection is required for operation. Installation only needs a
   one-time internet connection to fetch npm packages.

## Firewall

Allow LAN clients to reach the local server:

```bash
sudo ufw allow from 192.168.0.0/16 to any port 3000 proto tcp
sudo ufw enable
```

Do not expose port 3000 to the internet. If the router supports client isolation,
disable it so phones can reach the server.

## QR codes

- Admin → Settings → QR section (or API):
  - `GET /api/qr?type=wifi` → Wi-Fi pairing QR (JSON with `qrDataUrl`).
  - `GET /api/qr?type=menu` → PNG menu QR pointing to `http://<LAN_IP>:3000/`.
- Print both codes and place them at the entrance / tables.
- Changing `LAN_IP` regenerates the menu QR automatically.

## Connection states

- Phone not on Wi-Fi → cannot resolve local address; printed instructions say to join Wi-Fi first.
- On Wi-Fi, server up → menu loads from local server.
- Server unreachable after a prior visit → Service Worker + IndexedDB serve the cached menu;
  new orders cannot be submitted until the connection returns (cart is kept locally).

## HTTPS note

Local deployments normally use plain HTTP on the LAN, which is acceptable for an
offline-first local menu. If desired, install a self-signed certificate on the local
server and configure the reverse proxy accordingly; update the menu QR URL to HTTPS.
