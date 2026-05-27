import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Window } from 'happy-dom';
import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { prompts, renderPromptText } from '../../src/artifacts/prompt-library/prompts';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

async function renderPromptLibrary() {
  const { default: PromptLibrary } = await import('../../src/artifacts/prompt-library');

  return renderToStaticMarkup(createElement(PromptLibrary));
}

async function renderProposalPromptDetailContent() {
  const { PromptDetailContent } = await import('../../src/artifacts/prompt-library');
  const prompt = prompts.find((entry) => entry.id === 'proposal-review-subagent');

  assert.ok(prompt);
  assert.ok(prompt.modifier);

  return renderToStaticMarkup(
    createElement(PromptDetailContent, {
      prompt,
      renderedPrompt: renderPromptText(prompt),
      selectedModifierOptionId: prompt.modifier.defaultOptionId,
      onModifierOptionChange: () => undefined,
    }),
  );
}

function parseMarkup(markup: string) {
  const window = new Window();
  window.document.body.innerHTML = markup;

  return window.document;
}

test('prompt card title button advertises that it opens the full prompt', async () => {
  const markup = await renderPromptLibrary();
  const firstTitle = prompts[0]?.title;

  assert.ok(firstTitle);

  const titleStart = markup.indexOf(`>${firstTitle}</button>`);
  assert.notEqual(titleStart, -1);

  const buttonStart = markup.lastIndexOf('<button', titleStart);
  assert.notEqual(buttonStart, -1);

  const titleButton = markup.slice(buttonStart, titleStart);

  assert.match(titleButton, /cursor-pointer/);
  assert.match(titleButton, /active:/);
});

test('primary search button uses a pointer cursor', async () => {
  const markup = await renderPromptLibrary();
  const searchLabelStart = markup.indexOf('aria-label="Search');
  assert.notEqual(searchLabelStart, -1);

  const buttonStart = markup.lastIndexOf('<button', searchLabelStart);
  assert.notEqual(buttonStart, -1);

  const buttonEnd = markup.indexOf('</button>', searchLabelStart);
  assert.notEqual(buttonEnd, -1);

  const searchButton = markup.slice(buttonStart, buttonEnd);

  assert.match(searchButton, /cursor-pointer/);
});

test('prompt detail modifier controls stay in the prompt section header', async () => {
  const document = parseMarkup(await renderProposalPromptDetailContent());
  const promptSection = document.querySelector('[data-prompt-detail-section="prompt"]');

  assert.ok(promptSection);

  const promptHeader = promptSection.querySelector('[data-prompt-detail-section-header]');
  const promptBody = promptSection.querySelector('[data-prompt-detail-section-body]');
  const promptHeading = [...promptSection.querySelectorAll('h3')].find((element) => element.textContent === 'Prompt');
  const sourceTypeControl = promptSection.querySelector('fieldset[aria-label="Source type"]');
  const sourceTypeLabel = [...(promptHeader?.querySelectorAll('span') ?? [])].find(
    (element) => element.textContent === 'Source type',
  );
  const promptPre = promptSection.querySelector('pre');

  assert.ok(promptHeader);
  assert.ok(promptBody);
  assert.ok(promptHeading);
  assert.ok(sourceTypeControl);
  assert.ok(sourceTypeLabel);
  assert.ok(promptPre);

  assert.equal(promptSection.getAttribute('aria-labelledby'), promptHeading.id);
  assert.ok(promptHeader.contains(promptHeading));
  assert.ok(promptHeader.contains(sourceTypeControl));
  assert.equal(promptBody.contains(sourceTypeControl), false);
  assert.equal(promptHeader.nextElementSibling, promptBody);
  assert.equal(promptBody.firstElementChild, promptPre);
});
