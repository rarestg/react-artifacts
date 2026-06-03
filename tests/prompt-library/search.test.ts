import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { PromptEntry } from '../../src/artifacts/prompt-library/prompts';
import { prompts } from '../../src/artifacts/prompt-library/prompts';
import {
  filterPromptsByTags,
  getDisplayMatchesForFields,
  getDisplayMatchIndices,
  getHighlightedSegments,
  getMatchedPromptSearchVariant,
  getPromptHeaderDisplayMatches,
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

const tagFilterPrompts = [
  {
    id: 'tag-review-subagent',
    title: 'Review Delegation',
    summary: 'Ask another reviewer to inspect the plan.',
    tags: ['review', 'subagents'],
    context: 'Use when delegated review should narrow risk.',
    prompt: 'Delegate the review.',
  },
  {
    id: 'tag-implementation-subagent',
    title: 'Implementation Delegation',
    summary: 'Ask another worker to implement the next slice.',
    tags: ['implementation', 'subagents'],
    context: 'Use when implementation work can be split cleanly.',
    prompt: 'Delegate the implementation.',
  },
  {
    id: 'tag-review-architecture',
    title: 'Architecture Option Review',
    summary: 'Compare tradeoffs before committing to a structure.',
    tags: ['review', 'architecture'],
    context: 'Use when architecture tradeoffs need direct comparison.',
    prompt: 'Compare the tradeoffs.',
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
  const reviewSubagentPrompts = filterPromptsByTags(tagFilterPrompts, ['review', 'subagents']);
  assert.deepEqual(
    reviewSubagentPrompts.map((prompt) => prompt.id),
    ['tag-review-subagent'],
  );

  const riskArchitecturePrompts = filterPromptsByTags(tagFilterPrompts, ['risk', 'architecture']);
  assert.deepEqual(
    riskArchitecturePrompts.map((prompt) => prompt.id),
    [],
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
  const results = searchPrompts(searchFieldPrompts, 'zzzzzz-no-prompt');

  assert.deepEqual(results, []);
});

test('searchPrompts keeps the proposal result first while completing a multi-token query', () => {
  for (const query of [
    'subagent review propos',
    'subagent review proposal',
    'subagent validate proposal plan',
    'subagent validate written plan',
  ]) {
    const [result] = searchPrompts(prompts, query);

    assert.equal(result?.prompt.id, 'proposal-review-subagent', `Expected ${query} to keep proposal first`);
  }
});

test('searchPrompts indexes rendered modifier text instead of raw template tokens', () => {
  const modifierPrompt = {
    id: 'modifier-search',
    title: 'Modifier Search',
    summary: 'Fixture summary.',
    tags: ['review'],
    context: 'Fixture context.',
    prompt: 'Review {{subject}}.',
    modifier: {
      label: 'Source type',
      defaultOptionId: 'plan',
      options: [
        {
          id: 'plan',
          label: 'Plan',
          replacements: {
            subject: 'renderedmarker',
          },
        },
      ],
    },
  } as const satisfies PromptEntry;

  const [renderedResult] = searchPrompts([modifierPrompt], 'renderedmarker');

  assert.equal(renderedResult?.prompt.id, 'modifier-search');
  assert.ok(renderedResult.matches.some((match) => match.key === 'prompt'));
  assert.deepEqual(searchPrompts([modifierPrompt], 'subject'), []);
});

test('searchPrompts indexes non-default rendered modifier text', () => {
  const [pathsResult] = searchPrompts(prompts, 'proposed paths');
  const [changeResult] = searchPrompts(prompts, 'some proposals should change');

  assert.equal(pathsResult?.prompt.id, 'proposal-review-subagent');
  assert.ok(
    pathsResult.matches.some(
      (match) => match.key === 'prompt' && typeof match.value === 'string' && match.value.includes('proposed paths'),
    ),
  );

  assert.equal(changeResult?.prompt.id, 'proposal-review-subagent');
  assert.ok(
    changeResult.matches.some(
      (match) =>
        match.key === 'prompt' &&
        typeof match.value === 'string' &&
        match.value.includes('some proposals should change'),
    ),
  );
});

test('searchPrompts does not index modifier template token names', () => {
  assert.deepEqual(searchPrompts(prompts, 'soundnessQuestion'), []);
  assert.deepEqual(searchPrompts(prompts, 'reviewSubjectClause'), []);
});

test('searchPrompts applies AND semantics across multi-token literal matches', () => {
  const results = searchPrompts(
    [
      {
        id: 'only-subagent',
        title: 'Subagent Dispatch',
        summary: 'Send the work to another reviewer.',
        tags: ['subagents'],
        context: 'Use when the task can be delegated.',
        prompt: 'Dispatch the task.',
      },
      {
        id: 'subagent-validate',
        title: 'Subagent Validation',
        summary: 'Ask a reviewer to validate the proposal.',
        tags: ['review'],
        context: 'Use when a delegated review should check correctness.',
        prompt: 'Validate the proposal.',
      },
    ],
    'subagent validate',
  );

  assert.deepEqual(
    results.map((result) => result.prompt.id),
    ['subagent-validate'],
  );
});

test('searchPrompts lets multi-token queries match tags and text fields together', () => {
  const results = searchPrompts(
    [
      {
        id: 'tag-and-summary',
        title: 'Delegation Check',
        summary: 'Validate the proposed change.',
        tags: ['subagents'],
        context: 'Use when delegated review is useful.',
        prompt: 'Check the proposed change.',
      },
      {
        id: 'summary-only',
        title: 'Proposal Check',
        summary: 'Validate the proposed change.',
        tags: ['review'],
        context: 'Use when review is useful.',
        prompt: 'Check the proposed change.',
      },
    ],
    'subagents validate',
  );

  assert.deepEqual(
    results.map((result) => result.prompt.id),
    ['tag-and-summary'],
  );
});

test('searchPrompts preserves single-token fuzzy search behavior', () => {
  assertSearchMatch(snippetPrompts, 'solsticegote', 'snippet-prompt', 'prompt');
});

test('searchPrompts returns source order for an empty query', () => {
  const results = searchPrompts(searchFieldPrompts, '   ');

  assert.deepEqual(
    results.map((result) => result.prompt.id),
    ['field-title', 'field-tags', 'field-context', 'field-prompt'],
  );
  assert.deepEqual(results[0]?.matches, []);
});

test('searchPrompts clamps negative limits to an empty result set', () => {
  assert.deepEqual(searchPrompts(searchFieldPrompts, '   ', -1), []);
  assert.deepEqual(searchPrompts(searchFieldPrompts, 'emberkey', -1), []);
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

test('makeSnippet falls back to a leading snippet when supplied ranges normalize away', () => {
  const snippet = makeSnippet('0123456789abcdefghij', [[30, 35]], 4);

  assert.equal(snippet.text, '01234567');
  assert.equal(snippet.leadingEllipsis, false);
  assert.equal(snippet.trailingEllipsis, true);
  assert.deepEqual(snippet.indices, []);
});

test('getDisplayMatchIndices prefers exact phrase matches over earlier fuzzy fragments', () => {
  const text = 'Please dispatch a fresh subagent. They should not manufacture work.';
  const indices = getDisplayMatchIndices(text, 'manufacture', [
    [2, 3],
    [12, 14],
    [54, 64],
  ]);

  assert.deepEqual(indices, [[50, 60]]);
});

test('getDisplayMatchIndices matches exact phrases case-insensitively', () => {
  assert.deepEqual(getDisplayMatchIndices('They should not Manufacture work.', 'manufacture', []), [[16, 26]]);
});

test('getDisplayMatchIndices includes overlapping exact phrase matches', () => {
  assert.deepEqual(getDisplayMatchIndices('banana', 'ana', []), [
    [1, 3],
    [3, 5],
  ]);
});

test('getDisplayMatchIndices treats regex-sensitive query characters literally', () => {
  assert.deepEqual(getDisplayMatchIndices('Review use of a+b? before merging.', 'a+b?', []), [[14, 17]]);
});

test('getDisplayMatchIndices prefers a multi-word exact phrase over token fragments', () => {
  const text = 'change before implementation, then review before implementation';
  const indices = getDisplayMatchIndices(text, 'before implementation', [
    [7, 12],
    [50, 63],
  ]);

  assert.deepEqual(indices, [
    [7, 27],
    [42, 62],
  ]);
});

test('getDisplayMatchesForFields suppresses fuzzy-only fields when another field has exact evidence', () => {
  const matches = getDisplayMatchesForFields(
    [
      {
        field: 'summary',
        text: 'Please dispatch a reviewer.',
        fuseIndices: [[2, 3]],
      },
      {
        field: 'prompt',
        text: 'They should not manufacture work.',
        fuseIndices: [[16, 26]],
      },
    ],
    'manufacture',
  );
  const byField = Object.fromEntries(matches.map((match) => [match.field, match]));

  assert.deepEqual(byField.summary?.indices, []);
  assert.deepEqual(byField.prompt?.indices, [[16, 26]]);
  assert.equal(byField.prompt?.source, 'phrase');
});

test('getDisplayMatchesForFields suppresses fuzzy-only text fields when tag evidence is exact', () => {
  const matches = getDisplayMatchesForFields(
    [
      {
        field: 'title',
        text: 'Subagent Delegation',
        fuseIndices: [[0, 7]],
      },
      {
        field: 'summary',
        text: 'Please dispatch another reviewer.',
        fuseIndices: [[7, 14]],
      },
      {
        field: 'tags',
        text: 'subagents',
        fuseIndices: [[0, 7]],
      },
    ],
    'subagents',
  );
  const byField = Object.fromEntries(matches.map((match) => [match.field, match]));

  assert.deepEqual(byField.title?.indices, []);
  assert.equal(byField.title?.source, 'none');
  assert.deepEqual(byField.summary?.indices, []);
  assert.equal(byField.summary?.source, 'none');
  assert.deepEqual(byField.tags?.indices, [[0, 8]]);
  assert.equal(byField.tags?.source, 'phrase');
});

test('getDisplayMatchesForFields keeps fuzzy ranges when no field has exact evidence', () => {
  const matches = getDisplayMatchesForFields(
    [
      {
        field: 'summary',
        text: 'Please dispatch a reviewer.',
        fuseIndices: [[2, 3]],
      },
      {
        field: 'prompt',
        text: 'Delegate the investigation.',
        fuseIndices: [[4, 7]],
      },
    ],
    'manufacture',
  );
  const byField = Object.fromEntries(matches.map((match) => [match.field, match]));

  assert.deepEqual(byField.summary?.indices, [[2, 3]]);
  assert.equal(byField.summary?.source, 'fuse');
  assert.deepEqual(byField.prompt?.indices, [[4, 7]]);
  assert.equal(byField.prompt?.source, 'fuse');
});

test('getPromptHeaderDisplayMatches suppresses fuzzy title and summary ranges when tags have exact evidence', () => {
  const [result] = searchPrompts(prompts, 'subagents');

  assert.equal(result?.prompt.id, 'proposal-review-subagent');
  assert.ok(result.matches.some((match) => match.key === 'title' && match.indices.length > 0));
  assert.ok(result.matches.some((match) => match.key === 'summary' && match.indices.length > 0));
  assert.ok(result.matches.some((match) => match.key === 'tags' && match.value === 'subagents'));

  const matches = getPromptHeaderDisplayMatches(result, 'subagents');

  assert.deepEqual(matches.titleIndices, []);
  assert.deepEqual(matches.summaryIndices, []);
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

test('getHighlightedSegments merges overlapping exact phrase matches found from a query', () => {
  const segments = getHighlightedSegments('banana', getDisplayMatchIndices('banana', 'ana', []));

  assert.deepEqual(segments, [
    { text: 'b', highlighted: false },
    { text: 'anana', highlighted: true },
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

test('pickResultSnippet anchors manufacture search on the exact prompt-body word', () => {
  const [result] = searchPrompts(prompts, 'manufacture');
  const snippet = pickResultSnippet(result, 32, 'manufacture');

  assert.equal(snippet.field, 'prompt');
  assert.match(snippet.text, /manufacture/i);
  assert.doesNotMatch(snippet.text, /^Please dispatch/i);
  assert.deepEqual(
    snippet.indices.map(([start, end]) => snippet.text.slice(start, end + 1)),
    ['manufacture'],
  );
});

test('pickResultSnippet highlights multi-token literal search evidence', () => {
  const query = 'subagent validate proposal';
  const [result] = searchPrompts(prompts, query);
  const snippet = pickResultSnippet(result, 80, query);

  assert.equal(result?.prompt.id, 'proposal-review-subagent');
  assert.equal(snippet.field, 'summary');
  assert.deepEqual(
    snippet.indices.map(([start, end]) => snippet.text.slice(start, end + 1).toLowerCase()),
    ['subagent', 'validate', 'proposal'],
  );
});

test('pickResultSnippet uses the matched non-default modifier text', () => {
  const query = 'proposed paths';
  const [result] = searchPrompts(prompts, query);
  const snippet = pickResultSnippet(result, 80, query);

  assert.equal(result?.prompt.id, 'proposal-review-subagent');
  assert.equal(snippet.field, 'prompt');
  assert.match(snippet.text, /proposed paths/i);
  assert.doesNotMatch(snippet.text, /this is the best path/i);
  assert.deepEqual(
    snippet.indices.map(([start, end]) => snippet.text.slice(start, end + 1).toLowerCase()),
    ['proposed paths'],
  );
});

test('getMatchedPromptSearchVariant maps non-default prompt matches to modifier options', () => {
  const query = 'proposed paths';
  const [result] = searchPrompts(prompts, query);

  assert.ok(result);

  const variant = getMatchedPromptSearchVariant(result, query);

  assert.equal(variant?.optionId, 'multiple-proposals');
  assert.match(variant?.text ?? '', /proposed paths/i);
});

test('getMatchedPromptSearchVariant maps general article matches to the article modifier option', () => {
  const query = 'broad life lessons';
  const [result] = searchPrompts(prompts, query);

  assert.equal(result?.prompt.id, 'session-to-blog-article-polisher');

  const variant = getMatchedPromptSearchVariant(result, query);

  assert.equal(variant?.optionId, 'general');
  assert.match(variant?.text ?? '', /broad life lessons/i);
});

test('pickResultSnippet falls back to fuzzy ranges when no exact display evidence exists', () => {
  const result = assertSearchMatch(snippetPrompts, 'solsticegote', 'snippet-prompt', 'prompt');
  const snippet = pickResultSnippet(result, 32, 'solsticegote');

  assert.equal(snippet.field, 'prompt');
  assert.notEqual(snippet.text, '');
  assert.notDeepEqual(snippet.indices, []);
});

test('pickResultSnippet prefers exact prompt evidence over earlier fuzzy-only fields', () => {
  const result: PromptSearchResult = {
    prompt: {
      id: 'display-field-prompt',
      title: 'Display Field Prompt',
      summary: 'Please dispatch a reviewer.',
      tags: ['review'],
      context: 'Please inspect the proposal.',
      prompt: 'They should not manufacture work.',
    },
    matches: [
      { key: 'summary', indices: [[2, 3]], value: 'Please dispatch a reviewer.' },
      { key: 'context', indices: [[2, 3]], value: 'Please inspect the proposal.' },
      { key: 'prompt', indices: [[16, 26]], value: 'They should not manufacture work.' },
    ],
    refIndex: 0,
  };
  const snippet = pickResultSnippet(result, 32, 'manufacture');

  assert.equal(snippet.field, 'prompt');
  assert.match(snippet.text, /manufacture/i);
});

test('pickResultSnippet keeps exact evidence in the earliest preferred field', () => {
  const result: PromptSearchResult = {
    prompt: {
      id: 'display-field-summary',
      title: 'Display Field Summary',
      summary: 'Summary says manufacture here.',
      tags: ['review'],
      context: 'Context says manufacture here.',
      prompt: 'Prompt says manufacture here.',
    },
    matches: [
      { key: 'summary', indices: [[13, 23]], value: 'Summary says manufacture here.' },
      { key: 'context', indices: [[13, 23]], value: 'Context says manufacture here.' },
      { key: 'prompt', indices: [[12, 22]], value: 'Prompt says manufacture here.' },
    ],
    refIndex: 0,
  };
  const snippet = pickResultSnippet(result, 32, 'manufacture');

  assert.equal(snippet.field, 'summary');
  assert.match(snippet.text, /manufacture/i);
});

test('pickResultSnippet falls back to context when exact evidence is tag-only', () => {
  const [result] = searchPrompts(prompts, 'subagents');
  const snippet = pickResultSnippet(result, 80, 'subagents');

  assert.equal(result?.prompt.id, 'proposal-review-subagent');
  assert.equal(snippet.field, 'context');
  assert.deepEqual(snippet.indices, []);
});

test('tag filtering composes with search input', () => {
  const filtered = filterPromptsByTags(tagFilterPrompts, ['architecture']);
  const results = searchPrompts(filtered, 'tradeoffs');

  assert.deepEqual(
    results.map((result) => result.prompt.id),
    ['tag-review-architecture'],
  );
});
