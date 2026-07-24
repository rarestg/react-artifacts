import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Window } from 'happy-dom';
import * as React from 'react';
import { act, createElement } from 'react';

import type { IndexEntryArtifact } from '../../src/components/IndexEntry';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const globalKeys = [
  'Document',
  'Element',
  'Event',
  'HTMLAnchorElement',
  'HTMLDivElement',
  'HTMLElement',
  'HTMLInputElement',
  'KeyboardEvent',
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
];

test('home index jump keys select tools and respect every guard', async () => {
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
  const { HomeIndex } = await import('../../src/components/HomeIndex');

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);

  const selections: string[] = [];
  let lastEvent: KeyboardEvent | undefined;
  const dispatchKey = async (init: KeyboardEventInit, target: EventTarget = window.document.body) => {
    const event = new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    lastEvent = event as unknown as KeyboardEvent;
    await act(async () => {
      target.dispatchEvent(event as unknown as Event);
    });
  };

  try {
    await act(async () => {
      root.render(
        createElement(HomeIndex, { artifacts: fixtures, onSelectArtifact: (id: string) => selections.push(id) }),
      );
    });

    await dispatchKey({ key: '2' });
    assert.deepEqual(selections, ['palette-lab'], 'a plain digit selects the matching tool');
    assert.equal(lastEvent?.defaultPrevented, true, 'a matched digit is consumed');

    await dispatchKey({ key: '2', shiftKey: true });
    assert.deepEqual(
      selections,
      ['palette-lab', 'palette-lab'],
      'shift stays allowed (some layouts need it for digits)',
    );

    selections.length = 0;

    await dispatchKey({ key: '3' });
    assert.deepEqual(selections, [], 'examples never get jump keys');
    assert.equal(lastEvent?.defaultPrevented, false, 'an unmatched digit is left alone');

    await dispatchKey({ key: '1', ctrlKey: true });
    await dispatchKey({ key: '1', metaKey: true });
    await dispatchKey({ key: '1', altKey: true });
    assert.deepEqual(selections, [], 'chorded digits belong to the browser');

    await dispatchKey({ key: '1', repeat: true });
    assert.deepEqual(selections, [], 'held-key repeats do not select');

    await dispatchKey({ key: '1', isComposing: true });
    assert.deepEqual(selections, [], 'IME composition does not select');

    const input = window.document.createElement('input');
    window.document.body.append(input);
    await dispatchKey({ key: '1' }, input);
    assert.deepEqual(selections, [], 'typing into an editable target does not select');
    input.remove();

    const preventFirst = (event: Event) => event.preventDefault();
    window.addEventListener('keydown', preventFirst, { capture: true });
    await dispatchKey({ key: '1' });
    window.removeEventListener('keydown', preventFirst, { capture: true });
    assert.deepEqual(selections, [], 'an already-handled keystroke is ignored');

    await act(async () => {
      root.unmount();
    });
    await dispatchKey({ key: '1' });
    assert.deepEqual(selections, [], 'unmounting removes the listener');
  } finally {
    // Unmounting an already-unmounted root is a no-op.
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
