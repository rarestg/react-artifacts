import assert from 'node:assert/strict';
import test from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { IndexEntryArtifact } from '../../src/components/IndexEntry';
import { MobileIndex } from '../../src/components/MobileIndex';

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

const render = () => renderToStaticMarkup(React.createElement(MobileIndex, { artifacts: fixtures }));

test('mobile index renders native standalone links for the tools', () => {
  const html = render();

  assert.match(html, /href="\/artifact\/message-unescaper"/);
  assert.match(html, /href="\/artifact\/palette-lab"/);
});

test('mobile index excludes the examples group entirely', () => {
  const html = render();

  assert.doesNotMatch(html, /href="\/artifact\/example"/);
  assert.doesNotMatch(html, /href="\/artifact\/example-app"/);
  assert.doesNotMatch(html, /Examples/);
});

test('mobile index overline counts only the non-example tools', () => {
  const html = render();

  assert.match(html, /Index · 2 tools/);
});

test('mobile index renders the wordmark, explainer, divided rows, and blog footer link', () => {
  const html = render();

  assert.match(html, /tools\.rares\.blog/);
  assert.match(html, /Small, single-purpose web tools/);
  assert.match(html, /Pick one to open it\./);
  assert.match(html, /divide-y/);
  assert.match(html, /href="https:\/\/rares\.blog"/);
});
