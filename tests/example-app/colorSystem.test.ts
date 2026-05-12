import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const strongThemeTokenAliases = [
  ['--category-blue', '--accent'],
  ['--category-green', '--success'],
  ['--category-amber', '--warning'],
  ['--category-violet', '--info'],
  ['--category-red', '--danger'],
] as const;

const weakThemeTokenAliases = [
  ['--category-blue-weak', '--accent-weak'],
  ['--category-green-weak', '--success-weak'],
  ['--category-amber-weak', '--warning-weak'],
  ['--category-violet-weak', '--info-weak'],
  ['--category-red-weak', '--danger-weak'],
] as const;

const textThemeTokenAliases = [
  ['--category-blue-text', '--accent-text'],
  ['--category-green-text', '--success-text'],
  ['--category-amber-text', '--warning-text'],
  ['--category-violet-text', '--info-text'],
  ['--category-red-text', '--danger-text'],
] as const;

const semanticTextTokens = [
  ['--accent-text', '#1d4ed8', '#bfdbfe'],
  ['--success-text', '#047857', '#a7f3d0'],
  ['--warning-text', '#92400e', '#fde68a'],
  ['--info-text', '#6d28d9', '#ddd6fe'],
  ['--danger-text', '#b91c1c', '#fecdd3'],
] as const;

const extraCategoryTextTokens = [
  ['--category-cyan-text', '#0e7490', '#a5f3fc'],
  ['--category-pink-text', '#be185d', '#fbcfe8'],
  ['--category-lime-text', '#3f6212', '#d9f99d'],
] as const;

function getBlock(source: string, selector: string) {
  const start = source.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `Expected ${selector} block`);
  const bodyStart = source.indexOf('{', start) + 1;
  const bodyEnd = source.indexOf('}', bodyStart);
  assert.notEqual(bodyEnd, -1, `Expected ${selector} block to close`);
  return source.slice(bodyStart, bodyEnd);
}

test('artifact theme aliases first category colors to semantic status colors', async () => {
  const source = await readFile('src/theme/artifact-theme.css', 'utf8');
  const lightTheme = getBlock(source, '.artifact-theme');
  const darkTheme = getBlock(source, '.dark .artifact-theme');

  for (const aliases of [strongThemeTokenAliases, weakThemeTokenAliases, textThemeTokenAliases]) {
    for (const [categoryToken, semanticToken] of aliases) {
      const alias = new RegExp(`${categoryToken}:\\s*var\\(${semanticToken}\\);`);
      assert.match(lightTheme, alias);
      assert.match(darkTheme, alias);
    }
  }
});

test('artifact theme exposes curated text tokens for weak color backgrounds', async () => {
  const source = await readFile('src/theme/artifact-theme.css', 'utf8');
  const lightTheme = getBlock(source, '.artifact-theme');
  const darkTheme = getBlock(source, '.dark .artifact-theme');

  for (const [token, lightValue, darkValue] of [...semanticTextTokens, ...extraCategoryTextTokens]) {
    assert.match(lightTheme, new RegExp(`${token}:\\s*${lightValue};`));
    assert.match(darkTheme, new RegExp(`${token}:\\s*${darkValue};`));
  }

  assert.doesNotMatch(source, /-text:\s*color-mix\(/);
});

test('artifact theme keeps selected color weak tokens curated', async () => {
  const source = await readFile('src/theme/artifact-theme.css', 'utf8');
  const lightTheme = getBlock(source, '.artifact-theme');
  const darkTheme = getBlock(source, '.dark .artifact-theme');

  assert.match(lightTheme, /--accent-weak:\s*#dbeafe;/);
  assert.match(darkTheme, /--accent-weak:\s*#1e3a8a;/);
  assert.doesNotMatch(source, /--accent-weak:\s*color-mix\(/);
});

test('example app previews semantic colors in the same order as message colors', async () => {
  const source = await readFile('src/artifacts/example-app/App.tsx', 'utf8');
  const themeSwatchStart = source.indexOf('const themeSwatches = [');
  const categorySwatchStart = source.indexOf('const categorySwatches = [');
  assert.notEqual(themeSwatchStart, -1);
  assert.notEqual(categorySwatchStart, -1);

  const themeSwatches = source.slice(themeSwatchStart, categorySwatchStart);
  const themeOrder = ['accent', 'success', 'warning', 'info', 'danger'];
  const categoryOrder = ['category-blue', 'category-green', 'category-amber', 'category-violet', 'category-red'];

  let previousIndex = -1;
  for (const swatchId of themeOrder) {
    const nextIndex = themeSwatches.indexOf(`id: '${swatchId}'`);
    assert.ok(nextIndex > previousIndex, `Expected ${swatchId} after previous theme swatch`);
    previousIndex = nextIndex;
  }

  previousIndex = -1;
  for (const token of categoryOrder) {
    const nextIndex = source.indexOf(`var(--${token})`, categorySwatchStart);
    assert.ok(nextIndex > previousIndex, `Expected ${token} after previous category swatch`);
    previousIndex = nextIndex;
  }

  assert.match(
    source,
    /ArtifactThemeRoot className="[^"]*bg-\[var\(--surface-muted\)\][^"]*"/,
    'Example App should use the muted artifact canvas surface.',
  );
  assert.match(source, /bg-\[var\(--accent-weak\)\] text-\[var\(--accent-text\)\]/);
  assert.doesNotMatch(source, /bg-\[var\(--accent-weak\)\] text-\[var\(--accent\)\]/);
});
