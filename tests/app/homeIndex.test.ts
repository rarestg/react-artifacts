import assert from 'node:assert/strict';
import test from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { HomeIndex } from '../../src/components/HomeIndex';
import type { IndexEntryArtifact } from '../../src/components/IndexEntry';

// The components' JSX compiles to bare React.createElement calls under tsx.
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const fixtures: readonly IndexEntryArtifact[] = [
  {
    id: 'message-unescaper',
    name: 'Message Unescaper',
    subtitle: 'Unescape stringified messages',
    kind: 'single',
    model: 'claude',
    version: 'opus 4.5',
  },
  { id: 'palette-lab', name: 'Palette Lab', subtitle: undefined, kind: 'app', model: undefined, version: undefined },
  {
    id: 'example',
    name: 'Example',
    subtitle: 'Single-file copy target',
    kind: 'single',
    model: undefined,
    version: undefined,
  },
  {
    id: 'example-app',
    name: 'Example App',
    subtitle: 'Multi-file copy target',
    kind: 'app',
    model: undefined,
    version: undefined,
  },
];

const render = () =>
  renderToStaticMarkup(React.createElement(HomeIndex, { artifacts: fixtures, onSelectArtifact: () => undefined }));

test('home index renders real standalone links for every artifact', () => {
  const html = render();

  for (const artifact of fixtures) {
    assert.match(html, new RegExp(`href="/artifact/${artifact.id}"`));
  }
});

test('home index overline counts tools without the examples group', () => {
  const html = render();

  assert.match(html, /Index · 2 tools/);
});

test('home index demotes examples under their own rule after the tools list', () => {
  const html = render();

  const examplesHeading = html.indexOf('Examples');
  assert.notEqual(examplesHeading, -1);
  assert.ok(html.indexOf('href="/artifact/message-unescaper"') < examplesHeading);
  assert.ok(html.indexOf('href="/artifact/palette-lab"') < examplesHeading);
  assert.ok(html.indexOf('href="/artifact/example"') > examplesHeading);
  assert.ok(html.indexOf('href="/artifact/example-app"') > examplesHeading);
});

test('home index renders the wordmark, explainer, and blog footer link', () => {
  const html = render();

  assert.match(html, /tools\.rares\.blog/);
  assert.match(html, /Small, single-purpose web tools/);
  assert.match(html, /Pick one to open it\./);
  assert.match(html, /href="https:\/\/rares\.blog"/);
});

test('home index prefixes tool titles with jump-key chips and aria-keyshortcuts', () => {
  const html = render();

  assert.match(html, /<a href="\/artifact\/message-unescaper" aria-keyshortcuts="1"/);
  assert.match(html, /<a href="\/artifact\/palette-lab" aria-keyshortcuts="2"/);
  assert.match(html, /<kbd aria-hidden="true"[^>]*>1<\/kbd>/);
  assert.match(html, /<kbd aria-hidden="true"[^>]*>2<\/kbd>/);
  assert.ok(html.indexOf('>1</kbd>') < html.indexOf('Message Unescaper'), 'chip leads the title');
});

test('home index gives examples no jump keys and stops handing out keys after six tools', () => {
  const manyTools: IndexEntryArtifact[] = Array.from({ length: 7 }, (_, index) => ({
    id: `tool-${index + 1}`,
    name: `Tool ${index + 1}`,
    subtitle: undefined,
    kind: 'single',
    model: undefined,
    version: undefined,
  }));
  const html = renderToStaticMarkup(
    React.createElement(HomeIndex, {
      artifacts: [...manyTools, ...fixtures.slice(2)],
      onSelectArtifact: () => undefined,
    }),
  );

  assert.match(html, /<a href="\/artifact\/tool-6" aria-keyshortcuts="6"/);
  assert.doesNotMatch(html, /<a href="\/artifact\/tool-7" aria-keyshortcuts=/);
  assert.doesNotMatch(html, /<kbd aria-hidden="true"[^>]*>7<\/kbd>/);
  assert.doesNotMatch(html, /<a href="\/artifact\/example[^"]*" aria-keyshortcuts=/);
});

test('index entries join present metadata and omit missing fields cleanly', () => {
  const html = render();

  assert.match(html, /single · claude · opus 4\.5/);
  assert.doesNotMatch(html, /undefined/);
  assert.doesNotMatch(html, /· ·/);
  assert.doesNotMatch(html, /·\s*</);
});
