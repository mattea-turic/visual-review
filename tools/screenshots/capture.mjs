import { chromium } from 'playwright';

const [url, outDir] = process.argv.slice(2);
if (!url || !outDir) { console.error('Usage: capture.mjs <url> <outDir>'); process.exit(1); }

const browser = await chromium.launch();
const viewports = [
  { name: 'mobile',  width: 375,  height: 900 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

for (const { name, width, height } of viewports) {
  const page = await browser.newPage();
  await page.setViewportSize({ width, height });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
  console.log(`captured ${name} (${width}px) → ${outDir}/${name}.png`);
  await page.close();
}

await browser.close();
