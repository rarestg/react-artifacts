import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Window } from 'happy-dom';
import * as React from 'react';
import { act, createElement, createRef, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';

import { ArtifactThemeRoot } from '../../src/components/ArtifactThemeRoot';
import { Button } from '../../src/components/Button';
import {
  CopyButton as SharedCopyButton,
  type CopyButtonHandle as SharedCopyButtonHandle,
} from '../../src/components/CopyButton';
import { Input } from '../../src/components/Input';
import { Panel } from '../../src/components/Panel';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

type DomGlobals = Pick<
  typeof globalThis,
  | 'Document'
  | 'HTMLButtonElement'
  | 'HTMLDivElement'
  | 'HTMLElement'
  | 'HTMLInputElement'
  | 'Node'
  | 'document'
  | 'navigator'
  | 'window'
>;

const globalKeys = [
  'Document',
  'HTMLButtonElement',
  'HTMLDivElement',
  'HTMLElement',
  'HTMLInputElement',
  'Node',
  'document',
  'navigator',
  'window',
] as const satisfies ReadonlyArray<keyof DomGlobals>;

async function withMountedElement(element: ReactElement, assertion: (window: Window) => void | Promise<void>) {
  const previousGlobals = new Map<keyof DomGlobals, PropertyDescriptor | undefined>();
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  const window = new Window({ url: 'https://react-artifacts.test/' });

  for (const key of globalKeys) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  }

  for (const [key, value] of Object.entries({
    Document: window.Document,
    HTMLButtonElement: window.HTMLButtonElement,
    HTMLDivElement: window.HTMLDivElement,
    HTMLElement: window.HTMLElement,
    HTMLInputElement: window.HTMLInputElement,
    Node: window.Node,
    document: window.document,
    navigator: window.navigator,
    window,
  })) {
    Object.defineProperty(globalThis, key, { configurable: true, value, writable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(element);
    });
    await assertion(window);
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

test('Button object and callback refs receive mounted button elements', async () => {
  const objectRef = createRef<HTMLButtonElement>();
  let callbackRef: HTMLButtonElement | null = null;

  await withMountedElement(
    createElement(
      ArtifactThemeRoot,
      null,
      createElement(Button, { ref: objectRef }, 'Object ref'),
      createElement(
        Button,
        {
          ref: (node) => {
            callbackRef = node;
          },
        },
        'Callback ref',
      ),
    ),
    (window) => {
      assert.ok(objectRef.current instanceof window.HTMLButtonElement);
      assert.ok(callbackRef instanceof window.HTMLButtonElement);
    },
  );
});

test('Panel object and callback refs receive mounted div elements', async () => {
  const objectRef = createRef<HTMLDivElement>();
  let callbackRef: HTMLDivElement | null = null;

  await withMountedElement(
    createElement(
      ArtifactThemeRoot,
      null,
      createElement(Panel, { ref: objectRef }, 'Object ref'),
      createElement(
        Panel,
        {
          ref: (node) => {
            callbackRef = node;
          },
        },
        'Callback ref',
      ),
    ),
    (window) => {
      assert.ok(objectRef.current instanceof window.HTMLDivElement);
      assert.ok(callbackRef instanceof window.HTMLDivElement);
    },
  );
});

test('Input public ref receives the input element while wrapper remains the themed guard target', async () => {
  const inputRef = createRef<HTMLInputElement>();

  await withMountedElement(
    createElement(
      ArtifactThemeRoot,
      { className: 'runtime-theme-root' },
      createElement(Input, { ref: inputRef, label: 'Email', className: 'runtime-input-wrapper' }),
    ),
    (window) => {
      assert.ok(inputRef.current instanceof window.HTMLInputElement);
      assert.equal(inputRef.current.tagName, 'INPUT');
      assert.ok(inputRef.current.closest('.runtime-input-wrapper') instanceof window.HTMLDivElement);
      assert.ok(inputRef.current.closest('.artifact-theme') instanceof window.HTMLDivElement);
    },
  );
});

test('ArtifactThemeRoot ref receives the themed div element', async () => {
  const rootRef = createRef<HTMLDivElement>();

  await withMountedElement(createElement(ArtifactThemeRoot, { ref: rootRef }, 'Theme root'), (window) => {
    assert.ok(rootRef.current instanceof window.HTMLDivElement);
    assert.match(rootRef.current.className, /(?:^|\s)artifact-theme(?:\s|$)/);
  });
});

test('shared CopyButton imperative ref receives a non-DOM copy handle', async () => {
  const copyRef = createRef<SharedCopyButtonHandle>();

  await withMountedElement(
    createElement(ArtifactThemeRoot, null, createElement(SharedCopyButton, { ref: copyRef, text: 'value' })),
    (window) => {
      assert.equal(typeof copyRef.current?.copy, 'function');
      assert.ok(!(copyRef.current instanceof window.HTMLButtonElement));
    },
  );
});
