import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

async function renderPaletteLab() {
  const { default: PaletteLab } = await import('../../src/artifacts/palette-lab');
  return renderToStaticMarkup(createElement(PaletteLab));
}

test('Palette Lab cards label the measured text ratio as contrast', async () => {
  const markup = await renderPaletteLab();

  assert.match(markup, /contrast \.\.\./);
  assert.doesNotMatch(markup, /text \.\.\./);
});

test('Palette Lab header includes an accessible help button', async () => {
  const markup = await renderPaletteLab();

  assert.match(markup, /aria-label="Open palette lab help"/);
});

test('Palette Lab defaults to color names before index labels', async () => {
  const markup = await renderPaletteLab();
  const hueIndex = markup.indexOf('Color name</button>');
  const indexIndex = markup.indexOf('Index</button>');

  assert.ok(hueIndex >= 0);
  assert.ok(indexIndex > hueIndex);
  assert.match(markup, /aria-pressed="true"[^>]*>Color name<\/button>/);
  assert.match(markup, /12 selected \/ color names/);
  assert.match(markup, />Sky<\/span>/);
});

test('Palette Lab exposes an accessible copy selected control', async () => {
  const markup = await renderPaletteLab();
  const clearIndex = markup.indexOf('Clear</button>');
  const copyIndex = markup.indexOf('Copy selected');
  const helpIndex = markup.indexOf('aria-label="Open palette lab help"');

  assert.ok(clearIndex >= 0);
  assert.ok(copyIndex > clearIndex);
  assert.ok(helpIndex > copyIndex);
  assert.match(markup, /aria-label="Copy selected colors as CSS custom properties"/);
  assert.doesNotMatch(markup, /aria-label="Copy selected colors as CSS custom properties"[^>]*disabled/);
});

test('Palette Lab formats selected colors as CSS variables', async () => {
  const { getPaletteExportCss } = await import('../../src/artifacts/palette-lab');
  const css = getPaletteExportCss([
    { index: 0, label: 'Sky', strongColor: 'oklch(64% 0.149 220)' },
    { index: 1, label: 'Sky', strongColor: 'oklch(64% 0.149 220)' },
    { index: 2, label: 'Color 03', strongColor: 'oklch(88% 0.169 94.5)' },
  ]);

  assert.match(css, /^--color-sky: oklch\(64% 0\.149 220\); \/\* #[0-9a-f]{6} \*\//);
  assert.match(css, /\n--color-sky-2: oklch\(64% 0\.149 220\); \/\* #[0-9a-f]{6} \*\//);
  assert.match(css, /\n--color-03: oklch\(88% 0\.169 94\.5\); \/\* #[0-9a-f]{6} \*\//);
});

test('Palette Lab uses profile chroma instead of a chroma slider', async () => {
  const markup = await renderPaletteLab();

  assert.doesNotMatch(markup, /Base chroma/);
  assert.match(markup, /profile -&gt; oklch\(L C h\)/);
  assert.doesNotMatch(markup, /max C<\/span> 0\.205/);
  assert.match(markup, /palette max C<\/span> 0\.186/);
});

test('Palette Lab does not render an internal light or dark theme toggle', async () => {
  const markup = await renderPaletteLab();

  assert.doesNotMatch(markup, />Light<\/button>/);
  assert.doesNotMatch(markup, />Dark<\/button>/);
});

test('Palette Lab hue labels fall back to index labels when missing', async () => {
  const { getPaletteCardLabel } = await import('../../src/artifacts/palette-lab');

  assert.equal(
    getPaletteCardLabel({
      labelMode: 'hue',
      hueLabel: undefined,
      index: 0,
      hue: 220,
      count: 12,
    }),
    'Color 01',
  );
  assert.equal(
    getPaletteCardLabel({
      labelMode: 'hue',
      hueLabel: '',
      index: 1,
      hue: 245,
      count: 12,
    }),
    'Color 02',
  );
  assert.equal(
    getPaletteCardLabel({
      labelMode: 'hue',
      hueLabel: 'Sky',
      index: 0,
      hue: 220,
      count: 12,
    }),
    'Sky',
  );
  assert.equal(
    getPaletteCardLabel({
      labelMode: 'index',
      hueLabel: 'Sky',
      index: 0,
      hue: 220,
      count: 12,
    }),
    'Color 01',
  );
});
