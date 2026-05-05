import assert from 'node:assert/strict';
import test from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ArtifactListItem } from '../../src/components/ArtifactListItem';

test('artifact list item keeps metadata inside the selection button and standalone link separate', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      'ul',
      null,
      React.createElement(ArtifactListItem, {
        artifact: {
          id: 'example-app',
          name: 'Example App',
          subtitle: 'Multi-file artifact with components',
          kind: 'app',
          model: 'claude',
          version: 'opus 4.5',
        },
        selected: false,
        onSelect: () => undefined,
      }),
    ),
  );

  const buttonStart = html.indexOf('<button');
  const buttonEnd = html.indexOf('</button>');
  const standaloneLinkStart = html.indexOf('<a ');

  assert.notEqual(buttonStart, -1);
  assert.notEqual(buttonEnd, -1);
  assert.ok(standaloneLinkStart > buttonEnd);

  const buttonHtml = html.slice(buttonStart, buttonEnd);

  assert.match(buttonHtml, /aria-label="Select Example App"/);
  assert.match(buttonHtml, /Example App/);
  assert.match(buttonHtml, /Multi-file artifact with components/);
  assert.match(buttonHtml, /claude/);
  assert.match(buttonHtml, /opus 4\.5/);
  assert.doesNotMatch(buttonHtml, /<a /);

  assert.match(html.slice(standaloneLinkStart), /href="\/artifact\/example-app"/);
});
