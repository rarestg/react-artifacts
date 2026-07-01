import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Window } from 'happy-dom';
import * as React from 'react';
import { act, createElement } from 'react';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

// Base UI ToggleGroup/Toggle (composite roving focus) reference these as bare globals on a client render.
const globalKeys = [
  'CustomEvent',
  'Document',
  'DocumentFragment',
  'Element',
  'Event',
  'HTMLDivElement',
  'HTMLElement',
  'KeyboardEvent',
  'MouseEvent',
  'MutationObserver',
  'Node',
  'PointerEvent',
  'ResizeObserver',
  'cancelAnimationFrame',
  'document',
  'getComputedStyle',
  'navigator',
  'requestAnimationFrame',
  'window',
] as const;

test('SegmentedControl selects a new option but never deselects the active one (single-select guard)', async () => {
  const previousGlobals = new Map<string, PropertyDescriptor | undefined>();
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  const window = new Window({ url: 'https://react-artifacts.test/' });
  const source = window as unknown as Record<string, unknown>;

  for (const key of globalKeys) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: source[key], writable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  // Import Base UI (and react-dom/client) only after the DOM globals exist so their environment
  // detection resolves to a browser and the composite click handlers wire up.
  const { createRoot } = await import('react-dom/client');
  const { SegmentedControl } = await import('../../src/components/SegmentedControl');

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);

  const clickByLabel = async (label: string) => {
    const button = [...window.document.querySelectorAll('button')].find(
      // The visible label lives in the .truncate span; the sibling reserve span is aria-hidden.
      (candidate) => candidate.querySelector('.truncate')?.textContent?.trim() === label,
    );
    assert.ok(button, `expected a segment button labelled ${label}`);
    await act(async () => {
      (button as unknown as HTMLButtonElement).click();
    });
  };

  try {
    const calls: string[] = [];
    await act(async () => {
      root.render(
        createElement(SegmentedControl, {
          ariaLabel: 'Mode',
          value: 'a',
          onValueChange: (next: string) => calls.push(next),
          options: [
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ],
        }),
      );
    });

    // Clicking the already-active item deselects to an empty array in Base UI single-select; the guard
    // must swallow that so the governor control stays anchored (UI notes #002/#003).
    await clickByLabel('Alpha');
    assert.deepEqual(calls, [], 'clicking the active option must not fire onValueChange');

    // Clicking an inactive item still selects it.
    await clickByLabel('Beta');
    assert.deepEqual(calls, ['b'], 'clicking an inactive option selects it');
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
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
});
