import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../../src/App.tsx', import.meta.url), 'utf8');

test('device orientation aria-pressed is false while device preview is inactive', () => {
  assert.match(appSource, /aria-pressed=\{isDevicePreviewActive && deviceOrientation === 'portrait'\}/);
  assert.match(appSource, /aria-pressed=\{isDevicePreviewActive && deviceOrientation === 'landscape'\}/);
});
