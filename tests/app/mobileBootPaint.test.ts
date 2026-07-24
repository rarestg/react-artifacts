import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { MOBILE_BOOT_PAINT_COLOR, MOBILE_DISCLAIMER_STORAGE_KEY } from '../../src/lib/mobileDisclaimerGate';
import { MOBILE_MEDIA_QUERY } from '../../src/lib/useIsMobile';

const readRepoFile = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

// index.html cannot import TS, so its inline boot-paint script repeats these literals.
// This pins the copies together: change a constant and this fails until index.html follows.
test('index.html boot-paint script matches the TS constants', () => {
  const html = readRepoFile('../../index.html');

  assert.ok(
    html.includes(`sessionStorage.getItem('${MOBILE_DISCLAIMER_STORAGE_KEY}') === null`),
    'index.html must gate the boot paint on the exact disclaimer storage key',
  );
  assert.ok(
    html.includes(`window.matchMedia('${MOBILE_MEDIA_QUERY}').matches`),
    'index.html must use the exact mobile breakpoint media query',
  );
  assert.ok(
    html.includes(`document.documentElement.style.backgroundColor = '${MOBILE_BOOT_PAINT_COLOR}'`),
    'index.html must paint the exact disclaimer color',
  );
});

test('the disclaimer scrim uses the boot paint color', () => {
  const source = readRepoFile('../../src/components/MobileDisclaimer.tsx');
  assert.ok(
    source.includes(`bg-[${MOBILE_BOOT_PAINT_COLOR}]`),
    'MobileDisclaimer must keep its scrim on the boot paint color',
  );
});
