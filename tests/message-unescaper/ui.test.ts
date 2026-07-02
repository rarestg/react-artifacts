import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

async function renderMessageUnescaper() {
  const { default: MessageUnescaper } = await import('../../src/artifacts/message-unescaper');
  return renderToStaticMarkup(createElement(MessageUnescaper));
}

async function readMessageUnescaperSource() {
  return readFile(new URL('../../src/artifacts/message-unescaper/index.tsx', import.meta.url), 'utf8');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toggleMarkupByLabel(markup: string, label: string) {
  const labelPattern = new RegExp(`>\\s*${escapeRegExp(label)}\\s*</span>`);
  const toggleMarkup = [...markup.matchAll(/<label\b[\s\S]*?<\/label>/g)]
    .map((match) => match[0])
    .find((labelMarkup) => labelPattern.test(labelMarkup));
  assert.ok(toggleMarkup, `Expected toggle markup for ${label}: ${markup}`);
  return toggleMarkup;
}

function assertToggleDisabledReason(markup: string, label: string, reason: string) {
  const toggleMarkup = toggleMarkupByLabel(markup, label);
  // Base UI Checkbox.Root carries aria-describedby on the exposed role=checkbox span (the hidden
  // native input is aria-hidden), so read the association from there.
  const checkboxTag = toggleMarkup.match(/<span\b[^>]*role="checkbox"[^>]*>/)?.[0];
  assert.ok(checkboxTag, `Expected toggle checkbox markup for ${label}: ${toggleMarkup}`);

  const describedBy = checkboxTag.match(/\baria-describedby="([^"]+)"/)?.[1];
  assert.ok(describedBy, `Expected aria-describedby on ${label} checkbox: ${checkboxTag}`);

  const reasonPattern = new RegExp(`>\\s*${escapeRegExp(reason)}\\s*</span>`);
  const reasonSpan = [...markup.matchAll(/<span\b[^>]*>[\s\S]*?<\/span>/g)]
    .map((match) => match[0])
    .find((spanMarkup) => spanMarkup.includes(`id="${describedBy}"`) && reasonPattern.test(spanMarkup));
  assert.ok(reasonSpan, `Expected sr-only disabled reason for ${label}: ${markup}`);

  const reasonClass = reasonSpan.match(/\bclass="([^"]+)"/)?.[1];
  assert.ok(reasonClass, `Expected disabled reason class for ${label}: ${reasonSpan}`);
  assert.match(reasonClass, /(?:^|\s)sr-only(?:\s|$)/);
}

test('Message Unescaper output toggles keep stable names and describe disabled reasons separately', async () => {
  const markup = await renderMessageUnescaper();

  assert.match(markup, />Show dash breaks</);
  assert.match(markup, />Replace with periods</);
  assert.match(markup, /title="Enter text to detect dash breaks"/);
  assert.match(markup, /title="Enter text to enable dash replacement"/);
  assertToggleDisabledReason(markup, 'Show dash breaks', 'Enter text to detect dash breaks');
  assertToggleDisabledReason(markup, 'Replace with periods', 'Enter text to enable dash replacement');
  assert.doesNotMatch(markup, /aria-label="Enter text to detect dash breaks"/);
  assert.doesNotMatch(markup, /aria-label="Enter text to enable dash replacement"/);
});

test('Message Unescaper exposes container-aware panel layout controls', async () => {
  const markup = await renderMessageUnescaper();
  const source = await readMessageUnescaperSource();

  assert.match(markup, /aria-label="Word wrap"/);
  assert.doesNotMatch(markup, /aria-label="Panel layout"/);
  assert.match(source, /ariaLabel=["']Panel layout["']/);
  assert.match(source, /ariaLabel:\s*["']One column layout["']/);
  assert.match(source, /ariaLabel:\s*["']Two column layout["']/);
  assert.match(source, /const \{ ref: mainRef, width: mainContentWidth \} = useContainerWidth<HTMLElement>\(\)/);
  assert.match(source, /mainContentWidth\s*!==\s*null\s*&&\s*mainContentWidth\s*>=\s*MESSAGE_TWO_COLUMN_MIN_WIDTH/);
  assert.match(source, /MESSAGE_TWO_COLUMN_MIN_WIDTH\s*=\s*MESSAGE_PANEL_MIN_WIDTH\s*\*\s*2\s*\+\s*MESSAGE_PANEL_GAP/);
  assert.match(source, /grid-cols-\[minmax\(0,1fr\)_minmax\(0,1fr\)\]/);
  assert.doesNotMatch(markup, /grid-cols-\[minmax\(0,1fr\)_minmax\(0,1fr\)\]/);
  assert.doesNotMatch(source, /Two column layout unavailable/);
  assert.doesNotMatch(source, /disabled: !canUseTwoColumnLayout/);
  assert.doesNotMatch(source, /lg:grid-cols-2/);
});
