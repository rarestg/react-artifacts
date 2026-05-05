import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isRootDarkMode } from '../../src/lib/useRootDarkMode';

function makeRoot(classNames: readonly string[]) {
  return {
    classList: {
      contains: (className: string) => classNames.includes(className),
    },
  };
}

test('isRootDarkMode maps the root dark class to dark mode', () => {
  assert.equal(isRootDarkMode(makeRoot(['dark'])), true);
  assert.equal(isRootDarkMode(makeRoot(['light'])), false);
});

test('isRootDarkMode defaults to light when no document root is available', () => {
  assert.equal(isRootDarkMode(undefined), false);
});
