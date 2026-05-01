import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type PromptEntry, prompts } from '../../src/artifacts/prompt-library/prompts';
import {
  filterPromptsByTags,
  getHighlightedSegments,
  makeSnippet,
  type PromptSearchResult,
  pickResultSnippet,
  searchPrompts,
} from '../../src/artifacts/prompt-library/search';

const searchFieldPrompts = [
  {
    id: 'field-title',
    title: 'Zephyrmark Intake',
    summary: 'Reusable handoff for planning work.',
    tags: ['review'],
    context: 'Use when scope needs another pass.',
    prompt: 'Ask the reviewer to compare options.',
  },
  {
    id: 'field-tags',
    title: 'Workflow Sorting',
    summary: 'Find the right checklist for a task.',
    tags: ['implementation'],
    context: 'Use when the next step depends on categorization.',
    prompt: 'Choose the most relevant workflow guidance.',
  },
  {
    id: 'field-context',
    title: 'Boundary Review',
    summary: 'Check assumptions before expanding scope.',
    tags: ['review'],
    context: 'Use when the cobaltroute constraint needs direct validation.',
    prompt: 'Ask for the smallest sufficient change.',
  },
  {
    id: 'field-prompt',
    title: 'Change Challenge',
    summary: 'Question whether a proposed change is necessary.',
    tags: ['review'],
    context: 'Use after a solution has been drafted.',
    prompt: 'Ask the reviewer to inspect the emberkey failure path.',
  },
] as const satisfies readonly PromptEntry[];

const snippetPrompts = [
  {
    id: 'snippet-summary',
    title: 'Snippet Preference Alpha',
    summary: 'Summary includes luminara marker.',
    tags: ['review'],
    context: 'Context also includes luminara marker.',
    prompt: 'Prompt also includes luminara marker.',
  },
  {
    id: 'snippet-context',
    title: 'Snippet Preference Beta',
    summary: 'Summary does not contain the fallback token.',
    tags: ['review'],
    context: 'Context includes matrixvale marker.',
    prompt: 'Prompt also includes matrixvale marker.',
  },
  {
    id: 'snippet-prompt',
    title: 'Snippet Preference Gamma',
    summary: 'Summary does not contain the final token.',
    tags: ['review'],
    context: 'Context does not contain the final token.',
    prompt: 'Prompt includes solsticegate marker.',
  },
] as const satisfies readonly PromptEntry[];

function assertSearchMatch(
  entries: readonly PromptEntry[],
  query: string,
  expectedId: string,
  expectedKey: string,
): PromptSearchResult {
  const [result] = searchPrompts(entries, query);

  assert.equal(result?.prompt.id, expectedId);
  assert.ok(
    result?.matches.some((match) => match.key === expectedKey && match.indices.length > 0),
    `Expected ${query} to produce highlighted match metadata for ${expectedKey}`,
  );

  return result;
}

test('filterPromptsByTags uses AND semantics', () => {
  const reviewSubagentPrompts = filterPromptsByTags(prompts, ['review', 'subagents']);
  assert.deepEqual(
    reviewSubagentPrompts.map((prompt) => prompt.id),
    ['risk-challenging-discovery', 'proposal-review-subagent'],
  );

  const riskArchitecturePrompts = filterPromptsByTags(prompts, ['risk', 'architecture']);
  assert.deepEqual(
    riskArchitecturePrompts.map((prompt) => prompt.id),
    [],
  );
});

test('searchPrompts ranks seeded residual-risk content', () => {
  const results = searchPrompts(prompts, 'residual risks');

  assert.equal(results[0]?.prompt.id, 'risk-challenging-discovery');
  assert.ok(
    results[0]?.matches.some((match) => match.key === 'summary' || match.key === 'context' || match.key === 'prompt'),
  );
});

test('searchPrompts matches title-only text with highlight metadata', () => {
  assertSearchMatch(searchFieldPrompts, 'zephyrmark', 'field-title', 'title');
});

test('searchPrompts matches tag-only text with highlight metadata', () => {
  assertSearchMatch(searchFieldPrompts, 'implementation', 'field-tags', 'tags');
});

