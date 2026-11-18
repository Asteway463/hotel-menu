/**
 * Generates printable QR code PNGs for the restaurant.
 *   - public/menu.png     → opens the local menu after joining restaurant Wi-Fi
 *   - public/wifi-qr.png  → joins the restaurant Wi-Fi
 *
 * Run: node scripts/generate-qr.mjs
 * Override with env vars, e.g.: LAN_IP=192.168.1.10 node scripts/generate-qr.mjs
 */
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';

function readEnvValue(key, fallback) {
  const match = fs.readFileSync('.env', 'utf8').match(new RegExp(`^${key}="?([^"#\\n]+)"?`, 'm'));
  return (match && match[1].trim()) || fallback;
}

const lanIp = process.env.LAN_IP || readEnvValue('LAN_IP', '192.168.1.50');
const port = process.env.PORT || readEnvValue('PORT', '3000');
const ssid = process.env.WIFI_SSID || 'BurgerHouse';
const password = process.env.WIFI_PASSWORD || 'burgerhouse';

const menuUrl = `http://${lanIp}:${port}/`;
const wifiPayload = `WIFI:T:WPA;S:${ssid};P:${password};;`;

const opts = { type: 'png', width: 1024, margin: 2, errorCorrectionLevel: 'H' };
const outDir = path.join('apps', 'web', 'public');

await QRCode.toFile(path.join(outDir, 'menu.png'), menuUrl, opts);
await QRCode.toFile(path.join(outDir, 'wifi-qr.png'), wifiPayload, opts);

console.log('menu.png    →', menuUrl);
console.log('wifi-qr.png →', wifiPayload);
