import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Window } from 'happy-dom';
import * as React from 'react';
import { act, createElement, type ReactElement } from 'react';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

// Base UI overlays (Autocomplete / Popover) + floating-ui reference these as bare globals during a
// client render, so they must exist before the component modules load.
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
  'NodeFilter',
  'PointerEvent',
  'ResizeObserver',
  'cancelAnimationFrame',
  'document',
  'getComputedStyle',
  'navigator',
  'requestAnimationFrame',
  'window',
] as const;

// Renders `buildChild()` inside <ArtifactThemeRoot> against a fresh happy-dom window. `buildChild`
// runs after the DOM globals exist so Base UI (and the component modules) load in browser mode and
// portal into the DOM instead of no-op'ing during SSR detection.
async function renderInThemeRoot(
  buildChild: () => Promise<ReactElement>,
  runAssertions: (win: InstanceType<typeof Window>) => Promise<void>,
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

  const { createRoot } = await import('react-dom/client');
  const { ArtifactThemeRoot } = await import('../../src/components/ArtifactThemeRoot');

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);

  try {
    const child = await buildChild();
    await act(async () => {
      root.render(createElement(ArtifactThemeRoot, { className: 'portal-theme-root' }, child));
    });
    await runAssertions(window);
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

test('SearchInput portals its Autocomplete popup inside the boundary and selects the highlighted row', async () => {
  const results = [
    { id: 'alpha', title: 'Alpha project' },
    { id: 'beta', title: 'Beta project' },
  ];
  let selected: { id?: string; title: string } | null = null;

  await renderInThemeRoot(
    async () => {
      const { SearchInput } = await import('../../src/artifacts/sharp2/components/SearchInput');
      return createElement(SearchInput, {
        ariaLabel: 'Search conversations',
        showResults: true,
        value: '',
        results,
        onValueChange: () => {},
        onSelect: (result) => {
          selected = result;
        },
      });
    },
    async (window) => {
      const themeRoot = window.document.querySelector('.artifact-theme');
      const options = window.document.querySelectorAll('[role="option"]');
      const input = window.document.querySelector<HTMLInputElement>('[role="combobox"]');

      assert.ok(themeRoot, 'theme root should render');
      assert.ok(input, 'combobox input should render');
      assert.equal(input.getAttribute('aria-label'), 'Search conversations', 'input carries the ariaLabel');
      assert.equal(options.length, 2, 'both pre-filtered results should render as options');
      for (const option of options) {
        // If the popup escaped to document.body it would not be inside the theme boundary.
        assert.ok(themeRoot.contains(option), 'options must mount inside the artifact theme boundary');
      }

      // autoHighlight="always" keeps the first row active; Enter presses the highlighted row.
      await act(async () => {
        input.focus();
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      });

      assert.ok(selected, 'pressing Enter should select the highlighted result');
      assert.equal(selected?.id, 'alpha', 'Enter should select the first (highlighted) result');
    },
  );
});

test('SearchInput renders the empty state inside the boundary when there are no results', async () => {
  await renderInThemeRoot(
    async () => {
      const { SearchInput } = await import('../../src/artifacts/sharp2/components/SearchInput');
      return createElement(SearchInput, {
        ariaLabel: 'Search conversations',
        showResults: true,
        value: 'zzz',
        results: [],
        onValueChange: () => {},
        onSelect: () => {},
      });
    },
    async (window) => {
      const themeRoot = window.document.querySelector('.artifact-theme');
      assert.ok(themeRoot, 'theme root should render');
      assert.equal(window.document.querySelectorAll('[role="option"]').length, 0, 'no options when empty');
      assert.match(themeRoot.textContent ?? '', /No results for "zzz"\./, 'empty state message renders in-boundary');
    },
  );
});

test('Popover portals its popup inside the boundary as a labelled dialog with action buttons', async () => {
  await renderInThemeRoot(
    async () => {
      const { Popover, popoverActionClass } = await import('../../src/artifacts/sharp2/components/Popover');
      return createElement(
        Popover,
        {
          open: true,
          onOpenChange: () => {},
          ariaLabel: 'Popover actions',
          trigger: createElement('button', { type: 'button' }, 'Open Popover'),
        },
        createElement(
          'div',
          { className: 'p-2 space-y-1' },
          createElement('button', { type: 'button', className: popoverActionClass }, 'Edit'),
          createElement('button', { type: 'button', className: popoverActionClass }, 'Delete'),
        ),
      );
    },
    async (window) => {
      const themeRoot = window.document.querySelector('.artifact-theme');
      const popup = window.document.querySelector('[role="dialog"]');

      assert.ok(themeRoot, 'theme root should render');
      assert.ok(popup, 'popover popup (role=dialog) should render while open');
      assert.ok(themeRoot.contains(popup), 'popup must mount inside the artifact theme boundary');
      assert.equal(popup.getAttribute('aria-label'), 'Popover actions', 'popup dialog carries the ariaLabel');
      assert.equal(popup.querySelectorAll('button').length, 2, 'action buttons render inside the popup');
    },
  );
});
