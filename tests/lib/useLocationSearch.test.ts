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

test('useLocationSearch reads synchronously and follows popstate (mobile Back regression)', async () => {
  const previousGlobals = new Map<string, PropertyDescriptor | undefined>();
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  const window = new Window({ url: 'https://react-artifacts.test/?artifact=palette-lab' });
  const source = window as unknown as Record<string, unknown>;

  for (const key of globalKeys) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: source[key], writable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  // Track popstate subscriptions so unmount cleanup is provable.
  const popstateListeners = new Set<EventListener>();
  const originalAdd = window.addEventListener.bind(window);
  const originalRemove = window.removeEventListener.bind(window);
  window.addEventListener = ((type: string, listener: EventListener, ...rest: unknown[]) => {
    if (type === 'popstate') popstateListeners.add(listener);
    return originalAdd(type, listener, ...(rest as []));
  }) as typeof window.addEventListener;
  window.removeEventListener = ((type: string, listener: EventListener, ...rest: unknown[]) => {
    if (type === 'popstate') popstateListeners.delete(listener);
    return originalRemove(type, listener, ...(rest as []));
  }) as typeof window.removeEventListener;

  const { createRoot } = await import('react-dom/client');
  const { useLocationSearch } = await import('../../src/lib/useLocationSearch');

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);

  function Probe() {
    return createElement('output', null, useLocationSearch());
  }

  try {
    await act(async () => {
      root.render(createElement(Probe));
    });
    assert.equal(container.textContent, '?artifact=palette-lab', 'initial synchronous read');
    assert.equal(popstateListeners.size, 1, 'expected one popstate subscription');

    // History navigation (Back/Forward) fires popstate: the hook must re-render with the
    // new search — this is what lets mobile App re-evaluate the deep-link redirect.
    await act(async () => {
      window.history.replaceState({}, '', '/');
      window.dispatchEvent(new window.Event('popstate'));
    });
    assert.equal(container.textContent, '', 're-renders when history navigation changes the search');

    await act(async () => {
      root.unmount();
    });
    assert.equal(popstateListeners.size, 0, 'unmount removes the popstate listener');
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
