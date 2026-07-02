import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Window } from 'happy-dom';
import * as React from 'react';
import { act, createElement } from 'react';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const globalKeys = [
  'CustomEvent',
  'Document',
  'DocumentFragment',
  'Element',
  'Event',
  'HTMLDivElement',
  'HTMLElement',
  'HTMLInputElement',
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

test('Stepper draft-then-commit: live-commit in range, clamp on Enter, empty draft never commits 0', async () => {
  const previousGlobals = new Map<string, PropertyDescriptor | undefined>();
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  const window = new Window({ url: 'https://react-artifacts.test/' });
  const source = window as unknown as Record<string, unknown>;

  for (const key of globalKeys) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: source[key], writable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  // Import react-dom/client only after the DOM globals exist so environment detection sees a browser.
  const { createRoot } = await import('react-dom/client');
  const { Stepper } = await import('../../src/components/Stepper');

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);

  const input = () => {
    const element = window.document.querySelector('input[type="number"]');
    assert.ok(element, 'expected the stepper input');
    return element as unknown as HTMLInputElement;
  };
  // React tracks controlled values through its own instrumentation, so writes must go through the
  // native prototype setter before dispatching `input` for onChange to observe a change.
  const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  assert.ok(nativeValueSetter);
  const type = async (next: string) => {
    const element = input();
    nativeValueSetter.call(element, next);
    await act(async () => {
      element.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
  };
  const pressEnter = async () => {
    await act(async () => {
      input().dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
  };
  const clickByLabel = async (label: string) => {
    const button = window.document.querySelector(`button[aria-label="${label}"]`);
    assert.ok(button, `expected a button labelled ${label}`);
    await act(async () => {
      (button as unknown as HTMLButtonElement).click();
    });
  };

  try {
    const calls: number[] = [];
    // Retries-shaped bounds: min=0 is exactly where Number('') === 0 would wrongly live-commit.
    await act(async () => {
      root.render(
        createElement(Stepper, {
          label: 'Retries',
          value: 2,
          min: 0,
          max: 10,
          onValueChange: (next: number) => calls.push(next),
        }),
      );
    });

    await clickByLabel('Increase Retries');
    assert.deepEqual(calls, [3], 'the + button commits value + step immediately');

    await type('7');
    assert.deepEqual(calls, [3, 7], 'a whole-number draft within range live-commits');

    await type('42');
    assert.deepEqual(calls, [3, 7], 'an out-of-range draft does not live-commit');
    await pressEnter();
    assert.deepEqual(calls, [3, 7, 10], 'Enter commits the draft clamped to max');
    assert.equal(input().value, '10', 'the draft snaps to the committed value');

    await type('');
    assert.deepEqual(calls, [3, 7, 10], 'an empty draft never live-commits (not even 0 at min=0)');
    await pressEnter();
    assert.deepEqual(calls, [3, 7, 10, 2], 'committing an empty draft reverts to the current value');
    assert.equal(input().value, '2', 'the draft shows the reverted value');
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
