import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getPromptTag,
  type PromptEntry,
  type PromptTag,
  prompts,
  renderPromptText,
  validatePrompts,
} from '../../src/artifacts/prompt-library/prompts';

const validTags = [
  {
    id: 'review',
    label: 'Review',
    description: 'Fixture review tag.',
    color: 'blue',
  },
  {
    id: 'implementation',
    label: 'Implementation',
    description: 'Fixture implementation tag.',
    color: 'green',
  },
] as const satisfies readonly PromptTag[];

const validEntry = {
  id: 'fixture-entry',
  title: 'Fixture Entry',
  summary: 'Fixture summary.',
  tags: ['review'],
  context: 'Fixture context.',
  prompt: 'Fixture prompt.',
} as const satisfies PromptEntry;

test('validatePrompts accepts prompt tag metadata with valid color ids', () => {
  assert.doesNotThrow(() => validatePrompts([validEntry], validTags));
});

test('validatePrompts rejects prompt tag metadata with unknown color ids', () => {
  const invalidTags = [
    {
      ...validTags[0],
      color: 'orange',
    },
    validTags[1],
  ] as unknown as readonly PromptTag[];

  assert.throws(() => validatePrompts([validEntry], invalidTags), /unknown tag color/i);
});

test('validatePrompts rejects prompt tag metadata with duplicate tag ids', () => {
  const duplicateTags = [
    validTags[0],
    {
      ...validTags[1],
      id: validTags[0].id,
    },
  ] as const satisfies readonly PromptTag[];

  assert.throws(() => validatePrompts([validEntry], duplicateTags), /Duplicate prompt tag id/);
});

test('self-contained execution plan uses planning instead of risk', () => {
  const prompt = prompts.find((entry) => entry.id === 'self-contained-execution-plan');

  assert.ok(prompt);
  assert.deepEqual(prompt.tags, ['implementation', 'planning', 'architecture']);
  assert.equal(getPromptTag('planning').color, 'amber');
});

test('founder transcript synthesis prompt uses planning and synthesis tags', () => {
  const prompt = prompts.find((entry) => entry.id === 'founder-transcript-synthesis');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Founder Transcript Synthesis');
  assert.deepEqual(prompt.tags, ['planning', 'synthesis']);
  assert.equal(getPromptTag('synthesis').color, 'pink');
});

test('blog tag is available for prose publishing prompts', () => {
  const tag = getPromptTag('blog');

  assert.equal(tag.label, 'Blog');
  assert.equal(tag.color, 'lime');
});

test('session-to-blog article prompt separates reviewed article drafting from metadata', () => {
  const prompt = prompts.find((entry) => entry.id === 'session-to-blog-article-polisher');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Session-To-Blog Article Polisher');
  assert.deepEqual(prompt.tags, ['blog']);

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /Markdown blog article body/);
  assert.match(renderedPrompt, /durable reader-facing lesson/);
  assert.match(renderedPrompt, /Do not create YAML frontmatter/);
  assert.match(renderedPrompt, /explain like I'm an intern/);
  assert.match(renderedPrompt, /Preserve my voice/);
  assert.match(renderedPrompt, /Do not invent stakes/);
  assert.match(renderedPrompt, /2-4 fresh subagents/);
  assert.match(renderedPrompt, /final fresh subagent/);
  assert.match(renderedPrompt, /rather than direct edits/);
  assert.match(renderedPrompt, /frontmatter still needs to be generated separately/);
  assert.doesNotMatch(renderedPrompt, /America\/New_York/);
  assert.doesNotMatch(renderedPrompt, /semantic_triples/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('article frontmatter prompt derives strict New York metadata without editing the body', () => {
  const prompt = prompts.find((entry) => entry.id === 'article-frontmatter-generator');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Article Frontmatter Generator');
  assert.deepEqual(prompt.tags, ['blog']);

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /Generate only YAML frontmatter/);
  assert.match(renderedPrompt, /Do not rewrite, critique, or edit the article body/);
  assert.match(renderedPrompt, /America\/New_York/);
  assert.match(renderedPrompt, /±HH:MM/);
  assert.match(renderedPrompt, /Verify the New York local time/);
  assert.match(renderedPrompt, /semantic_triples/);
  assert.match(renderedPrompt, /Base the metadata on the final article/);
  assert.match(renderedPrompt, /Use the article H1 or title/);
  assert.match(renderedPrompt, /use \[\] when none are warranted/);
  assert.match(renderedPrompt, /Quote or escape YAML strings/);
  assert.match(renderedPrompt, /Return only the frontmatter block/);
  assert.doesNotMatch(renderedPrompt, /2-4 fresh subagents/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('proposal review prompt renders the default plan modifier without template tokens', () => {
  const prompt = prompts.find((entry) => entry.id === 'proposal-review-subagent');

  assert.ok(prompt);
  assert.equal(prompt.modifier?.label, 'Source type');
  assert.equal(prompt.modifier.defaultOptionId, 'plan');

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /review the current plan before we act on it/);
  assert.match(renderedPrompt, /If there is a written plan or document/);
  assert.match(renderedPrompt, /Make clear that the plan is context, not a conclusion/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('proposal review prompt renders singular proposal modifier text', () => {
  const prompt = prompts.find((entry) => entry.id === 'proposal-review-subagent');

  assert.ok(prompt);

  const renderedPrompt = renderPromptText(prompt, 'proposal');

  assert.match(renderedPrompt, /review the current proposal before we act on it/);
  assert.match(renderedPrompt, /Summarize the proposal and assumptions clearly/);
  assert.match(renderedPrompt, /"The proposal is solid,"/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('proposal review prompt renders multiple proposal modifier text', () => {
  const prompt = prompts.find((entry) => entry.id === 'proposal-review-subagent');

  assert.ok(prompt);

  const renderedPrompt = renderPromptText(prompt, 'multiple-proposals');

  assert.equal(
    renderedPrompt,
    `Please dispatch a fresh subagent to review the current proposals before we act on them.

Give them enough context to understand the goal, what led to these proposals, the relevant code or architecture areas they touch, and why these directions were proposed. Summarize the proposals and assumptions clearly. Make clear that the proposals are context, not conclusions.

Ask them to evaluate from first principles whether the proposed paths are sound independently or in combination. They should extract the real intent, identify assumptions or inherited requirements, challenge whether any can be removed rather than satisfied, and look for failure modes, hidden coupling, simpler targeted fixes, unnecessary complexity, better long-term designs, or reasons no changes are needed.

They should not manufacture objections. "The proposals are solid," "some proposals should change," and "none of the proposals are needed" are valid answers if the evidence supports them.

After they report back, compare their assessment with yours. Synthesize the strongest path forward, including combining, narrowing, changing, or rejecting proposals as warranted.`,
  );
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('validatePrompts rejects modifier options with missing replacements', () => {
  const invalidEntry = {
    ...validEntry,
    prompt: 'Review {{subject}}.',
    modifier: {
      label: 'Source type',
      defaultOptionId: 'plan',
      options: [
        {
          id: 'plan',
          label: 'Plan',
          replacements: {},
        },
      ],
    },
  } as const satisfies PromptEntry;

  assert.throws(() => validatePrompts([invalidEntry], validTags), /missing replacement: subject/);
});

test('validatePrompts rejects unreplaced tokens without modifiers', () => {
  const invalidEntry = {
    ...validEntry,
    prompt: 'Review {{subject}}.',
  } as const satisfies PromptEntry;

  assert.throws(() => validatePrompts([invalidEntry], validTags), /template tokens without a modifier/);
});
