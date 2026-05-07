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

test('Palette Lab range controls explicitly associate labels with inputs', async () => {
  const markup = await renderPaletteLab();
  const labelTextIndex = markup.indexOf('>Color count</span>');

  assert.notEqual(labelTextIndex, -1);

  const labelStart = markup.lastIndexOf('<label', labelTextIndex);
  const labelEnd = markup.indexOf('</label>', labelTextIndex);

  assert.notEqual(labelStart, -1);
  assert.notEqual(labelEnd, -1);

  const labelMarkup = markup.slice(labelStart, labelEnd);
  const labelFor = /<label[^>]*for="([^"]+)"/.exec(labelMarkup)?.[1];
  const visibleLabelId = /<span(?=[^>]*\bid="([^"]+)")[^>]*>Color count<\/span>/.exec(labelMarkup)?.[1];
  const inputId = /<input[^>]*id="([^"]+)"/.exec(labelMarkup)?.[1];
  const labelledBy = /<input[^>]*aria-labelledby="([^"]+)"/.exec(labelMarkup)?.[1];

  assert.ok(labelFor);
  assert.equal(inputId, labelFor);
  assert.equal(labelledBy, visibleLabelId);
  assert.notEqual(visibleLabelId, labelFor);
});

test('Palette Lab defaults to color names before index labels', async () => {
  const markup = await renderPaletteLab();
  const hueIndex = markup.indexOf('>Color name</span>');
  const indexIndex = markup.indexOf('>Index</span>');

  assert.ok(hueIndex >= 0);
  assert.ok(indexIndex > hueIndex);
  assert.match(markup, /aria-pressed="true"[\s\S]*>Color name<\/span>/);
  assert.match(markup, /12 selected \/ color names/);
  assert.match(markup, />Sky<\/span>/);
});

test('Palette Lab exposes an accessible copy selected control', async () => {
  const markup = await renderPaletteLab();
  const clearIndex = markup.indexOf('>Clear</span>');
  const copyIndex = markup.indexOf('Copy 12 selected');
  const helpIndex = markup.indexOf('aria-label="Open palette lab help"');

  assert.ok(clearIndex >= 0);
  assert.ok(copyIndex > clearIndex);
  assert.ok(helpIndex > copyIndex);
  assert.match(markup, /aria-label="Copy selected colors as CSS custom properties"/);
  assert.match(markup, />Select all<\/span>/);
  assert.match(markup, />Copy 16 selected<\/span>/);
  assert.doesNotMatch(markup, /aria-label="Copy selected colors as CSS custom properties"[^>]*disabled/);
});

test('Palette Lab formats selected colors as CSS variables', async () => {
  const { getPaletteExportCss } = await import('../../src/artifacts/palette-lab');
  const css = getPaletteExportCss([
    {
      index: 0,
      label: 'Sky',
      lightStrongColor: 'oklch(64% 0.149 220)',
      darkStrongColor: 'oklch(78% 0.149 220)',
      weakMix: 20.5,
    },
    {
      index: 1,
      label: 'Sky 2',
      lightStrongColor: 'oklch(64% 0.149 220)',
      darkStrongColor: 'oklch(78% 0.149 220)',
      weakMix: 20.5,
    },
    {
      index: 2,
      label: 'Sky',
      lightStrongColor: 'oklch(64% 0.149 220)',
      darkStrongColor: 'oklch(78% 0.149 220)',
      weakMix: 20.5,
    },
    {
      index: 3,
      label: 'Color 03',
      lightStrongColor: 'oklch(88% 0.169 94.5)',
      darkStrongColor: 'oklch(88% 0.169 94.5)',
      weakMix: 20.5,
    },
  ]);

  assert.match(css, /^:root \{\n {2}--palette-surface: #ffffff;/);
  assert.match(css, /\n {2}--color-sky: oklch\(64% 0\.149 220\); \/\* #[0-9a-f]{6} \*\//);
  assert.match(
    css,
    /\n {2}--color-sky-weak: color-mix\(in oklch, var\(--color-sky\) 20\.5%, var\(--palette-surface\)\);/,
  );
  assert.match(css, /\n {2}--color-sky-border: var\(--color-sky\);/);
  assert.match(css, /\n {2}--color-sky-2: oklch\(64% 0\.149 220\); \/\* #[0-9a-f]{6} \*\//);
  assert.match(css, /\n {2}--color-sky-3: oklch\(64% 0\.149 220\); \/\* #[0-9a-f]{6} \*\//);
  assert.match(css, /\n {2}--color-03: oklch\(88% 0\.169 94\.5\); \/\* #[0-9a-f]{6} \*\//);
  assert.match(css, /\n\n\.dark \{\n {2}--palette-surface: #0b1120;/);
  assert.match(css, /\n {2}--color-sky: oklch\(78% 0\.149 220\); \/\* #[0-9a-f]{6} \*\//);
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
