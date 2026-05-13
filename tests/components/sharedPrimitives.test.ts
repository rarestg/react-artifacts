import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Checkbox } from '../../src/components/Checkbox';
import { CopyableLabel } from '../../src/components/CopyableLabel';
import { CopyButton } from '../../src/components/CopyButton';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { StatusTag } from '../../src/components/StatusTag';
import { Toggle } from '../../src/components/Toggle';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function firstElementClass(markup: string) {
  const className = markup.match(/^<[^>]+class="([^"]+)"/)?.[1];
  assert.ok(className, `Expected first element to have class markup: ${markup}`);
  return className;
}

function buttonClasses(markup: string) {
  return [...markup.matchAll(/<button[^>]*class="([^"]+)"/g)].map((match) => match[1]);
}

function buttonClassByPressed(markup: string, pressed: boolean) {
  const buttonTag = [...markup.matchAll(/<button\b[^>]*>/g)]
    .map((match) => match[0])
    .find((tag) => tag.includes(`aria-pressed="${pressed}"`));
  assert.ok(buttonTag, `Expected ${pressed ? 'pressed' : 'unpressed'} button markup: ${markup}`);
  const className = buttonTag.match(/\bclass="([^"]+)"/)?.[1];
  assert.ok(className, `Expected ${pressed ? 'pressed' : 'unpressed'} button class markup: ${markup}`);
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

  const inputTag = markup.match(/<input\b[^>]*>/)?.[0];
  assert.ok(inputTag, `Expected toggle input markup: ${markup}`);

  assert.match(markup, /title="Details are unavailable"/);
  assert.match(inputTag, /aria-describedby="details-description"/);
  assert.match(markup, />Show details</);
});

test('SegmentedControl renders pressed buttons with child-owned borders', () => {
  const markup = renderToStaticMarkup(
    createElement(SegmentedControl, {
      ariaLabel: 'Direction',
      value: 'escape',
      onValueChange: () => undefined,
      tone: 'accent',
      size: 'compact',
      options: [
        { value: 'unescape', label: 'Unescape' },
        { value: 'escape', label: 'Escape' },
      ],
    }),
  );
  const rootClass = firstElementClass(markup);
  const classes = buttonClasses(markup);
  const selectedClass = buttonClassByPressed(markup, true);

  assert.match(markup, /^<fieldset/);
  assert.match(markup, /aria-label="Direction"/);
  assert.doesNotMatch(rootClass, /gap-px/);
  assert.equal(classes.length, 2);
  assert.match(classes[0], /border/);
  assert.match(classes[1], /-ml-px/);
  assert.match(selectedClass, /z-10/);
  assert.match(selectedClass, /text-xs/);
  assert.match(selectedClass, /font-medium/);
  assert.doesNotMatch(selectedClass, /font-mono|uppercase|tracking-\[/);
  assert.match(selectedClass, /border-\[color:var\(--accent\)\]/);
  assert.match(selectedClass, /bg-\[var\(--accent-weak\)\]/);
  assert.match(selectedClass, /text-\[var\(--accent-text\)\]/);
  assert.match(markup, /aria-pressed="false"/);
  assert.match(markup, /aria-pressed="true"/);
});

test('SegmentedControl keeps option labels and pressed states on each button', () => {
  const markup = renderToStaticMarkup(
    createElement(SegmentedControl, {
      ariaLabel: 'Layout',
      value: 'one-column',
      onValueChange: () => undefined,
      options: [
        { value: 'one-column', label: '1', ariaLabel: 'One column layout' },
        { value: 'two-column', label: '2', ariaLabel: 'Two column layout' },
      ],
    }),
  );
  const buttonTags = [...markup.matchAll(/<button\b[^>]*>/g)].map((match) => match[0]);

  assert.equal(buttonTags.length, 2);
  assert.match(buttonTags[0], /aria-label="One column layout"/);
  assert.match(buttonTags[0], /aria-pressed="true"/);
  assert.match(buttonTags[1], /aria-label="Two column layout"/);
  assert.match(buttonTags[1], /aria-pressed="false"/);
});

test('SegmentedControl supports full-width neutral mode controls', () => {
  const markup = renderToStaticMarkup(
    createElement(SegmentedControl, {
      ariaLabel: 'Labels',
      value: 'hue',
      onValueChange: () => undefined,
      tone: 'neutral',
      fullWidth: true,
      options: [
        { value: 'hue', label: 'Color name' },
        { value: 'index', label: 'Index' },
      ],
    }),
  );
  const rootClass = firstElementClass(markup);
  const selectedClass = buttonClassByPressed(markup, true);

  assert.match(rootClass, /flex/);
  assert.match(rootClass, /w-full/);
  assert.match(markup, /flex-1/);
  assert.match(selectedClass, /border-\[var\(--border-strong\)\]/);
  assert.match(selectedClass, /bg-\[var\(--surface-strong\)\]/);
  assert.match(markup, />Color name<\/span>/);
  assert.match(markup, />Index<\/span>/);
});

test('disabled SegmentedControl preserves disabled cursor without interactive affordances', () => {
  const markup = renderToStaticMarkup(
    createElement(SegmentedControl, {
      ariaLabel: 'Disabled mode',
      value: 'one',
      onValueChange: () => undefined,
      disabled: true,
      options: [
        { value: 'one', label: 'One' },
        { value: 'two', label: 'Two' },
      ],
    }),
  );
  const rootClass = firstElementClass(markup);

  assert.match(rootClass, /opacity-50/);
  for (const className of buttonClasses(markup)) {
    assert.match(className, /cursor-not-allowed/);
    assert.doesNotMatch(className, /cursor-pointer|hover:bg|active:bg/);
  }
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
  const rootClass = firstElementClass(markup);

  assert.match(markup, /aria-label="Copy: ~\/projects\/app"/);
  assert.match(rootClass, /(?:^|\s)group(?:\s|$)/);
  assert.match(markup, /group-hover:opacity-0/);
  assert.match(markup, /group-focus-visible:opacity-0/);
  assert.match(markup, /active:bg-\[var\(--copy-hover-bg\)\]/);
});

test('copyable label can suppress focus-visible copy label without disabling hover affordance', () => {
  const markup = renderToStaticMarkup(
    createElement(CopyableLabel, { value: '~/projects/app', showHoverOnFocus: false }),
  );

  assert.match(markup, /group-hover:opacity-0/);
  assert.doesNotMatch(markup, /group-focus-visible:opacity/);
});

test('StatusTag supports named export markup', async () => {
  const module = await import('../../src/components/StatusTag');

  assert.equal('default' in module, false);
  assert.equal(module.StatusTag, StatusTag);

  const markup = renderToStaticMarkup(createElement(StatusTag, { label: 'Connected', active: true }));
  assert.match(markup, /Connected/);
});
