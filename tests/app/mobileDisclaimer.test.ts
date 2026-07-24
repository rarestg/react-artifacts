import assert from 'node:assert/strict';
import { type TestContext, test } from 'node:test';

import { Window } from 'happy-dom';
import * as React from 'react';
import { act, createElement } from 'react';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const globalKeys = [
  'Document',
  'Element',
  'Event',
  'HTMLButtonElement',
  'HTMLElement',
  'KeyboardEvent',
  'MouseEvent',
  'MutationObserver',
  'Node',
  'document',
  'getComputedStyle',
  'navigator',
  'window',
] as const;

type Harness = {
  window: InstanceType<typeof Window>;
  overlay: () => Element;
  copy: () => Element;
  clickOverlay: () => Promise<void>;
  pressEscape: () => Promise<void>;
  flushRaf: () => Promise<void>;
  pendingRafCount: () => number;
  tick: (ms: number) => Promise<void>;
  doneCount: () => number;
};

// Mounts MobileDisclaimer with mocked setTimeout and a controllable rAF queue so the spec
// timeline (0.5s copy fade-in / exit at 2.0s as 0.6s scrim + 0.25s copy fades, 200ms skip,
// 1.4s reduced hold) runs deterministically.
async function withDisclaimer(
  t: TestContext,
  { reduceMotion }: { reduceMotion: boolean },
  run: (harness: Harness) => Promise<void>,
) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const previousGlobals = new Map<string, PropertyDescriptor | undefined>();
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  const window = new Window({ url: 'https://react-artifacts.test/' });
  const source = window as unknown as Record<string, unknown>;

  for (const key of globalKeys) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: source[key], writable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  (window as unknown as Record<string, unknown>).matchMedia = (query: string) => ({
    matches: reduceMotion && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });

  // Controllable rAF queue (cancel actually cancels, flush is explicit).
  const rafQueue = new Map<number, FrameRequestCallback>();
  let nextRafId = 1;
  for (const key of ['requestAnimationFrame', 'cancelAnimationFrame']) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  }
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value: (callback: FrameRequestCallback) => {
      const id = nextRafId++;
      rafQueue.set(id, callback);
      return id;
    },
  });
  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    configurable: true,
    writable: true,
    value: (id: number) => {
      rafQueue.delete(id);
    },
  });

  const { createRoot } = await import('react-dom/client');
  const { MobileDisclaimer } = await import('../../src/components/MobileDisclaimer');

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);

  let doneCount = 0;

  const overlay = () => {
    // <output> carries the implicit status live-region role the spec asks for.
    const element = window.document.querySelector('output');
    assert.ok(element, 'expected the disclaimer overlay to render');
    return element as unknown as Element;
  };

  // The full-overlay <button> doubles as the copy wrapper: it fades while the scrim stays solid.
  const copy = () => {
    const element = window.document.querySelector('button');
    assert.ok(element, 'expected the overlay button to render');
    return element as unknown as Element;
  };

  try {
    await act(async () => {
      root.render(createElement(MobileDisclaimer, { onDone: () => doneCount++ }));
    });

    await run({
      window,
      overlay,
      copy,
      clickOverlay: async () => {
        const button = window.document.querySelector('button');
        assert.ok(button, 'expected the overlay button to render');
        await act(async () => {
          button.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
        });
      },
      pressEscape: async () => {
        await act(async () => {
          window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        });
      },
      flushRaf: async () => {
        const callbacks = [...rafQueue.values()];
        rafQueue.clear();
        await act(async () => {
          for (const callback of callbacks) callback(0);
        });
      },
      pendingRafCount: () => rafQueue.size,
      tick: async (ms: number) => {
        await act(async () => {
          t.mock.timers.tick(ms);
        });
      },
      doneCount: () => doneCount,
    });
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
}

