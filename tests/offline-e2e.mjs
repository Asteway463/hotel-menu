/**
 * Headless browser E2E test for the offline QR menu.
 * Run with: npm run test:e2e  (server must be running on localhost:3000)
 *
 * Verifies:
 *  1. Menu loads online (restaurant, categories, products, prices)
 *  2. Service Worker registers and controls the page
 *  3. With the browser network set OFFLINE, the cached menu still renders
 *  4. Cart + order placement works after reconnecting, with a real order number
 */
import puppeteer from 'puppeteer-core';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = {};

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await sleep(6000);
  let text = await page.evaluate(() => document.body.innerText);
  results.onlineMenu = text.includes('Flame Burger') && text.includes('Signature Burgers');

  const sw = await page.evaluate(async () => ({
    controlled: !!navigator.serviceWorker.controller,
    count: (await navigator.serviceWorker.getRegistrations()).length,
  }));
  results.serviceWorker = sw.controlled && sw.count > 0;

  const client = await page.createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0,
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
  await sleep(5000);
  text = await page.evaluate(() => document.body.innerText);
  results.offlineMenu = text.includes('Flame Burger') && text.includes('Signature Burgers');

  await client.send('Network.emulateNetworkConditions', {
    offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await sleep(3500);
  await page.waitForSelector('[aria-label="Add to order"]', { timeout: 10000 });
  await page.click('[aria-label="Add to order"]');
  await sleep(400);
  await page.click('[aria-label="open cart"]');
  await sleep(700);
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const label = await btn.evaluate((el) => el.textContent || '');
    if (label.includes('Place Order')) { await btn.click(); break; }
  }
  await sleep(2500);
  text = await page.evaluate(() => document.body.innerText);
  results.orderPlaced = text.includes('Order placed!') && /BH-[A-Z0-9]+/.test(text);
  results.noJsErrors = errors.length === 0;
} finally {
  await browser.close();
}

console.log('\n=== E2E RESULTS ===');
for (const [key, value] of Object.entries(results)) {
  console.log(`${value ? 'PASS' : 'FAIL'}  ${key}`);
}
if (Object.values(results).some((v) => !v)) process.exit(1);
