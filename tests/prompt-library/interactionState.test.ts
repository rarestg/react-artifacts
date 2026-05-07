import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  initialPromptLibraryInteractionState,
  type PromptLibraryInteractionState,
  promptLibraryInteractionReducer,
} from '../../src/artifacts/prompt-library/interactionState';
import { prompts } from '../../src/artifacts/prompt-library/prompts';
import type { PromptSearchResult } from '../../src/artifacts/prompt-library/search';

const [firstPrompt, secondPrompt] = prompts;

if (!firstPrompt || !secondPrompt) {
  throw new Error('Prompt library reducer tests require at least two prompt fixtures.');
}

const firstSearchResult: PromptSearchResult = {
  prompt: firstPrompt,
  matches: [],
  refIndex: 0,
};

const secondSearchResult: PromptSearchResult = {
  prompt: secondPrompt,
  matches: [],
  refIndex: 1,
};

function populatedState(overrides: Partial<PromptLibraryInteractionState> = {}): PromptLibraryInteractionState {
  return {
    searchOpen: true,
    activePrompt: firstPrompt,
    activeSearchResult: firstSearchResult,
    activeSearchQuery: 'implementation',
    ...overrides,
  };
}

test('direct prompt open sets prompt and clears search provenance without changing palette state', () => {
  const state = populatedState({ searchOpen: true });
  const nextState = promptLibraryInteractionReducer(state, { type: 'open-prompt-detail', prompt: secondPrompt });

  assert.equal(nextState.searchOpen, true);
  assert.equal(nextState.activePrompt, secondPrompt);
  assert.equal(nextState.activeSearchResult, null);
  assert.equal(nextState.activeSearchQuery, '');
});

test('closing prompt detail clears prompt and search provenance without changing palette state', () => {
  const state = populatedState({ searchOpen: false });
  const nextState = promptLibraryInteractionReducer(state, { type: 'close-prompt-detail' });

  assert.equal(nextState.searchOpen, false);
  assert.equal(nextState.activePrompt, null);
  assert.equal(nextState.activeSearchResult, null);
  assert.equal(nextState.activeSearchQuery, '');
});

test('search palette actions only change palette open state', () => {
  const state = populatedState({ searchOpen: false });
  const openedState = promptLibraryInteractionReducer(state, { type: 'set-search-open', open: true });
  const toggledState = promptLibraryInteractionReducer(openedState, { type: 'toggle-search-open' });

  assert.equal(openedState.searchOpen, true);
  assert.equal(openedState.activePrompt, state.activePrompt);
  assert.equal(openedState.activeSearchResult, state.activeSearchResult);
  assert.equal(openedState.activeSearchQuery, state.activeSearchQuery);

  assert.equal(toggledState.searchOpen, false);
  assert.equal(toggledState.activePrompt, state.activePrompt);
  assert.equal(toggledState.activeSearchResult, state.activeSearchResult);
  assert.equal(toggledState.activeSearchQuery, state.activeSearchQuery);
});

test('selecting a search result stores provenance, opens its prompt, and closes the palette', () => {
  const nextState = promptLibraryInteractionReducer(initialPromptLibraryInteractionState, {
    type: 'select-search-result',
    result: secondSearchResult,
    query: 'review architecture',
  });

  assert.equal(nextState.searchOpen, false);
  assert.equal(nextState.activePrompt, secondPrompt);
  assert.equal(nextState.activeSearchResult, secondSearchResult);
  assert.equal(nextState.activeSearchQuery, 'review architecture');
});
