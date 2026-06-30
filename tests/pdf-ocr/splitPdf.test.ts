import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parsePageSpec, parsePageSpecDetailed } from '../../src/artifacts/pdf-ocr/core/splitPdf';

test('parsePageSpecDetailed collects unparseable junk tokens into ignored', () => {
  const result = parsePageSpecDetailed('1, foo, 3, -', 10);
  assert.deepEqual(result.pages, [1, 3]);
  assert.deepEqual(result.ignored, ['foo', '-']);
});

test('parsePageSpecDetailed flags out-of-range and below-range singles', () => {
  const result = parsePageSpecDetailed('5, 0, 99', 20);
  assert.deepEqual(result.pages, [5]);
  assert.deepEqual(result.ignored, ['0', '99']);
});

test('parsePageSpecDetailed flags a range that lands fully out of bounds', () => {
  const result = parsePageSpecDetailed('50-60', 20);
  assert.deepEqual(result.pages, []);
  assert.deepEqual(result.ignored, ['50-60']);
});

test('parsePageSpecDetailed keeps a partially-in-range range (it contributed pages)', () => {
  const result = parsePageSpecDetailed('18-25', 20);
  assert.deepEqual(result.pages, [18, 19, 20]);
  assert.deepEqual(result.ignored, []);
});

test('parsePageSpecDetailed dedupes and sorts valid pages, swapping reversed ranges', () => {
  const result = parsePageSpecDetailed('3-1, 2, 2, 5', 10);
  assert.deepEqual(result.pages, [1, 2, 3, 5]);
  assert.deepEqual(result.ignored, []);
});

test('parsePageSpec returns just the page array (thin wrapper, behavior unchanged)', () => {
  assert.deepEqual(parsePageSpec('1-5, 8, 99', 20), [1, 2, 3, 4, 5, 8]);
  assert.deepEqual(parsePageSpec('all', 3), []);
});
