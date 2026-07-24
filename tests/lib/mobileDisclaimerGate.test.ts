import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Window } from 'happy-dom';
import * as React from 'react';
import { act, createElement, StrictMode } from 'react';

import { hasSeenMobileDisclaimer, markMobileDisclaimerSeen } from '../../src/lib/mobileDisclaimerGate';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const makeStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
};

test('gate reads false before marking and true after', () => {
  const storage = makeStorage();
  assert.equal(hasSeenMobileDisclaimer(storage), false);
  markMobileDisclaimerSeen(storage);
  assert.equal(hasSeenMobileDisclaimer(storage), true);
});

test('gate treats a throwing or missing storage as already seen', () => {
  const throwing = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };
  assert.equal(hasSeenMobileDisclaimer(throwing), true);
  assert.doesNotThrow(() => markMobileDisclaimerSeen(throwing));
  assert.equal(hasSeenMobileDisclaimer(undefined), true);
});

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

test('useMobileDisclaimerGate shows once per session, marking in an effect (StrictMode-safe)', async () => {
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
  const { useMobileDisclaimerGate } = await import('../../src/lib/mobileDisclaimerGate');

  function Probe() {
    const [show] = useMobileDisclaimerGate();
    return createElement('output', null, String(show));
  }

  const mount = async () => {
    const container = window.document.createElement('div');
    window.document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(StrictMode, null, createElement(Probe)));
    });
    return { container, root };
  };

  try {
    // First mount of the session: shows despite StrictMode's double mount/effect.
    const first = await mount();
    assert.equal(first.container.textContent, 'true', 'first session view shows the disclaimer');
    assert.equal(window.sessionStorage.getItem('tools:mobile-disclaimer:v1'), '1', 'shown marks the session');
    await act(async () => {
      first.root.unmount();
    });

    // A later mount in the same session stays hidden.
    const second = await mount();
    assert.equal(second.container.textContent, 'false', 'same-session remount stays hidden');
    await act(async () => {
      second.root.unmount();
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

test('gate owns the boot paint: holds while showing, clears on every exit', async () => {
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
  const { clearMobileBootPaint, MOBILE_BOOT_PAINT_COLOR, MOBILE_DISCLAIMER_STORAGE_KEY, useMobileDisclaimerGate } =
    await import('../../src/lib/mobileDisclaimerGate');

  const html = window.document.documentElement;
  let dismiss: (() => void) | undefined;

  function Probe() {
    const [show, dismissDisclaimer] = useMobileDisclaimerGate();
    dismiss = dismissDisclaimer;
    return createElement('output', null, String(show));
  }

  const mount = async () => {
    const container = window.document.createElement('div');
    window.document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(StrictMode, null, createElement(Probe)));
    });
    return { container, root };
  };

  try {
    // The helper itself resets the inline style index.html set.
    html.style.backgroundColor = MOBILE_BOOT_PAINT_COLOR;
    clearMobileBootPaint();
    assert.equal(html.style.backgroundColor, '', 'clearMobileBootPaint resets the inline style');

    // Fresh session, boot script painted: the hook owns the paint while the notice shows,
    // surviving StrictMode's setup -> cleanup -> setup double-invoke.
    html.style.backgroundColor = MOBILE_BOOT_PAINT_COLOR;
    const first = await mount();
    assert.equal(first.container.textContent, 'true');
    assert.equal(html.style.backgroundColor, MOBILE_BOOT_PAINT_COLOR, 'paint holds while the notice is up');

    // Abnormal unmount mid-notice (viewport crossing) clears.
    await act(async () => {
      first.root.unmount();
    });
    assert.equal(html.style.backgroundColor, '', 'unmount while showing clears the paint');

    // Fresh session again: normal dismissal clears.
    window.sessionStorage.removeItem(MOBILE_DISCLAIMER_STORAGE_KEY);
    html.style.backgroundColor = MOBILE_BOOT_PAINT_COLOR;
    const second = await mount();
    assert.equal(second.container.textContent, 'true');
    await act(async () => {
      dismiss?.();
    });
    assert.equal(second.container.textContent, 'false');
    assert.equal(html.style.backgroundColor, '', 'dismiss clears the paint');
    await act(async () => {
      second.root.unmount();
    });

    // Seen session: a closed-gate mount clears a lingering paint defensively.
    html.style.backgroundColor = MOBILE_BOOT_PAINT_COLOR;
    const third = await mount();
    assert.equal(third.container.textContent, 'false');
    assert.equal(html.style.backgroundColor, '', 'closed gate clears the boot paint on mount');
    await act(async () => {
      third.root.unmount();
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
