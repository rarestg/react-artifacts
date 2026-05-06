import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Checkbox } from '../../src/components/Checkbox';
import { CopyableLabel } from '../../src/components/CopyableLabel';
import { CopyButton } from '../../src/components/CopyButton';
import StatusTag from '../../src/components/StatusTag';
import { Toggle } from '../../src/components/Toggle';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function firstElementClass(markup: string) {
  const className = markup.match(/^<[^>]+class="([^"]+)"/)?.[1];
  assert.ok(className, `Expected first element to have class markup: ${markup}`);
  return className;
}

test('disabled shared checkbox and toggle preserve disabled cursor without pointer-events-none', () => {
  const checkbox = renderToStaticMarkup(
    createElement(Checkbox, {
      label: 'Disabled checkbox',
      checked: false,
      disabled: true,
      onCheckedChange: () => undefined,
    }),
  );
  const checkedCheckbox = renderToStaticMarkup(
    createElement(Checkbox, {
      label: 'Disabled checked checkbox',
      checked: true,
      disabled: true,
      onCheckedChange: () => undefined,
    }),
  );
  const toggle = renderToStaticMarkup(
    createElement(Toggle, {
      label: 'Disabled toggle',
      checked: false,
      disabled: true,
      onCheckedChange: () => undefined,
    }),
  );

  const checkboxRootClass = firstElementClass(checkbox);
  const toggleRootClass = firstElementClass(toggle);

  assert.match(checkboxRootClass, /cursor-not-allowed/);
  assert.doesNotMatch(checkboxRootClass, /pointer-events-none/);
  assert.doesNotMatch(checkboxRootClass, /cursor-pointer/);
  assert.doesNotMatch(checkbox, /hover:border|active:bg/);
  assert.doesNotMatch(checkedCheckbox, /active:bg/);
  assert.match(toggleRootClass, /cursor-not-allowed/);
  assert.doesNotMatch(toggleRootClass, /pointer-events-none/);
  assert.doesNotMatch(toggleRootClass, /cursor-pointer/);
  assert.doesNotMatch(toggle, /hover:border|active:bg/);
});

test('shared toggle and checkbox include active-state parity classes', () => {
  const checkbox = renderToStaticMarkup(
    createElement(Checkbox, {
      label: 'Checkbox',
      checked: false,
      onCheckedChange: () => undefined,
    }),
  );
  const toggleOff = renderToStaticMarkup(
    createElement(Toggle, {
      label: 'Toggle',
      checked: false,
      onCheckedChange: () => undefined,
    }),
  );
  const toggleOn = renderToStaticMarkup(
    createElement(Toggle, {
      label: 'Toggle',
      checked: true,
      onCheckedChange: () => undefined,
    }),
  );

  assert.match(checkbox, /active:bg-\[var\(--surface-pressed\)\]/);
  assert.match(toggleOff, /hover:border-\[color:var\(--border-strong\)\]/);
  assert.match(toggleOff, /active:bg-\[var\(--surface-pressed\)\]/);
  assert.match(toggleOn, /active:bg-\[var\(--primary-active\)\]/);
});

test('shared toggle passes through title and described-by metadata', () => {
  const markup = renderToStaticMarkup(
    createElement(Toggle, {
      label: 'Show details',
      checked: false,
      onCheckedChange: () => undefined,
      title: 'Details are unavailable',
      'aria-describedby': 'details-description',
    }),
  );

  assert.match(markup, /title="Details are unavailable"/);
  assert.match(markup, /aria-describedby="details-description"/);
  assert.match(markup, />Show details</);
});

test('disabled shared copy button preserves disabled cursor without pointer-events-none', () => {
  const markup = renderToStaticMarkup(createElement(CopyButton, { text: 'value', disabled: true }));
  const rootClass = firstElementClass(markup);

  assert.match(rootClass, /cursor-not-allowed/);
  assert.doesNotMatch(rootClass, /pointer-events-none/);
  assert.doesNotMatch(rootClass, /cursor-pointer/);
  assert.doesNotMatch(rootClass, /hover:bg|active:bg/);
});

test('copyable label keeps a stable accessible name for the copied value', () => {
  const markup = renderToStaticMarkup(createElement(CopyableLabel, { value: '~/projects/app' }));

  assert.match(markup, /aria-label="Copy: ~\/projects\/app"/);
  assert.match(markup, /active:bg-\[var\(--copy-hover-bg\)\]/);
});

test('StatusTag supports default and named imports', async () => {
  const module = await import('../../src/components/StatusTag');

  assert.equal(module.StatusTag, StatusTag);

  const markup = renderToStaticMarkup(createElement(module.StatusTag, { label: 'Connected', active: true }));
  assert.match(markup, /Connected/);
});
