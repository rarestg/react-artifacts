import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../../src/App.tsx', import.meta.url), 'utf8');

test('bare "/" never falls back to auto-selecting the first artifact', () => {
  assert.doesNotMatch(appSource, /artifacts\[0\]/);
});
