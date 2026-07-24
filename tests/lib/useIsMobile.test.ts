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

test('useIsMobile reads the 768px query synchronously and follows change events', async () => {
  const previousGlobals = new Map<string, PropertyDescriptor | undefined>();
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  const window = new Window({ url: 'https://react-artifacts.test/' });
  const source = window as unknown as Record<string, unknown>;

  for (const key of globalKeys) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: source[key], writable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  // Controllable matchMedia stub: records queries, supports change listeners.
  const queries: string[] = [];
  const listeners = new Set<() => void>();
  let matches = false;
  (window as unknown as Record<string, unknown>).matchMedia = (query: string) => {
    queries.push(query);
    return {
      get matches() {
        return matches;
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    };
  };

  const { createRoot } = await import('react-dom/client');
  const { MOBILE_MEDIA_QUERY, useIsMobile } = await import('../../src/lib/useIsMobile');

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);

  function Probe() {
    return createElement('output', null, String(useIsMobile()));
  }

  try {
    assert.equal(MOBILE_MEDIA_QUERY, '(max-width: 767.98px)');

    await act(async () => {
      root.render(createElement(Probe));
    });
    assert.equal(container.textContent, 'false', 'initial synchronous read');
    assert.ok(queries.length > 0, 'expected matchMedia to be consulted');
    assert.ok(
      queries.every((query) => query === MOBILE_MEDIA_QUERY),
      `expected only the mobile query, got: ${queries.join(', ')}`,
    );
    assert.equal(listeners.size, 1, 'expected one change subscription');

    matches = true;
    await act(async () => {
      for (const listener of listeners) listener();
    });
    assert.equal(container.textContent, 'true', 're-renders when the media query flips');

    await act(async () => {
      root.unmount();
    });
    assert.equal(listeners.size, 0, 'unmount removes the change listener');

    // Mounting while the query already matches must read true synchronously — no
    // desktop-first flash on phones.
    const mobileFirstContainer = window.document.createElement('div');
    window.document.body.append(mobileFirstContainer);
    const mobileFirstRoot = createRoot(mobileFirstContainer);
    await act(async () => {
      mobileFirstRoot.render(createElement(Probe));
    });
    assert.equal(mobileFirstContainer.textContent, 'true', 'initially-matching mount reads true');
    await act(async () => {
      mobileFirstRoot.unmount();
    });
  } finally {
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
