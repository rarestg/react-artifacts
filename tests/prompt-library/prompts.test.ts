import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type PromptEntry, type PromptTag, validatePrompts } from '../../src/artifacts/prompt-library/prompts';

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
