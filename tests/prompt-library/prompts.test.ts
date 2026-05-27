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

  assert.match(renderedPrompt, /review the current proposals before we act on them/);
  assert.match(renderedPrompt, /why these directions were proposed/);
  assert.match(renderedPrompt, /whether the proposed paths are sound independently or in combination/);
  assert.match(renderedPrompt, /"The proposals are solid," "some proposals should change,"/);
  assert.doesNotMatch(renderedPrompt, /one of these proposals is the best path/i);
  assert.doesNotMatch(renderedPrompt, /One of the proposals is solid/);
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
