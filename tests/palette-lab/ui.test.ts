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
