import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Window } from 'happy-dom';
import * as React from 'react';
import { act, createElement } from 'react';

import type { InputProps } from '../../src/components/Input';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

// Base UI Field references these as bare globals during a client render.
const globalKeys = [
  'CustomEvent',
  'Document',
  'Element',
  'Event',
  'HTMLDivElement',
  'HTMLElement',
  'HTMLInputElement',
  'MutationObserver',
  'Node',
  'ResizeObserver',
  'cancelAnimationFrame',
  'document',
  'getComputedStyle',
  'navigator',
  'requestAnimationFrame',
  'window',
] as const;

async function withMountedInput(
  props: InputProps,
  assertion: (input: HTMLInputElement, container: HTMLElement) => void | Promise<void>,
) {
  const previousGlobals = new Map<string, PropertyDescriptor | undefined>();
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  const window = new Window({ url: 'https://react-artifacts.test/' });
  const source = window as unknown as Record<string, unknown>;

  for (const key of globalKeys) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: source[key], writable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  // Import Base UI (via Input) and react-dom/client only after the DOM globals exist, so their
  // module-load environment detection resolves to a browser and layout effects run.
  const { createRoot } = await import('react-dom/client');
  const { Input } = await import('../../src/components/Input');

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container as unknown as Element);

  try {
    await act(async () => {
      root.render(createElement(Input, props));
    });
    const input = container.querySelector('input');
    assert.ok(input, 'expected the native input to render');
    await assertion(input as unknown as HTMLInputElement, container as unknown as HTMLElement);
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
}

function describedByIds(input: HTMLInputElement) {
  return input.getAttribute('aria-describedby')?.split(' ') ?? [];
}

test('Input associates the label with the input and honors a custom id', async () => {
  await withMountedInput({ id: 'workspace-name', label: 'Workspace' }, (input, container) => {
    const label = container.querySelector('label');
    assert.ok(label);
    assert.equal(input.id, 'workspace-name');
    assert.equal(label.getAttribute('for'), 'workspace-name');
  });
});

test('Input generates a matching label association when no id is provided', async () => {
  await withMountedInput({ label: 'Email' }, (input, container) => {
    const label = container.querySelector('label');
    assert.ok(label);
    assert.ok(input.id);
    assert.equal(label.getAttribute('for'), input.id);
  });
});

test('Input references helper text via aria-describedby', async () => {
  await withMountedInput({ label: 'Workspace', helperText: 'Use a short readable name.' }, (input, container) => {
    const ids = describedByIds(input);
    assert.equal(ids.length, 1);
    const helper = container.ownerDocument.getElementById(ids[0]);
    assert.equal(helper?.textContent, 'Use a short readable name.');
  });
});

test('Input references helper then error when both are present', async () => {
  await withMountedInput(
    { label: 'Email', helperText: 'Work email preferred.', error: 'Invalid email address' },
    (input, container) => {
      const ids = describedByIds(input);
      assert.equal(ids.length, 2);
      const [helper, error] = ids.map((id) => container.ownerDocument.getElementById(id));
      assert.equal(helper?.textContent, 'Work email preferred.');
      assert.equal(error?.textContent, 'Invalid email address');
      assert.equal(input.getAttribute('aria-invalid'), 'true');
    },
  );
});

test('Input keeps caller-provided aria-describedby ahead of its own descriptions', async () => {
  await withMountedInput(
    { label: 'Email', helperText: 'Helper', 'aria-describedby': 'external-hint' },
    (input, container) => {
      const ids = describedByIds(input);
      assert.equal(ids.length, 2);
      assert.equal(ids[0], 'external-hint');
      assert.equal(container.ownerDocument.getElementById(ids[1])?.textContent, 'Helper');
    },
  );
});

test('Input error state overrides caller-provided aria-invalid false', async () => {
  await withMountedInput({ label: 'Email', error: 'Invalid email address', 'aria-invalid': false }, (input) => {
    assert.equal(input.getAttribute('aria-invalid'), 'true');
  });
});

test('Input omits aria-invalid on disabled controls even with an error (Base UI Field behavior)', async () => {
  await withMountedInput({ label: 'Email', error: 'Invalid email address', disabled: true }, (input) => {
    assert.ok(input.hasAttribute('disabled'));
    assert.equal(input.getAttribute('aria-invalid'), null);
  });
});

test('Input supports compact accessible names without a visible label', async () => {
  await withMountedInput({ 'aria-label': 'Filter projects', placeholder: 'Search' }, (input, container) => {
    assert.equal(input.getAttribute('aria-label'), 'Filter projects');
    assert.equal(input.getAttribute('aria-labelledby'), null);
    assert.equal(container.querySelector('label'), null);
  });
});

test('Input lets aria-label win the accessible name over a visible label', async () => {
  // RetryPanel regression: label="Pages" + aria-label="Pages to re-OCR" must keep the aria-label
  // name, so Field.Control's injected aria-labelledby has to stay suppressed.
  await withMountedInput({ label: 'Pages', 'aria-label': 'Pages to re-OCR' }, (input, container) => {
    assert.equal(container.querySelector('label')?.textContent, 'Pages');
    assert.equal(input.getAttribute('aria-label'), 'Pages to re-OCR');
    assert.equal(input.getAttribute('aria-labelledby'), null);
  });
});

test('Input preserves caller-provided aria-labelledby', async () => {
  await withMountedInput({ label: 'Pages', 'aria-labelledby': 'custom-label-id' }, (input) => {
    assert.equal(input.getAttribute('aria-labelledby'), 'custom-label-id');
  });
});
