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
  'HTMLDivElement',
  'HTMLElement',
  'MutationObserver',
  'Node',
  'cancelAnimationFrame',
  'document',
  'getComputedStyle',
  'navigator',
  'requestAnimationFrame',
  'window',
] as const;

test('useContainerWidth tracks the observed element width', async () => {
  const previousGlobals = new Map<string, PropertyDescriptor | undefined>();
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  const window = new Window({ url: 'https://react-artifacts.test/' });
  const source = window as unknown as Record<string, unknown>;

  for (const key of globalKeys) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: source[key], writable: true });
  }

  // Stub ResizeObserver so the test can fire an observation with a known content width.
  let observedElement: Element | null = null;
  let fireResize: ((width: number) => void) | null = null;
  previousGlobals.set('ResizeObserver', Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver'));
  class ResizeObserverStub {
    constructor(callback: (entries: Array<{ contentRect: { width: number } }>) => void) {
      fireResize = (width) => callback([{ contentRect: { width } }]);
    }
    observe(element: Element) {
      observedElement = element;
    }
    disconnect() {}
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: ResizeObserverStub,
    writable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  // Import react-dom/client only after the DOM globals exist so environment detection sees a browser.
  const { createRoot } = await import('react-dom/client');
  const { useContainerWidth } = await import('../../src/lib/useContainerWidth');

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);

  function Probe() {
    const { ref, width } = useContainerWidth<HTMLDivElement>();
    return createElement('div', { ref }, width === null ? 'null' : String(width));
  }

  try {
    await act(async () => {
      root.render(createElement(Probe));
    });

    // The initial synchronous measurement replaced the pre-mount null (happy-dom measures 0).
    assert.equal(container.textContent, '0');
    assert.ok(observedElement, 'expected the ref element to be observed');
    assert.ok(fireResize, 'expected a ResizeObserver callback');

    await act(async () => {
      fireResize?.(480);
    });
    assert.equal(container.textContent, '480');
  } finally {
    await act(async () => {
      root.unmount();
    });
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        delete (globalThis as unknown as Record<string, unknown>)[key];
      }
    }
    window.close();
  }
});
