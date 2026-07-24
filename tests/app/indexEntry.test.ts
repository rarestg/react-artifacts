import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Window } from 'happy-dom';
import * as React from 'react';
import { act, createElement } from 'react';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const globalKeys = [
  'Document',
  'Element',
  'Event',
  'HTMLAnchorElement',
  'HTMLDivElement',
  'HTMLElement',
  'MouseEvent',
  'MutationObserver',
  'Node',
  'cancelAnimationFrame',
  'document',
  'getComputedStyle',
  'navigator',
  'requestAnimationFrame',
  'window',
] as const;

test('index entry intercepts only plain primary clicks and leaves the rest to the browser', async () => {
  const previousGlobals = new Map<string, PropertyDescriptor | undefined>();
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  const window = new Window({ url: 'https://react-artifacts.test/' });
  const source = window as unknown as Record<string, unknown>;

  for (const key of globalKeys) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: source[key], writable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  const { createRoot } = await import('react-dom/client');
  const { IndexEntry } = await import('../../src/components/IndexEntry');

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);

  // Records whether React's handler prevented the click, then always prevents it so
  // happy-dom never attempts a real navigation.
  let lastClickPrevented: boolean | undefined;
  const recordClick = (event: Event) => {
    lastClickPrevented = event.defaultPrevented;
    event.preventDefault();
  };
  window.document.addEventListener('click', recordClick);

  const artifact = {
    id: 'message-unescaper',
    name: 'Message Unescaper',
    subtitle: 'Unescape stringified messages',
    kind: 'single' as const,
    model: 'claude',
    version: 'opus 4.5',
  };

  const dispatchClick = async (init: MouseEventInit) => {
    const anchor = window.document.querySelector('a');
    assert.ok(anchor, 'expected the entry anchor to render');
    lastClickPrevented = undefined;
    await act(async () => {
      anchor.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
    });
  };

  try {
    const selections: string[] = [];
    await act(async () => {
      root.render(
        createElement(
          'ul',
          null,
          createElement(IndexEntry, { artifact, onSelect: (id: string) => selections.push(id) }),
        ),
      );
    });

    const anchor = window.document.querySelector('a');
    assert.equal(anchor?.getAttribute('href'), '/artifact/message-unescaper');

    await dispatchClick({ button: 0 });
    assert.deepEqual(selections, ['message-unescaper'], 'plain primary click selects in-workbench');
    assert.equal(lastClickPrevented, true, 'plain primary click must be intercepted');

    await dispatchClick({ button: 0, ctrlKey: true });
    assert.deepEqual(selections, ['message-unescaper'], 'ctrl-click must not select in-workbench');
    assert.equal(lastClickPrevented, false, 'ctrl-click falls through to the native link');

    await dispatchClick({ button: 0, metaKey: true });
    assert.deepEqual(selections, ['message-unescaper'], 'meta-click must not select in-workbench');
    assert.equal(lastClickPrevented, false, 'meta-click falls through to the native link');

    await dispatchClick({ button: 0, shiftKey: true });
    assert.deepEqual(selections, ['message-unescaper'], 'shift-click must not select in-workbench');
    assert.equal(lastClickPrevented, false, 'shift-click falls through to the native link');

    await dispatchClick({ button: 0, altKey: true });
    assert.deepEqual(selections, ['message-unescaper'], 'alt-click must not select in-workbench');
    assert.equal(lastClickPrevented, false, 'alt-click falls through to the native link');

    await dispatchClick({ button: 1 });
    assert.deepEqual(selections, ['message-unescaper'], 'middle click must not select in-workbench');
    assert.equal(lastClickPrevented, false, 'middle click falls through to the native link');

    // Without onSelect (the future mobile index) the anchor is a plain link.
    await act(async () => {
      root.render(createElement('ul', null, createElement(IndexEntry, { artifact })));
    });
    await dispatchClick({ button: 0 });
    assert.deepEqual(selections, ['message-unescaper'], 'no onSelect means no in-workbench selection');
    assert.equal(lastClickPrevented, false, 'without onSelect the click stays native');
  } finally {
    window.document.removeEventListener('click', recordClick);
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
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
});
