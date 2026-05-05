import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeClassNames } from '../../src/lib/classNames';

test('mergeClassNames lets later Tailwind classes override earlier conflict groups', () => {
  assert.equal(
    mergeClassNames(
      'max-h-[calc(100%-2rem)] w-full max-w-[42rem] px-4 py-4',
      'max-h-[calc(100%-6rem)] max-w-[34rem] p-4',
    ),
    'w-full max-h-[calc(100%-6rem)] max-w-[34rem] p-4',
  );
});

test('mergeClassNames ignores empty conditional class values', () => {
  assert.equal(mergeClassNames('flex', false, undefined, null, '', 'items-center'), 'flex items-center');
});
