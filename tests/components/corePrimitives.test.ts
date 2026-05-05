import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Panel } from '../../src/components/Panel';
import { Tag } from '../../src/components/Tag';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function firstElementClass(markup: string) {
  const className = markup.match(/^<[^>]+class="([^"]+)"/)?.[1];
  assert.ok(className, `Expected first element to have class markup: ${markup}`);
  return className;
}

test('Button defaults to type button and exposes sharp states', () => {
  const markup = renderToStaticMarkup(createElement(Button, { variant: 'primary' }, 'Save'));

  assert.match(markup, /type="button"/);
  assert.match(markup, /border-\[var\(--primary\)\]/);
  assert.match(markup, /focus-visible:ring-2/);
  assert.match(markup, /active:bg-\[var\(--primary-active\)\]/);
});

test('Button supports disabled cursor without pointer-events-none', () => {
  const markup = renderToStaticMarkup(createElement(Button, { disabled: true }, 'Disabled'));
  const rootClass = firstElementClass(markup);

  assert.match(rootClass, /cursor-not-allowed/);
  assert.doesNotMatch(rootClass, /pointer-events-none|cursor-pointer|hover:bg|active:bg/);
});

test('Input wires generated label and error description', () => {
  const markup = renderToStaticMarkup(
    createElement(Input, {
      label: 'Email',
      error: 'Invalid email address',
      placeholder: 'email@example.com',
    }),
  );

  const labelFor = markup.match(/<label[^>]*for="([^"]+)"/)?.[1];
  const inputId = markup.match(/<input[^>]*id="([^"]+)"/)?.[1];

  assert.ok(labelFor);
  assert.equal(inputId, labelFor);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /aria-describedby="[^"]*error/);
  assert.match(markup, /Invalid email address/);
});

test('Input error state overrides caller-provided aria-invalid false', () => {
  const markup = renderToStaticMarkup(
    createElement(Input, {
      label: 'Email',
      error: 'Invalid email address',
      'aria-invalid': false,
    }),
  );

  assert.match(markup, /aria-invalid="true"/);
  assert.doesNotMatch(markup, /aria-invalid="false"/);
});

test('Input preserves custom id and helper text description', () => {
  const markup = renderToStaticMarkup(
    createElement(Input, {
      id: 'workspace-name',
      label: 'Workspace',
      helperText: 'Use a short readable name.',
    }),
  );

  assert.match(markup, /for="workspace-name"/);
  assert.match(markup, /id="workspace-name"/);
  assert.match(markup, /aria-describedby="workspace-name-helper"/);
  assert.match(markup, /Use a short readable name\./);
});

test('Input supports compact accessible names without relying on placeholder text', () => {
  const markup = renderToStaticMarkup(
    createElement(Input, {
      'aria-label': 'Filter projects',
      placeholder: 'Search',
    }),
  );

  assert.match(markup, /aria-label="Filter projects"/);
  assert.doesNotMatch(markup, /<label/);
});

test('Tag renders non-interactive metadata span variants', () => {
  const base = renderToStaticMarkup(createElement(Tag, { variant: 'base', title: 'Branch' }, 'main'));
  const muted = renderToStaticMarkup(createElement(Tag, { variant: 'muted' }, 'v2.4.1'));
  const solid = renderToStaticMarkup(createElement(Tag, { variant: 'solid' }, 'Active'));

  assert.match(base, /^<span/);
  assert.match(base, /title="Branch"/);
  assert.match(base, /border-\[var\(--border\)\]/);
  assert.match(muted, /bg-\[var\(--surface-strong\)\]/);
  assert.match(solid, /bg-\[var\(--primary\)\]/);
  assert.doesNotMatch(`${base}${muted}${solid}`, /cursor-pointer|focus-visible/);
});

test('Panel renders structural surfaces without padding radius or shadow', () => {
  const markup = renderToStaticMarkup(createElement(Panel, { variant: 'dashed', 'data-testid': 'panel' }, 'Empty'));

  assert.match(markup, /^<div/);
  assert.match(markup, /data-testid="panel"/);
  assert.match(markup, /border-dashed/);
  assert.doesNotMatch(markup, /rounded|shadow|p-[0-9]|cursor-pointer|hover:bg|active:bg/);
});
