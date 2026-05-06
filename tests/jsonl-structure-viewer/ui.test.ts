import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('JSONL Structure Viewer layout buttons expose descriptive accessible names', async () => {
  const source = await readFile('src/artifacts/jsonl-structure-viewer/index.tsx', 'utf8');

  assert.match(source, /aria-label="Layout mode"/);
  assert.match(source, /aria-label="One column layout"[\s\S]*aria-pressed=\{visibleLayoutMode === 'one-column'\}/);
  assert.match(source, /aria-label="Two column layout"[\s\S]*aria-pressed=\{visibleLayoutMode === 'two-column'\}/);
  assert.match(source, /aria-label="Three column layout"[\s\S]*aria-pressed=\{visibleLayoutMode === 'three-column'\}/);
  assert.match(source, /<RectangleVertical className="h-3\.5 w-3\.5" aria-hidden="true" \/>/);
  assert.match(source, /<Columns2 className="h-3\.5 w-3\.5" aria-hidden="true" \/>/);
  assert.match(source, /<Columns3 className="h-3\.5 w-3\.5" aria-hidden="true" \/>/);
});
