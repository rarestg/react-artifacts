import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

function findElement(source: string, tagName: string, contains: string) {
  let start = source.indexOf(`<${tagName}`);

  while (start !== -1) {
    const close = source.indexOf(`</${tagName}>`, start);
    assert.notEqual(close, -1, `Expected closing tag for ${tagName}`);

    const element = source.slice(start, close + `</${tagName}>`.length);
    if (element.includes(contains)) return element;

    start = source.indexOf(`<${tagName}`, start + 1);
  }

  assert.fail(`Expected ${tagName} element containing ${contains}`);
}

function findSelfClosingElement(source: string, tagName: string, contains: string) {
  let start = source.indexOf(`<${tagName}`);

  while (start !== -1) {
    const close = source.indexOf('/>', start);
    assert.notEqual(close, -1, `Expected self-closing tag for ${tagName}`);

    const element = source.slice(start, close + 2);
    if (element.includes(contains)) return element;

    start = source.indexOf(`<${tagName}`, start + 1);
  }

  assert.fail(`Expected ${tagName} element containing ${contains}`);
}

test('JSONL Structure Viewer layout buttons expose descriptive accessible names', async () => {
  const source = await readFile('src/artifacts/jsonl-structure-viewer/index.tsx', 'utf8');

  assert.match(source, /<SegmentedControl[\s\S]*ariaLabel="Layout mode"[\s\S]*value=\{visibleLayoutMode\}/);
  assert.match(source, /ariaLabel: 'One column layout'/);
  assert.match(source, /ariaLabel: 'Two column layout'/);
  assert.match(source, /ariaLabel: 'Three column layout'/);
  assert.match(source, /<RectangleVertical className="size-3\.5" aria-hidden="true" \/>/);
  assert.match(source, /<Columns2 className="size-3\.5" aria-hidden="true" \/>/);
  assert.match(source, /<Columns3 className="size-3\.5" aria-hidden="true" \/>/);
});

test('JSONL Structure Viewer output toolbar controls share explicit density', async () => {
  const source = await readFile('src/artifacts/jsonl-structure-viewer/index.tsx', 'utf8');

  assert.match(source, /const outputToolbarControlSize: SegmentedControlSize = 'compact';/);

  const outputViewControl = findSelfClosingElement(source, 'SegmentedControl', 'ariaLabel="Output view"');
  const outputFormatControl = findSelfClosingElement(source, 'SegmentedControl', 'ariaLabel="Output format"');

  assert.match(outputViewControl, /size=\{outputToolbarControlSize\}/);
  assert.match(outputFormatControl, /size=\{outputToolbarControlSize\}/);
  assert.doesNotMatch(outputFormatControl, /size="default"/);
});

test('JSONL Structure Viewer input controls have explicit accessible labels', async () => {
  const source = await readFile('src/artifacts/jsonl-structure-viewer/index.tsx', 'utf8');

  assert.match(source, /const inputTitleId = useId\(\);/);
  assert.match(source, /const truncationInputId = useId\(\);/);

  const inputTitle = findElement(source, 'div', 'id={inputTitleId}');
  const textarea = findSelfClosingElement(source, 'textarea', 'aria-labelledby={inputTitleId}');
  const truncationLabel = findElement(source, 'label', 'htmlFor={truncationInputId}');
  const truncationInput = findSelfClosingElement(source, 'input', 'id={truncationInputId}');

  assert.match(inputTitle, />\s*Input\s*<\/div>/);
  assert.match(textarea, /aria-labelledby=\{inputTitleId\}/);
  assert.match(truncationLabel, />\s*Truncation\s*<\/label>/);
  assert.match(truncationInput, /id=\{truncationInputId\}/);
  assert.match(truncationInput, /type="number"/);
});

test('JSONL Structure Viewer local buttons follow cursor affordance contract', async () => {
  const indexSource = await readFile('src/artifacts/jsonl-structure-viewer/index.tsx', 'utf8');
  const pathListSource = await readFile('src/artifacts/jsonl-structure-viewer/components/PathList.tsx', 'utf8');
  const recipesSource = await readFile('src/ui/recipes.ts', 'utf8');
  const uiSource = await readFile('src/artifacts/jsonl-structure-viewer/lib/ui.ts', 'utf8');
  const panelHeaderClassesSource = await readFile('src/components/panelHeaderClasses.ts', 'utf8');

  // Both local button classes now compose the shared header-action recipe, which carries the contract.
  assert.match(indexSource, /const headerHelpButtonClass = mergeClassNames\(headerActionClass,/);
  assert.match(pathListSource, /const actionButtonCompact = mergeClassNames\(\s*headerActionClass,/);
  // ...and headerActionClass must still resolve to the panelHeader.action recipe.
  assert.match(uiSource, /panelHeaderActionClass as headerActionClass/);
  assert.match(panelHeaderClassesSource, /panelHeaderActionClass = panelHeader\.action/);
  assert.match(recipesSource, /action:\s*\n?\s*'cursor-pointer[\s\S]*?disabled:cursor-not-allowed/);
  assert.match(recipesSource, /action:[\s\S]*?disabled:opacity-40[\s\S]*?disabled:hover:bg-\[var\(--surface\)\]/);
  assert.match(
    pathListSource,
    /className=\{mergeClassNames\(\s*'cursor-pointer[\s\S]*?aria-label=\{isExpanded \? 'Collapse' : 'Expand'\}/,
  );
  assert.match(
    pathListSource,
    /className=\{mergeClassNames\(\s*'absolute right-2 cursor-pointer[\s\S]*?aria-label="Clear search"/,
  );
});

test('JSONL Structure Viewer checkboxes keep stateful visuals stable', async () => {
  const checkboxSource = await readFile('src/artifacts/jsonl-structure-viewer/components/Checkbox.tsx', 'utf8');
  const pathListSource = await readFile('src/artifacts/jsonl-structure-viewer/components/PathList.tsx', 'utf8');

  assert.doesNotMatch(checkboxSource, /\{checked && <CheckIcon/);
  assert.match(checkboxSource, /<CheckIcon[\s\S]*aria-hidden="true"/);
  assert.match(checkboxSource, /checked \? 'text-white' : 'text-\[var\(--surface\)\]'/);
  assert.match(pathListSource, /const actionButtonCompact = mergeClassNames\([\s\S]*?min-w-10/);
  assert.match(pathListSource, /const actionButtonCompact = mergeClassNames\([\s\S]*?tabular-nums/);
});
