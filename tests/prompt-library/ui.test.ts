import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Window } from 'happy-dom';
import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { prompts, renderPromptText } from '../../src/artifacts/prompt-library/prompts';
import { getMatchedPromptSearchVariant, searchPrompts } from '../../src/artifacts/prompt-library/search';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

async function renderPromptLibrary() {
  const { default: PromptLibrary } = await import('../../src/artifacts/prompt-library');

  return renderToStaticMarkup(createElement(PromptLibrary));
}

async function renderProposalPromptDetailContent(selectedModifierOptionId?: string) {
  const { PromptDetailContent } = await import('../../src/artifacts/prompt-library');
  const prompt = prompts.find((entry) => entry.id === 'proposal-review-subagent');

  assert.ok(prompt);
  assert.ok(prompt.modifier);

  return renderToStaticMarkup(
    createElement(PromptDetailContent, {
      prompt,
      renderedPrompt: renderPromptText(prompt, selectedModifierOptionId),
      selectedModifierOptionId: selectedModifierOptionId ?? prompt.modifier.defaultOptionId,
      onModifierOptionChange: () => undefined,
    }),
  );
}

async function renderParallelDraftPromptDetailContent(numberInputValue = 5) {
  const { PromptDetailContent } = await import('../../src/artifacts/prompt-library');
  const prompt = prompts.find((entry) => entry.id === 'parallel-draft-synthesis');

  assert.ok(prompt);
  assert.ok(prompt.numberInput);

  return renderToStaticMarkup(
    createElement(PromptDetailContent, {
      prompt,
      renderedPrompt: renderPromptText(prompt, undefined, { numberInputValue }),
      onModifierOptionChange: () => undefined,
      selectedNumberInputValue: numberInputValue,
      onNumberInputChange: () => undefined,
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

test('prompt detail number controls stay in the prompt section header', async () => {
  const document = parseMarkup(await renderParallelDraftPromptDetailContent(7));
  const promptSection = document.querySelector('[data-prompt-detail-section="prompt"]');

  assert.ok(promptSection);

  const promptHeader = promptSection.querySelector('[data-prompt-detail-section-header]');
  const promptBody = promptSection.querySelector('[data-prompt-detail-section-body]');
  const optionsInput = promptSection.querySelector('input[type="number"]');
  const decreaseButton = promptSection.querySelector('button[aria-label="Decrease Options"]');
  const increaseButton = promptSection.querySelector('button[aria-label="Increase Options"]');
  const optionsLabel = [...(promptHeader?.querySelectorAll('label') ?? [])].find(
    (element) => element.textContent === 'Options',
  );
  const promptPre = promptSection.querySelector('pre');

  assert.ok(promptHeader);
  assert.ok(promptBody);
  assert.ok(optionsInput);
  assert.ok(decreaseButton);
  assert.ok(increaseButton);
  assert.ok(optionsLabel);
  assert.ok(promptPre);

  assert.equal(optionsInput.getAttribute('value'), '7');
  assert.equal(optionsInput.getAttribute('min'), '2');
  assert.equal(optionsInput.getAttribute('max'), '10');
  assert.equal(promptHeader.contains(optionsInput), true);
  assert.equal(promptBody.contains(optionsInput), false);
  assert.equal(optionsLabel.parentElement?.contains(optionsInput), true);
  assert.equal(optionsLabel.parentElement?.contains(decreaseButton), true);
  assert.equal(optionsLabel.parentElement?.contains(increaseButton), true);
  assert.match(promptPre.textContent ?? '', /Please orchestrate 7 independent drafts/);
  assert.match(promptPre.textContent ?? '', /Dispatch 7 fresh subagents in parallel/);
});

test('prompt detail content can render a search-matched non-default modifier variant', async () => {
  const query = 'proposed paths';
  const [result] = searchPrompts(prompts, query);

  assert.ok(result);

  const variant = getMatchedPromptSearchVariant(result, query);

  assert.ok(variant);
  assert.equal(variant?.optionId, 'multiple-proposals');

  const document = parseMarkup(await renderProposalPromptDetailContent(variant.optionId));
  const promptPre = document.querySelector('[data-prompt-detail-section="prompt"] pre');

  assert.ok(promptPre);
  assert.match(promptPre.textContent ?? '', /proposed paths/i);
  assert.doesNotMatch(promptPre.textContent ?? '', /this is the best path/i);
});
