import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getDefaultPromptToggleOptionIds,
  getPromptTag,
  normalizePromptNumberInputValue,
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

test('parallel draft synthesis prompt renders the selected draft count', () => {
  const prompt = prompts.find((entry) => entry.id === 'parallel-draft-synthesis');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Parallel Draft Synthesis');
  assert.deepEqual(prompt.tags, ['planning', 'subagents', 'synthesis']);
  assert.deepEqual(prompt.numberInput, {
    token: 'draftCount',
    label: 'Options',
    defaultValue: 5,
    min: 2,
    max: 10,
    step: 1,
  });

  const defaultRenderedPrompt = renderPromptText(prompt);
  const customRenderedPrompt = renderPromptText(prompt, undefined, { numberInputValue: 7 });

  assert.match(defaultRenderedPrompt, /Please orchestrate 5 independent drafts/);
  assert.match(defaultRenderedPrompt, /Dispatch 5 fresh subagents in parallel/);
  assert.match(customRenderedPrompt, /Please orchestrate 7 independent drafts/);
  assert.match(customRenderedPrompt, /Dispatch 7 fresh subagents in parallel/);
  assert.match(customRenderedPrompt, /same prompt for every subagent/);
  assert.match(customRenderedPrompt, /different lenses/);
  assert.match(customRenderedPrompt, /If the user should inspect distinct variants/);
  assert.match(customRenderedPrompt, /optionally run one focused follow-up round/);
  assert.doesNotMatch(customRenderedPrompt, /artificial lenses/);
  assert.doesNotMatch(defaultRenderedPrompt, /\{\{/);
  assert.doesNotMatch(customRenderedPrompt, /\{\{/);
});

test('prompt number input values clamp to the configured range', () => {
  const prompt = prompts.find((entry) => entry.id === 'parallel-draft-synthesis');

  assert.ok(prompt?.numberInput);

  assert.equal(normalizePromptNumberInputValue(1, prompt.numberInput), 2);
  assert.equal(normalizePromptNumberInputValue(12, prompt.numberInput), 10);
  assert.equal(normalizePromptNumberInputValue(undefined, prompt.numberInput), 5);
});

test('prompt number input step values snap relative to the configured minimum', () => {
  assert.equal(
    normalizePromptNumberInputValue(undefined, {
      token: 'count',
      label: 'Count',
      defaultValue: 2,
      min: 2,
      max: 10,
      step: 4,
    }),
    2,
  );
  assert.equal(
    normalizePromptNumberInputValue(7, {
      token: 'count',
      label: 'Count',
      defaultValue: 2,
      min: 2,
      max: 10,
      step: 4,
    }),
    6,
  );
});

test('blog tag is available for prose publishing prompts', () => {
  const tag = getPromptTag('blog');

  assert.equal(tag.label, 'Blog');
  assert.equal(tag.color, 'lime');
});

test('session-to-blog article prompt renders technical article checks by default', () => {
  const prompt = prompts.find((entry) => entry.id === 'session-to-blog-article-polisher');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Session-To-Blog Article Polisher');
  assert.deepEqual(prompt.tags, ['blog']);
  assert.equal(prompt.modifier?.label, 'Article type');
  assert.equal(prompt.modifier.defaultOptionId, 'technical');
  assert.deepEqual(
    prompt.modifier.options.map((option) => ({ id: option.id, label: option.label })),
    [
      { id: 'technical', label: 'Technical article' },
      { id: 'general', label: 'General article' },
    ],
  );

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /Markdown blog article/);
  assert.match(renderedPrompt, /durable reader-facing lesson/);
  assert.match(renderedPrompt, /Be short by default/);
  assert.match(renderedPrompt, /shortest article that preserves the durable lesson/);
  assert.match(renderedPrompt, /explain like I'm an intern/);
  assert.match(renderedPrompt, /Preserve my voice/);
  assert.match(renderedPrompt, /Shakespeare-ify/);
  assert.match(renderedPrompt, /compression pass/);
  assert.match(renderedPrompt, /If a paragraph's point can be made in one sentence/);
  assert.match(renderedPrompt, /Do not invent stakes/);
  assert.match(renderedPrompt, /reproducibility pass before review/);
  assert.match(renderedPrompt, /command, log line, observed output, source text, or explicit inference/);
  assert.match(renderedPrompt, /copy-paste-dangerous placeholder commands/);
  assert.match(renderedPrompt, /PID, service label, bundle ID/);
  assert.match(renderedPrompt, /ellipses inside a runnable command block/);
  assert.match(renderedPrompt, /observed in this session/);
  assert.match(renderedPrompt, /generally true/);
  assert.match(renderedPrompt, /expected but unverified/);
  assert.match(renderedPrompt, /2-4 fresh subagents/);
  assert.match(renderedPrompt, /final fresh subagent/);
  assert.match(renderedPrompt, /Technical accuracy, reproducibility/);
  assert.match(renderedPrompt, /Command safety: placeholders/);
  assert.match(renderedPrompt, /Aggressive concision/);
  assert.match(renderedPrompt, /rather than direct edits/);
  assert.doesNotMatch(renderedPrompt, /over-disclosing private context/);
  assert.doesNotMatch(renderedPrompt, /broad life lessons/);
  assert.doesNotMatch(renderedPrompt, /frontmatter/i);
  assert.doesNotMatch(renderedPrompt, /metadata/i);
  assert.doesNotMatch(renderedPrompt, /keywords/i);
  assert.doesNotMatch(renderedPrompt, /entities/i);
  assert.doesNotMatch(renderedPrompt, /America\/New_York/);
  assert.doesNotMatch(renderedPrompt, /semantic_triples/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('session-to-blog article prompt renders general article checks', () => {
  const prompt = prompts.find((entry) => entry.id === 'session-to-blog-article-polisher');

  assert.ok(prompt);

  const renderedPrompt = renderPromptText(prompt, 'general');

  assert.match(renderedPrompt, /Markdown blog article/);
  assert.match(renderedPrompt, /durable reader-facing lesson/);
  assert.match(renderedPrompt, /Write for a useful blog/);
  assert.match(renderedPrompt, /natural language of the session/);
  assert.match(renderedPrompt, /Do not impose debugging, implementation, or process scaffolding/);
  assert.match(renderedPrompt, /avoid over-disclosing private context/);
  assert.match(renderedPrompt, /Separate what happened, what you inferred, and what you now believe/);
  assert.match(renderedPrompt, /modest, specific claims over broad life lessons/);
  assert.match(renderedPrompt, /Specificity, honesty/);
  assert.match(renderedPrompt, /Voice, privacy/);
  assert.match(renderedPrompt, /2-4 fresh subagents/);
  assert.match(renderedPrompt, /final fresh subagent/);
  assert.match(renderedPrompt, /Aggressive concision/);
  assert.doesNotMatch(renderedPrompt, /reproducibility pass before review/);
  assert.doesNotMatch(renderedPrompt, /copy-paste-dangerous placeholder commands/);
  assert.doesNotMatch(renderedPrompt, /Command safety: placeholders/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('article frontmatter prompt derives strict New York metadata without editing the body', () => {
  const prompt = prompts.find((entry) => entry.id === 'article-frontmatter-generator');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Article Frontmatter Generator');
  assert.deepEqual(prompt.tags, ['blog']);

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /Return only YAML frontmatter/);
  assert.match(renderedPrompt, /leave the article text unchanged/);
  assert.match(renderedPrompt, /America\/New_York/);
  assert.match(renderedPrompt, /±HH:MM/);
  assert.match(renderedPrompt, /Verify the New York local time/);
  assert.match(renderedPrompt, /semantic_triples/);
  assert.match(renderedPrompt, /Base the metadata on the final article/);
  assert.match(renderedPrompt, /Use the article H1 or title/);
  assert.match(renderedPrompt, /explicit, article-supported claims/);
  assert.match(renderedPrompt, /not a keyword pairing/);
  assert.match(renderedPrompt, /Do not generalize a one-off observation into a class-level fact/);
  assert.match(renderedPrompt, /one app, one session, one machine, or one configuration/);
  assert.match(renderedPrompt, /the observed app process PATH/);
  assert.match(renderedPrompt, /broader subjects only when the article itself explicitly establishes/);
  assert.match(renderedPrompt, /supported, non-obvious, reusable, and more informative than a tag/);
  assert.match(renderedPrompt, /Prefer 2-6 high-signal triples/);
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

test('minimal code review team prompt defaults to all focused lenses', () => {
  const prompt = prompts.find((entry) => entry.id === 'minimal-code-review-team');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Minimal Code Review Team');
  assert.deepEqual(prompt.tags, ['review', 'subagents', 'architecture']);
  assert.equal(prompt.toggleModifier?.label, 'Lenses');
  assert.deepEqual(getDefaultPromptToggleOptionIds(prompt), [
    'minimalism',
    'stdlib-native',
    'correctness-safety',
    'readability',
    'checks',
  ]);

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /focused subagent review team/);
  assert.match(renderedPrompt, /minimal, still correct, and still understandable/);
  assert.match(renderedPrompt, /Minimalism\/YAGNI/);
  assert.match(renderedPrompt, /Stdlib\/native\/deps/);
  assert.match(renderedPrompt, /Correctness\/safety/);
  assert.match(renderedPrompt, /Readability\/maintainability/);
  assert.match(renderedPrompt, /Small checks/);
  assert.match(renderedPrompt, /synthesize one ranked action list/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('minimal code review team prompt can omit the checks lens', () => {
  const prompt = prompts.find((entry) => entry.id === 'minimal-code-review-team');

  assert.ok(prompt);

  const renderedPrompt = renderPromptText(prompt, undefined, {
    enabledToggleOptionIds: ['minimalism', 'stdlib-native', 'correctness-safety', 'readability'],
  });

  assert.match(renderedPrompt, /Minimalism\/YAGNI/);
  assert.match(renderedPrompt, /Readability\/maintainability/);
  assert.doesNotMatch(renderedPrompt, /Small checks/);
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

test('validatePrompts rejects unused number input tokens', () => {
  const invalidEntry = {
    ...validEntry,
    numberInput: {
      token: 'count',
      label: 'Count',
      defaultValue: 5,
      min: 2,
      max: 10,
    },
  } as const satisfies PromptEntry;

  assert.throws(() => validatePrompts([invalidEntry], validTags), /number input token is not used/);
});
