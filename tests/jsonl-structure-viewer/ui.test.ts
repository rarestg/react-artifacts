import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('JSONL Structure Viewer layout buttons expose descriptive accessible names', async () => {
  const source = await readFile('src/artifacts/jsonl-structure-viewer/index.tsx', 'utf8');

  assert.match(source, /<SegmentedControl[\s\S]*ariaLabel="Layout mode"[\s\S]*value=\{visibleLayoutMode\}/);
  assert.match(source, /ariaLabel: 'One column layout'/);
  assert.match(source, /ariaLabel: 'Two column layout'/);
  assert.match(source, /ariaLabel: 'Three column layout'/);
  assert.match(source, /<RectangleVertical className="h-3\.5 w-3\.5" aria-hidden="true" \/>/);
  assert.match(source, /<Columns2 className="h-3\.5 w-3\.5" aria-hidden="true" \/>/);
  assert.match(source, /<Columns3 className="h-3\.5 w-3\.5" aria-hidden="true" \/>/);
});
