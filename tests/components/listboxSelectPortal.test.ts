import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Window } from 'happy-dom';
import * as React from 'react';
import { act, createElement } from 'react';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

// Base UI Select + floating-ui reference these as bare globals during a client render.
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

test('ListboxSelect portals its popup inside the .artifact-theme boundary, not document.body', async () => {
  const previousGlobals = new Map<string, PropertyDescriptor | undefined>();
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  const window = new Window({ url: 'https://react-artifacts.test/' });
  const source = window as unknown as Record<string, unknown>;

  for (const key of globalKeys) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: source[key], writable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  // Import Base UI (and react-dom/client) only after the DOM globals exist, so their
  // module-load environment detection resolves to a browser and portals mount into the DOM.
  const { createRoot } = await import('react-dom/client');
  const { ArtifactThemeRoot } = await import('../../src/components/ArtifactThemeRoot');
  const { ListboxSelect } = await import('../../src/components/ListboxSelect');

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(
        createElement(
          ArtifactThemeRoot,
          { className: 'portal-theme-root' },
          createElement(ListboxSelect, {
            ariaLabel: 'Theme',
            value: 'light',
            onChange: () => undefined,
            options: [
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ],
          }),
        ),
      );
    });

    const trigger = window.document.querySelector<HTMLButtonElement>('[role="combobox"], button');
    assert.ok(trigger, 'trigger button should render');

    await act(async () => {
      trigger.click();
    });

    const themeRoot = window.document.querySelector('.artifact-theme');
    const listbox = window.document.querySelector('[role="listbox"]');

    assert.ok(themeRoot, 'theme root should render');
    assert.ok(listbox, 'select popup (role=listbox) should render while open');
    // If the popup escaped to document.body (Base UI's default portal target), contains() is false.
    assert.ok(themeRoot.contains(listbox), 'popup must mount inside the artifact theme boundary');
    assert.ok(listbox.closest('.artifact-theme'), 'popup must resolve scoped tokens via a .artifact-theme ancestor');
    assert.equal(listbox.getAttribute('aria-label'), 'Theme', 'popup listbox should carry the ariaLabel');
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
