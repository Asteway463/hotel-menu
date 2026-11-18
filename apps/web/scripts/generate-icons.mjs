// Generates PWA PNG icons (192px and 512px) from the burger SVG.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svg = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8');

async function main() {
  const source = sharp(Buffer.from(svg));
  await source.resize(192, 192, { fit: 'cover' }).png().toFile('apps/web/public/icon-192.png');
  await source.resize(512, 512, { fit: 'cover' }).png().toFile('apps/web/public/icon-512.png');
  console.log('Icons generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
