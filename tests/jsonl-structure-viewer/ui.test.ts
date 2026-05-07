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

test('JSONL Structure Viewer input controls have explicit accessible labels', async () => {
  const source = await readFile('src/artifacts/jsonl-structure-viewer/index.tsx', 'utf8');

  assert.match(source, /id="jsonl-structure-input-title"[\s\S]*>\s*Input\s*<\/div>/);
  assert.match(source, /<textarea[\s\S]*aria-labelledby="jsonl-structure-input-title"[\s\S]*\/>/);
  assert.match(source, /<label[\s\S]*htmlFor="jsonl-structure-truncation"[\s\S]*>\s*Truncation\s*<\/label>/);
  assert.match(source, /<input[\s\S]*id="jsonl-structure-truncation"[\s\S]*type="number"[\s\S]*\/>/);
});

test('JSONL Structure Viewer local buttons follow cursor affordance contract', async () => {
  const indexSource = await readFile('src/artifacts/jsonl-structure-viewer/index.tsx', 'utf8');
  const pathListSource = await readFile('src/artifacts/jsonl-structure-viewer/components/PathList.tsx', 'utf8');

  assert.match(indexSource, /const headerHelpButtonClass = mergeClassNames\([\s\S]*cursor-pointer/);
  assert.match(pathListSource, /const actionButtonBase =[\s\S]*cursor-pointer[\s\S]*disabled:cursor-not-allowed/);
  assert.match(
    pathListSource,
    /const actionButtonBase =[\s\S]*disabled:opacity-40[\s\S]*disabled:hover:bg-\[var\(--surface\)\]/,
  );
  assert.match(pathListSource, /className="cursor-pointer[\s\S]*aria-label=\{isExpanded \? 'Collapse' : 'Expand'\}/);
  assert.match(pathListSource, /className="absolute right-2 cursor-pointer[\s\S]*aria-label="Clear search"/);
});
