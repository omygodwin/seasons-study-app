/* Rasterizes the SVGs written by gen_icons.py into the PNGs that ship in
 * public/. Needs playwright: npx playwright install chromium (or point
 * executablePath at an existing Chromium). */
import pw from 'playwright';
import fs from 'fs';
const { chromium } = pw;
const b = await chromium.launch();

// src svg, out png, size
const JOBS = [
  ['icon-small.svg',    'favicon-16.png',        16],
  ['icon-small.svg',    'favicon-32.png',        32],
  ['icon-small.svg',    'favicon-48.png',        48],
  ['icon-ios.svg',      'apple-touch-icon.png', 180],
  ['icon-master.svg',   'icon-192.png',         192],
  ['icon-master.svg',   'icon-512.png',         512],
  ['icon-maskable.svg', 'icon-maskable-512.png',512],
];

for (const [src, out, size] of JOBS) {
  const svg = fs.readFileSync(new URL(src, import.meta.url), 'utf8');
  const pg = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await pg.setContent(
    `<!doctype html><html><head><style>html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden}
     svg{display:block;width:${size}px;height:${size}px}</style></head><body>${svg}</body></html>`,
    { waitUntil: 'networkidle' });
  await pg.screenshot({ path: new URL(`../../public/${out}`, import.meta.url).pathname, omitBackground: true });
  await pg.close();
  console.log(`${out.padEnd(24)} ${size}x${size}`);
}
await b.close();
