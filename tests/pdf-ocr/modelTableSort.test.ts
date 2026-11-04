import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Window } from 'happy-dom';
import * as React from 'react';
import { act, createElement } from 'react';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

test('sorting keeps the header button and its keyboard focus', async () => {
  const window = new Window({ url: 'http://localhost/' });
  const g = globalThis as Record<string, unknown>;
  for (const key of [
    'window',
    'document',
    'HTMLElement',
    'Element',
    'Node',
    'MutationObserver',
    'getComputedStyle',
    'CustomEvent',
    'Event',
    'HTMLButtonElement',
    'HTMLDivElement',
    'HTMLInputElement',
    'MouseEvent',
    'KeyboardEvent',
    'PointerEvent',
    'navigator',
    'requestAnimationFrame',
    'cancelAnimationFrame',
  ]) {
    Object.defineProperty(g, key, {
      value: key === 'window' ? window : (window as unknown as Record<string, unknown>)[key],
      configurable: true,
      writable: true,
    });
  }
  g.IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = await import('react-dom/client');
  const { ArtifactThemeRoot } = await import('../../src/components/ArtifactThemeRoot');
  const { ModelTable } = await import('../../src/artifacts/pdf-ocr/components/ModelTable');
  const vm = {
    models: [{ name: 'gemini-a' }, { name: 'gemini-b' }],
    selectedCount: 3,
    mediaResolution: 'default',
    model: 'gemini-a',
    setModel() {},
  };
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const root = createRoot(container as unknown as Element);
  await act(async () => {
    root.render(createElement(ArtifactThemeRoot, null, createElement(ModelTable, { vm } as never)));
  });
  const header = () =>
    [...window.document.querySelectorAll('th button')].find((b) =>
      b.textContent?.includes('Model'),
    ) as unknown as HTMLButtonElement;
  const before = header();
  assert.ok(before);
  before.focus();
  await act(async () => {
    before.click();
  });
  assert.ok(header() === before, 'the header button stays the same element');
  assert.ok((window.document.activeElement as unknown) === before, 'focus stays on the header button');
  await act(async () => root.unmount());
});