test('searchPrompts matches context-only text with highlight metadata', () => {
  assertSearchMatch(searchFieldPrompts, 'cobaltroute', 'field-context', 'context');
});

test('searchPrompts matches prompt-only text with highlight metadata', () => {
  assertSearchMatch(searchFieldPrompts, 'emberkey', 'field-prompt', 'prompt');
});

test('searchPrompts returns an empty list when nothing matches', () => {
  const results = searchPrompts(prompts, 'zzzzzz-no-prompt');

  assert.deepEqual(results, []);
});

test('searchPrompts returns source order for an empty query', () => {
  const results = searchPrompts(prompts, '   ');

  assert.deepEqual(
    results.map((result) => result.prompt.id),
    ['risk-challenging-discovery', 'proposal-review-subagent'],
  );
  assert.deepEqual(results[0]?.matches, []);
});

test('searchPrompts clamps negative limits to an empty result set', () => {
  assert.deepEqual(searchPrompts(prompts, '   ', -1), []);
  assert.deepEqual(searchPrompts(prompts, 'residual risks', -1), []);
});

test('makeSnippet adjusts inclusive match ranges', () => {
  const snippet = makeSnippet('0123456789abcdefghij', [[10, 12]], 4);

  assert.equal(snippet.text, '6789abcdefg');
  assert.equal(snippet.leadingEllipsis, true);
  assert.equal(snippet.trailingEllipsis, true);
  assert.deepEqual(snippet.indices, [[4, 6]]);
});

test('makeSnippet keeps the first matched range visible when the match is longer than the radius', () => {
  const snippet = makeSnippet('0123456789ABCDEFGHIJklmnop', [[10, 19]], 2);

  assert.equal(snippet.text, '89ABCDEFGHIJkl');
  assert.deepEqual(snippet.indices, [[2, 11]]);
});

test('getHighlightedSegments merges overlapping inclusive ranges', () => {
  const segments = getHighlightedSegments('abcdefghi', [
    [1, 3],
    [3, 5],
  ]);

  assert.deepEqual(segments, [
    { text: 'a', highlighted: false },
    { text: 'bcdef', highlighted: true },
    { text: 'ghi', highlighted: false },
  ]);
});

test('pickResultSnippet prefers summary matches over later fields', () => {
  const result = assertSearchMatch(snippetPrompts, 'luminara', 'snippet-summary', 'summary');
  const snippet = pickResultSnippet(result);

  assert.equal(snippet.field, 'summary');
  assert.match(snippet.text, /luminara/i);
});

test('pickResultSnippet falls back to context when summary has no match', () => {
  const result = assertSearchMatch(snippetPrompts, 'matrixvale', 'snippet-context', 'context');
  const snippet = pickResultSnippet(result);

  assert.equal(snippet.field, 'context');
  assert.match(snippet.text, /matrixvale/i);
});

test('pickResultSnippet falls back to prompt when summary and context have no match', () => {
  const result = assertSearchMatch(snippetPrompts, 'solsticegate', 'snippet-prompt', 'prompt');
  const snippet = pickResultSnippet(result);

  assert.equal(snippet.field, 'prompt');
  assert.match(snippet.text, /solsticegate/i);
});

test('pickResultSnippet falls back to context for tag-only matches', () => {
  const [result] = searchPrompts(
    [
      {
        id: 'tag-only',
        title: 'Alpha',
        summary: 'Beta',
        tags: ['subagents'],
        context: 'Use after a workflow calls for delegated investigation.',
        prompt: 'Delegate the investigation.',
      },
    ],
    'subagents',
  );
  const snippet = pickResultSnippet(result);

  assert.equal(snippet.field, 'context');
  assert.match(snippet.text, /Use after/i);
});

test('tag filtering composes with search input', () => {
  const filtered = filterPromptsByTags(prompts, ['architecture']);
  const results = searchPrompts(filtered, 'subagent');

  assert.deepEqual(
    results.map((result) => result.prompt.id),
    ['proposal-review-subagent'],
  );
});
