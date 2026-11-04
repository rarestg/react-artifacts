#!/usr/bin/env node
// Manual-run smoke test (not wired into CI). Run it after a dependency upgrade.
//
// The Node tests use happy-dom, which forwards label clicks differently from a
// browser, so they cannot prove that Space and clicks toggle a checkbox once.
// This drives a Prompt Library filter in a real browser and exits nonzero on a
// failure. It requires a running dev server and playwright-core:
//
//   npm run dev
//   npm i --no-save playwright-core
//   node scripts/smoke.mjs [--url http://localhost:5173/artifact/prompt-library] [--browser chromium|firefox|webkit]

const args = process.argv.slice(2);
const readArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const url = readArg('--url', 'http://localhost:5173/artifact/prompt-library');
const browserName = readArg('--browser', 'chromium');

let playwright;
try {
  playwright = await import('playwright-core');
} catch {
  console.error('playwright-core is not installed. Run: npm i --no-save playwright-core');
  process.exit(1);
}

const failures = [];
const browser = await playwright[browserName].launch();
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });

  const tags = page.locator('section[aria-label="Prompt tags"]');
  const filter = tags.getByRole('checkbox').first();
  const label = tags.locator('label').first();
  const shownCount = async () => {
    const text = await page
      .getByText(/\d+ of \d+ prompts/)
      .first()
      .textContent();
    return Number(text.match(/\d+/)[0]);
  };
  const total = await shownCount();

  const expectToggle = async (name, action, checked) => {
    await action();
    // A second toggle from one action would land here, so let it settle before reading.
    await page.waitForTimeout(150);
    const state = await filter.getAttribute('aria-checked');
    const shown = await shownCount();
    const ok = state === String(checked) && (checked ? shown < total : shown === total);
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: aria-checked=${state}, ${shown} of ${total} prompts`);
    if (!ok) failures.push(name);
  };

  await filter.focus();
  await expectToggle('Space checks', () => page.keyboard.press('Space'), true);
  await expectToggle('Space unchecks', () => page.keyboard.press('Space'), false);
  await expectToggle('box click checks', () => filter.click(), true);
  await expectToggle('label click unchecks', () => label.click(), false);
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`Smoke failed: ${failures.join('; ')}`);
  process.exit(1);
}
console.log(`Smoke passed in ${browserName}.`);
