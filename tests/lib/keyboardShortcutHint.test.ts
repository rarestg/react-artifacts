import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getPlatformShortcutHint } from '../../src/lib/keyboardShortcutHint';

test('getPlatformShortcutHint shows Command on Apple platforms', () => {
  assert.deepEqual(getPlatformShortcutHint('K', 'MacIntel'), {
    modifier: 'command',
    key: 'K',
    text: 'Command K',
    label: 'Command K',
  });

  assert.deepEqual(getPlatformShortcutHint('K', 'iPad'), {
    modifier: 'command',
    key: 'K',
    text: 'Command K',
    label: 'Command K',
  });
});

test('getPlatformShortcutHint shows Control on non-Apple platforms', () => {
  assert.deepEqual(getPlatformShortcutHint('K', 'Win32'), {
    modifier: 'control',
    key: 'K',
    text: 'Ctrl K',
    label: 'Control K',
  });

  assert.deepEqual(getPlatformShortcutHint('K', 'Linux x86_64'), {
    modifier: 'control',
    key: 'K',
    text: 'Ctrl K',
    label: 'Control K',
  });
});

test('getPlatformShortcutHint defaults unknown platforms to Control', () => {
  assert.deepEqual(getPlatformShortcutHint('K', ''), {
    modifier: 'control',
    key: 'K',
    text: 'Ctrl K',
    label: 'Control K',
  });
});
