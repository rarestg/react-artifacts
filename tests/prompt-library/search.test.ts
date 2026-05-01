import assert from 'node:assert/strict';
import { test } from 'node:test';

import { prompts } from '../../src/artifacts/prompt-library/prompts';
import {
  filterPromptsByTags,
  getHighlightedSegments,
  makeSnippet,
  pickResultSnippet,
  searchPrompts,
} from '../../src/artifacts/prompt-library/search';

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

test('searchPrompts searches title, tags, context, and prompt body with highlights', () => {
  const results = searchPrompts(prompts, 'residual risks');

  assert.equal(results[0]?.prompt.id, 'risk-challenging-discovery');
  assert.ok(
    results[0]?.matches.some((match) => match.key === 'summary' || match.key === 'context' || match.key === 'prompt'),
  );
});

test('searchPrompts supports title-only matches', () => {
  const results = searchPrompts(prompts, 'proposal review');

  assert.equal(results[0]?.prompt.id, 'proposal-review-subagent');
  assert.ok(results[0]?.matches.some((match) => match.key === 'title'));
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

test('makeSnippet adjusts inclusive match ranges', () => {
  const snippet = makeSnippet('0123456789abcdefghij', [[10, 12]], 4);

  assert.equal(snippet.text, '6789abcd');
  assert.equal(snippet.leadingEllipsis, true);
  assert.equal(snippet.trailingEllipsis, true);
  assert.deepEqual(snippet.indices, [[4, 6]]);
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

test('pickResultSnippet prefers summary, then context, then prompt', () => {
  const [result] = searchPrompts(prompts, 'validate proposed solution');
  assert.equal(result?.prompt.id, 'proposal-review-subagent');

  const snippet = pickResultSnippet(result);
  assert.equal(snippet.field, 'summary');
  assert.match(snippet.text, /validate/i);
});

test('tag filtering composes with search input', () => {
  const filtered = filterPromptsByTags(prompts, ['architecture']);
  const results = searchPrompts(filtered, 'subagent');

  assert.deepEqual(
    results.map((result) => result.prompt.id),
    ['proposal-review-subagent'],
  );
});