test('motion timeline: solid scrim from mount, copy fades in, exits at 2s, calls onDone once', async (t) => {
  await withDisclaimer(t, { reduceMotion: false }, async (h) => {
    // The regression this pins: the scrim must never be transparent while entering.
    assert.doesNotMatch(h.overlay().className, /opacity-0/, 'the scrim is opaque from the first frame');
    assert.match(h.copy().className, /opacity-0/, 'only the copy mounts transparent');
    assert.match(h.overlay().textContent ?? '', /designed for larger screens/);
    assert.match(h.overlay().textContent ?? '', /They will still run on this one\./);
    assert.match(h.overlay().textContent ?? '', /Tap to continue/);

    await h.flushRaf();
    assert.match(h.copy().className, /opacity-100/, 'the mount rAF starts the copy fade-in');
    assert.doesNotMatch(h.overlay().className, /opacity-0/, 'the scrim stays opaque through the fade-in');

    await h.tick(1999);
    assert.match(h.copy().className, /opacity-100/, 'still shown just before 2s');
    assert.equal(h.doneCount(), 0);

    await h.tick(1);
    assert.match(h.overlay().className, /opacity-0/, 'the scrim fade-out starts at the 2s mark');
    assert.match(h.overlay().className, /duration-\[600ms\]/);
    assert.match(h.copy().className, /opacity-0/, 'the copy fades out with the scrim');
    assert.match(h.copy().className, /duration-\[250ms\]/, 'the copy exits faster than the 600ms scrim');
    assert.equal(h.doneCount(), 0, 'not done until the fade-out ends');

    await h.tick(600);
    assert.equal(h.doneCount(), 1, 'onDone fires when the fade-out completes');

    await h.tick(5000);
    await h.clickOverlay();
    assert.equal(h.doneCount(), 1, 'onDone stays idempotent');
  });
});

test('tap before the mount rAF cancels the fade-in and skips fast', async (t) => {
  await withDisclaimer(t, { reduceMotion: false }, async (h) => {
    await h.clickOverlay();
    assert.match(h.overlay().className, /opacity-0/);
    assert.match(h.overlay().className, /duration-200/, 'skip fades the scrim fast');
    assert.match(h.copy().className, /opacity-0/);
    assert.match(h.copy().className, /duration-200/, 'skip fades the copy at the same speed');
    assert.equal(h.pendingRafCount(), 0, 'the pending mount rAF was cancelled');

    await h.flushRaf();
    assert.match(h.overlay().className, /duration-200/, 'a stray frame cannot resurrect the fade-in');

    await h.tick(200);
    assert.equal(h.doneCount(), 1);
  });
});

test('Escape skips with the fast fade', async (t) => {
  await withDisclaimer(t, { reduceMotion: false }, async (h) => {
    await h.flushRaf();
    await h.pressEscape();
    assert.match(h.overlay().className, /opacity-0/);
    assert.match(h.overlay().className, /duration-200/);
    assert.match(h.copy().className, /opacity-0/);
    assert.match(h.copy().className, /duration-200/);
    await h.tick(200);
    assert.equal(h.doneCount(), 1);
  });
});

test('reduced motion: instant show, 1.4s hold, instant remove', async (t) => {
  await withDisclaimer(t, { reduceMotion: true }, async (h) => {
    assert.match(h.overlay().className, /opacity-100/, 'no fade-in under reduced motion');
    assert.match(h.copy().className, /opacity-100/, 'the copy shows instantly under reduced motion');
    assert.equal(h.pendingRafCount(), 0, 'no rAF flip is scheduled');

    await h.tick(1399);
    assert.equal(h.doneCount(), 0);
    await h.tick(1);
    assert.equal(h.doneCount(), 1, 'removed at 1.4s without a fade-out phase');
  });
});

test('reduced motion: tap and Escape dismiss immediately', async (t) => {
  await withDisclaimer(t, { reduceMotion: true }, async (h) => {
    await h.clickOverlay();
    assert.equal(h.doneCount(), 1, 'tap dismisses with no fade delay');
    await h.pressEscape();
    assert.equal(h.doneCount(), 1, 'later Escape stays a no-op');
  });
});
