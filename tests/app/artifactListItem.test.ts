import assert from 'node:assert/strict';
import test from 'node:test';

import { Window } from 'happy-dom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';

import { ArtifactListItem } from '../../src/components/ArtifactListItem';

type DomGlobals = Pick<
  typeof globalThis,
  'Document' | 'HTMLButtonElement' | 'HTMLElement' | 'Node' | 'document' | 'navigator' | 'window'
>;

const globalKeys = [
  'Document',
  'HTMLButtonElement',
  'HTMLElement',
  'Node',
  'document',
  'navigator',
  'window',
] as const satisfies ReadonlyArray<keyof DomGlobals>;

async function withMountedListItem(assertion: (window: Window) => void | Promise<void>) {
  const previousGlobals = new Map<keyof DomGlobals, PropertyDescriptor | undefined>();
  const previousActEnvironmentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  const window = new Window({ url: 'https://react-artifacts.test/' });

  for (const key of globalKeys) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  }

  for (const [key, value] of Object.entries({
    Document: window.Document,
    HTMLButtonElement: window.HTMLButtonElement,
    HTMLElement: window.HTMLElement,
    Node: window.Node,
    document: window.document,
    navigator: window.navigator,
    window,
  })) {
    Object.defineProperty(globalThis, key, { configurable: true, value, writable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  const container = window.document.createElement('ul');
  window.document.body.append(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(
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
      );
    });
    await assertion(window);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    window.close();

    for (const key of globalKeys) {
      const descriptor = previousGlobals.get(key);
      if (descriptor === undefined) {
        Reflect.deleteProperty(globalThis, key);
      } else {
        Object.defineProperty(globalThis, key, descriptor);
      }
    }
    if (previousActEnvironmentDescriptor === undefined) {
      Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
    } else {
      Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', previousActEnvironmentDescriptor);
    }
  }
}

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

test('artifact subtitle tooltip appears on keyboard focus and clears on blur', async () => {
  await withMountedListItem(async (window) => {
    const button = window.document.querySelector('button');

    assert.ok(button instanceof window.HTMLButtonElement);
    assert.equal(window.document.querySelector('[role="tooltip"]'), null);

    await act(async () => {
      button.focus();
    });

    const tooltip = window.document.querySelector('[role="tooltip"]');
    assert.ok(tooltip instanceof window.HTMLElement);
    assert.equal(tooltip.textContent, 'Multi-file artifact with components');
    assert.equal(button.getAttribute('aria-describedby'), tooltip.id);

    await act(async () => {
      button.blur();
    });

    assert.equal(window.document.querySelector('[role="tooltip"]'), null);
    assert.equal(button.hasAttribute('aria-describedby'), false);
  });
});

test('artifact subtitle tooltip appears on subtitle hover and clears on pointer leave', async () => {
  await withMountedListItem(async (window) => {
    const button = window.document.querySelector('button');
    const subtitle = Array.from(window.document.querySelectorAll('div')).find(
      (element) => element.textContent === 'Multi-file artifact with components',
    );

    assert.ok(button instanceof window.HTMLButtonElement);
    assert.ok(subtitle instanceof window.HTMLElement);

    await act(async () => {
      subtitle.dispatchEvent(new window.MouseEvent('mousemove', { bubbles: true }));
    });

    assert.equal(window.document.querySelector('[role="tooltip"]')?.textContent, 'Multi-file artifact with components');

    await act(async () => {
      button.dispatchEvent(new window.MouseEvent('mouseout', { bubbles: true, relatedTarget: window.document.body }));
    });

    assert.equal(window.document.querySelector('[role="tooltip"]'), null);
  });
});

test('artifact subtitle tooltip flips above the subtitle near the viewport bottom', async () => {
  await withMountedListItem(async (window) => {
    const button = window.document.querySelector('button');
    const subtitle = Array.from(window.document.querySelectorAll('div')).find(
      (element) => element.textContent === 'Multi-file artifact with components',
    );

    assert.ok(button instanceof window.HTMLButtonElement);
    assert.ok(subtitle instanceof window.HTMLElement);

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 320 });
    subtitle.getBoundingClientRect = () =>
      ({
        bottom: 300,
        height: 12,
        left: 24,
        right: 240,
        top: 288,
        width: 216,
        x: 24,
        y: 288,
        toJSON: () => undefined,
      }) as DOMRect;

    await act(async () => {
      subtitle.dispatchEvent(new window.MouseEvent('mousemove', { bubbles: true }));
    });

    const tooltip = window.document.querySelector('[role="tooltip"]');

    assert.ok(tooltip instanceof window.HTMLElement);
    assert.equal(tooltip.style.top, '280px');
    assert.equal(tooltip.style.transform, 'translateY(-100%)');
  });
});
