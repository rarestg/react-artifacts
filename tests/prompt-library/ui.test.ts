import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { prompts } from '../../src/artifacts/prompt-library/prompts';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

async function renderPromptLibrary() {
  const { default: PromptLibrary } = await import('../../src/artifacts/prompt-library');

  return renderToStaticMarkup(createElement(PromptLibrary));
}

test('prompt card title button advertises that it opens the full prompt', async () => {
  const markup = await renderPromptLibrary();
  const firstTitle = prompts[0]?.title;

  assert.ok(firstTitle);

  const titleStart = markup.indexOf(`>${firstTitle}</button>`);
  assert.notEqual(titleStart, -1);

  const buttonStart = markup.lastIndexOf('<button', titleStart);
  assert.notEqual(buttonStart, -1);

  const titleButton = markup.slice(buttonStart, titleStart);

  assert.match(titleButton, /cursor-pointer/);
  assert.match(titleButton, /active:/);
});

test('primary search button uses a pointer cursor', async () => {
  const markup = await renderPromptLibrary();
  const searchLabelStart = markup.indexOf('aria-label="Search');
  assert.notEqual(searchLabelStart, -1);

  const buttonEnd = markup.indexOf('</button>', searchLabelStart);
  assert.notEqual(buttonEnd, -1);

  const searchButton = markup.slice(searchLabelStart, buttonEnd);

  assert.match(searchButton, /cursor-pointer/);
});
