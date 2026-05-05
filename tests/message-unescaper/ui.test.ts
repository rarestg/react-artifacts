import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

async function renderMessageUnescaper() {
  const { default: MessageUnescaper } = await import('../../src/artifacts/message-unescaper');
  return renderToStaticMarkup(createElement(MessageUnescaper));
}

test('Message Unescaper output toggles keep stable names and describe disabled reasons separately', async () => {
  const markup = await renderMessageUnescaper();

  assert.match(markup, />Show dash breaks</);
  assert.match(markup, />Replace with periods</);
  assert.match(markup, /title="Enter text to detect dash breaks"/);
  assert.match(markup, /title="Enter text to enable dash replacement"/);
  assert.match(markup, /aria-describedby="[^"]+"/);
  assert.doesNotMatch(markup, /aria-label="Enter text to detect dash breaks"/);
  assert.doesNotMatch(markup, /aria-label="Enter text to enable dash replacement"/);
});
