import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

async function renderMessageUnescaper() {
  const { default: MessageUnescaper } = await import('../../src/artifacts/message-unescaper');
  return renderToStaticMarkup(createElement(MessageUnescaper));
}

async function readMessageUnescaperSource() {
  return readFile('src/artifacts/message-unescaper/index.tsx', 'utf8');
}

test('Message Unescaper output toggles keep stable names and describe disabled reasons separately', async () => {
  const markup = await renderMessageUnescaper();

  assert.match(markup, />Show dash breaks</);
  assert.match(markup, />Replace with periods</);
  assert.match(markup, /title="Enter text to detect dash breaks"/);
  assert.match(markup, /title="Enter text to enable dash replacement"/);
  const describedByMatches = markup.match(/aria-describedby="[^"]+"/g) ?? [];
  assert.equal(describedByMatches.length, 2);
  assert.doesNotMatch(markup, /aria-label="Enter text to detect dash breaks"/);
  assert.doesNotMatch(markup, /aria-label="Enter text to enable dash replacement"/);
});

test('Message Unescaper exposes container-aware panel layout controls', async () => {
  const markup = await renderMessageUnescaper();
  const source = await readMessageUnescaperSource();

  assert.match(markup, /aria-label="Panel layout"/);
  assert.match(markup, /aria-label="One column layout"/);
  assert.match(markup, /aria-label="Two column layout"/);
  assert.match(source, /\{canUseTwoColumnLayout && \(/);
  assert.match(source, /entry\.contentRect\.width/);
  assert.match(source, /MESSAGE_TWO_COLUMN_MIN_WIDTH = MESSAGE_PANEL_MIN_WIDTH \* 2 \+ MESSAGE_PANEL_GAP/);
  assert.match(source, /visiblePanelLayout === 'two-column' && 'grid-cols-\[minmax\(0,1fr\)_minmax\(0,1fr\)\]'/);
  assert.doesNotMatch(source, /Two column layout unavailable/);
  assert.doesNotMatch(source, /disabled: !canUseTwoColumnLayout/);
  assert.doesNotMatch(source, /lg:grid-cols-2/);
});
