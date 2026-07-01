#!/usr/bin/env node
// Manual-run screenshot helper (not wired into CI).
//
// Renders an artifact route at several widths in light + dark and saves
// full-page PNGs. Requires a running dev server and playwright-core:
//
//   npm run dev
//   npm i --no-save playwright-core   # chromium comes from ~/.cache/ms-playwright
//   node scripts/screenshot.mjs [--url http://localhost:5173/artifact/sharp2] [--out /tmp/artifact-shots]

const args = process.argv.slice(2);
const readArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const url = readArg('--url', 'http://localhost:5173/artifact/sharp2');
const outDir = readArg('--out', '/tmp/artifact-shots');
const widths = [768, 1024, 1440];
const schemes = ['light', 'dark'];

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.error('playwright-core is not installed. Run: npm i --no-save playwright-core');
  process.exit(1);
}

const { mkdir } = await import('node:fs/promises');
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  for (const scheme of schemes) {
    for (const width of widths) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        colorScheme: scheme,
      });
      await page.goto(url, { waitUntil: 'networkidle' });
      const slug = new URL(url).pathname.split('/').filter(Boolean).pop() ?? 'page';
      const path = `${outDir}/${slug}-${width}-${scheme}.png`;
      await page.screenshot({ path, fullPage: true });
      console.log(path);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
