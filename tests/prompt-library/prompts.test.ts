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
      color: 'ultraviolet',
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

test('founder transcript synthesis prompt uses the synthesis workflow tag', () => {
  const prompt = prompts.find((entry) => entry.id === 'founder-transcript-synthesis');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Founder Transcript Synthesis');
  assert.deepEqual(prompt.tags, ['synthesis']);
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

  assert.match(defaultRenderedPrompt, /Orchestrate 5 independent drafts/);
  assert.match(defaultRenderedPrompt, /Dispatch 5 fresh subagents in parallel/);
  assert.match(customRenderedPrompt, /Orchestrate 7 independent drafts/);
  assert.match(customRenderedPrompt, /Dispatch 7 fresh subagents in parallel/);
  assert.match(customRenderedPrompt, /same prompt for every subagent/);
  assert.match(customRenderedPrompt, /different lenses/);
  assert.match(customRenderedPrompt, /give each its own path or workspace/);
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

test('writing tag is available for prose standards prompts', () => {
  const tag = getPromptTag('writing');

  assert.equal(tag.label, 'Writing');
  assert.equal(tag.color, 'orange');
});

test('session-to-blog article prompt renders technical article checks by default', () => {
  const prompt = prompts.find((entry) => entry.id === 'session-to-blog-article-polisher');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Session-To-Blog Article Polisher');
  assert.deepEqual(prompt.tags, ['blog', 'writing', 'subagents']);
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
  assert.match(renderedPrompt, /Treat the session as private source material/);
  assert.match(renderedPrompt, /Leave out credentials\./);
  assert.match(renderedPrompt, /reproducibility pass before review/);
  assert.match(renderedPrompt, /command, log line, observed output, source text, or explicit inference/);
  assert.match(renderedPrompt, /copy-paste-dangerous placeholder commands/);
  assert.match(renderedPrompt, /environment-specific value such as a PID, account name, host, or path/);
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
  assert.doesNotMatch(renderedPrompt, /broad life lessons/);
  assert.doesNotMatch(renderedPrompt, /frontmatter/i);
  assert.doesNotMatch(renderedPrompt, /metadata/i);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('session-to-blog article prompt renders general article checks', () => {
  const prompt = prompts.find((entry) => entry.id === 'session-to-blog-article-polisher');

  assert.ok(prompt);

  const renderedPrompt = renderPromptText(prompt, 'general');

  assert.match(renderedPrompt, /Markdown blog article/);
  assert.match(renderedPrompt, /durable reader-facing lesson/);
  assert.match(renderedPrompt, /Write for a useful blog/);
  assert.match(renderedPrompt, /session's own everyday terms/);
  assert.match(renderedPrompt, /Treat the session as private source material/);
  assert.match(renderedPrompt, /Leave out credentials\./);
  assert.match(renderedPrompt, /Do not impose debugging, implementation, or process scaffolding/);
  assert.match(renderedPrompt, /avoid turning one personal observation into universal advice/);
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
  assert.match(renderedPrompt, /If the proposal is written up somewhere, point them to it/);
  assert.match(renderedPrompt, /"The proposal is solid,"/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('proposal review prompt renders multiple proposal modifier text', () => {
  const prompt = prompts.find((entry) => entry.id === 'proposal-review-subagent');

  assert.ok(prompt);

  const renderedPrompt = renderPromptText(prompt, 'multiple-proposals');

  assert.equal(
    renderedPrompt,
    `Dispatch a fresh subagent to review the current proposals before we act on them.

Give them enough context to understand the goal, what led to these proposals, the relevant code or architecture areas they touch, and why these directions were proposed. If the proposals are written up somewhere, point them to it; otherwise summarize the proposals and assumptions clearly. Make clear that the proposals are context, not conclusions.

Ask them to evaluate from first principles whether the proposed paths are sound independently or in combination. They should extract the real intent, identify assumptions or inherited requirements, challenge whether any can be removed rather than satisfied, and look for failure modes, hidden coupling, simpler targeted fixes, unnecessary complexity, better long-term designs, or reasons no changes are needed.

They should not manufacture objections. "The proposals are solid," "some proposals should change," and "none of the proposals are needed" are valid answers if the evidence supports them.

After they report back, compare their assessment with yours. Synthesize the strongest path forward, including combining, narrowing, changing, or rejecting proposals as warranted.`,
  );
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('proposal review prompt renders residual risk modifier text', () => {
  const prompt = prompts.find((entry) => entry.id === 'proposal-review-subagent');

  assert.ok(prompt);
  assert.deepEqual(prompt.tags, ['review', 'implementation', 'subagents', 'architecture', 'risk']);
  assert.deepEqual(
    prompt.modifier?.options.map((option) => option.id),
    ['plan', 'proposal', 'multiple-proposals', 'residual-risks'],
  );

  const renderedPrompt = renderPromptText(prompt, 'residual-risks');

  assert.match(renderedPrompt, /review the residual risks identified in the current work/);
  assert.match(renderedPrompt, /the work's underlying goal and each risk in depth/);
  assert.match(renderedPrompt, /the plausible fixes are context, not conclusions/);
  assert.match(renderedPrompt, /whether each risk stems from a real constraint or an accidental one/);
  assert.match(renderedPrompt, /"a couple of small de-risking changes are enough"/);
  assert.match(renderedPrompt, /weighing the opportunity honestly against complexity, churn, and risk/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('code review lenses prompt defaults to the five PR review lenses', () => {
  const prompt = prompts.find((entry) => entry.id === 'code-review-lenses');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Code Review Lenses');
  assert.deepEqual(prompt.tags, ['review', 'subagents', 'architecture']);
  assert.equal(prompt.toggleModifier?.label, 'Lenses');
  assert.deepEqual(getDefaultPromptToggleOptionIds(prompt), [
    'trust-boundary',
    'behavior-regression',
    'structure-drift',
    'signatures-seams',
    'tests-checks',
  ]);

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /Trust boundary and scope/);
  assert.match(renderedPrompt, /Behavior and regression/);
  assert.match(renderedPrompt, /Structure and drift/);
  assert.match(renderedPrompt, /Signatures and seams/);
  assert.match(renderedPrompt, /Tests and checks/);
  assert.doesNotMatch(renderedPrompt, /Minimalism\/YAGNI/);
  assert.doesNotMatch(renderedPrompt, /Stdlib\/native\/deps/);
  assert.doesNotMatch(renderedPrompt, /Readability\/maintainability/);
  assert.match(renderedPrompt, /If one lens is listed, do that review yourself/);
  assert.match(renderedPrompt, /spawn one fresh subagent per lens/);
  assert.match(renderedPrompt, /Give each its lens word for word/);
  assert.match(renderedPrompt, /inspect the code behind each finding to confirm or reject it/);
  assert.match(renderedPrompt, /all blocking and should-change findings, at most three principle/);
  assert.match(renderedPrompt, /too small to justify separate reviewers/);
  assert.match(renderedPrompt, /When there is no diff, treat all the code as changed/);
  assert.match(renderedPrompt, /whether uncommitted changes are in scope/);
  assert.match(renderedPrompt, /check that the fixes were applied correctly/);
  assert.match(renderedPrompt, /production callers omit it; a global getter fills it/);
  assert.match(renderedPrompt, /record findings before reading the plan or PR description/);
  assert.match(renderedPrompt, /Add any finding the plan or description reveals/);
  assert.match(renderedPrompt, /Safe local checks are fine/);
  assert.match(renderedPrompt, /report anything serious outside it in one line/);
  assert.match(renderedPrompt, /Raise uncertainty as a question/);
  assert.match(renderedPrompt, /"Clean" is a valid answer/);
  assert.match(renderedPrompt, /The checks below are strong defaults, not requirements/);
  assert.match(renderedPrompt, /Types do not make external input safe/);
  assert.match(renderedPrompt, /report a gap only if you can name the behavior at risk/);
  assert.match(renderedPrompt, /deduplicate by root cause/);
  assert.match(renderedPrompt, /Block only for a regression or correctness bug/);
  assert.match(renderedPrompt, /Stop at the report unless fixes were requested/);
  assert.match(renderedPrompt, /When there is a PR, name in its body every decision/);
  assert.doesNotMatch(renderedPrompt, /smallest final shape/);
  assert.doesNotMatch(renderedPrompt, /Superset/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('code review lenses prompt can run a single lens or the simplification lenses', () => {
  const prompt = prompts.find((entry) => entry.id === 'code-review-lenses');

  assert.ok(prompt);

  const signaturesOnly = renderPromptText(prompt, undefined, { enabledToggleOptionIds: ['signatures-seams'] });

  assert.match(signaturesOnly, /^1\. Signatures and seams/m);
  assert.match(signaturesOnly, /Optional and defaults/);
  assert.match(signaturesOnly, /layer → responsibility/);
  assert.doesNotMatch(signaturesOnly, /Trust boundary and scope/);
  assert.doesNotMatch(signaturesOnly, /\{\{/);

  const simplification = renderPromptText(prompt, undefined, {
    enabledToggleOptionIds: ['minimalism', 'stdlib-native', 'readability'],
  });

  assert.match(simplification, /Minimalism\/YAGNI/);
  assert.match(simplification, /Readability\/maintainability/);
  assert.match(simplification, /smallest final shape/);
  assert.match(simplification, /say so rather than stretching for changes/);
  assert.doesNotMatch(simplification, /Tests and checks/);
  assert.doesNotMatch(simplification, /\{\{/);
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

test('goal statement writer prompt uses a plain concision bar', () => {
  const prompt = prompts.find((entry) => entry.id === 'goal-statement-writer');

  assert.ok(prompt);
  assert.deepEqual(prompt.tags, ['implementation', 'planning', 'synthesis']);

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /a few short paragraphs at most/);
  assert.match(renderedPrompt, /the agent's own output can show they were met/);
  assert.match(renderedPrompt, /which ones the agent may settle itself and which need a decision from the requester/);
  assert.match(renderedPrompt, /say what is missing instead of inventing certainty/);
  assert.doesNotMatch(renderedPrompt, /3000/);
});

test('stacked PR comment triage prompt stays portable and stack-aware', () => {
  const prompt = prompts.find((entry) => entry.id === 'stacked-pr-comment-triage');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Stacked PR Comment Triage');
  assert.deepEqual(prompt.tags, ['review', 'implementation']);

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /checkout pointed at the top of the stack/);
  assert.match(renderedPrompt, /Triage bottom to top/);
  assert.match(renderedPrompt, /potentially superseded by later changes/);
  assert.match(renderedPrompt, /ask the requester instead of guessing/);
  assert.match(renderedPrompt, /new branch created from the top branch/);
  assert.match(renderedPrompt, /do not open an empty follow-up PR/);
  assert.match(renderedPrompt, /inline review threads, review summaries/);
  assert.match(renderedPrompt, /marked resolved as addressed, with no reply needed/);
  assert.match(renderedPrompt, /fix, or needs a decision/);
  assert.match(renderedPrompt, /Leave comments that need a decision unanswered/);
  assert.match(renderedPrompt, /already addressed, obsolete, declined, fixed, and awaiting a decision/);
  assert.doesNotMatch(renderedPrompt, /SKILL\.md/);
  assert.doesNotMatch(renderedPrompt, /review bundles/i);
  assert.doesNotMatch(renderedPrompt, /reply queue/i);
  assert.doesNotMatch(renderedPrompt, /mini-PM/i);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('fresh session handoff prompt produces a paste-ready successor prompt', () => {
  const prompt = prompts.find((entry) => entry.id === 'fresh-session-handoff');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Fresh Session Handoff');
  assert.deepEqual(prompt.tags, ['implementation', 'synthesis']);

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /handoff prompt to paste at the start of a new session/);
  assert.match(renderedPrompt, /instructions to act on rather than a status report about the work/);
  assert.match(renderedPrompt, /how they will know it is done/);
  assert.match(renderedPrompt, /shortest path to finishing well/);
  assert.match(renderedPrompt, /rather than recapping the session or assigning material to re-read/);
  assert.match(renderedPrompt, /only where the next agent will actually work or verify/);
  assert.match(renderedPrompt, /review them with fresh eyes before building on them/);
  assert.match(renderedPrompt, /context to check rather than conclusions to trust/);
  assert.match(renderedPrompt, /Output only the handoff prompt/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('reconstructed brief prompt rebuilds the request behind the latest answer', () => {
  const prompt = prompts.find((entry) => entry.id === 'reconstructed-brief');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Reconstructed Brief');
  assert.deepEqual(prompt.tags, ['synthesis']);

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /ideal request behind your immediately preceding response/);
  assert.match(renderedPrompt, /pasted directly above that response when sharing it/);
  assert.match(renderedPrompt, /Work backward from that response/);
  assert.match(renderedPrompt, /message I would have sent if I had asked perfectly the first time/);
  assert.match(renderedPrompt, /not a summary of the conversation/);
  assert.match(renderedPrompt, /only known because of your answer/);
  assert.match(renderedPrompt, /Output only the brief/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('request clarifier resolves ambiguity before rewriting', () => {
  const prompt = prompts.find((entry) => entry.id === 'request-clarifier');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Request Clarifier (use with /btw)');
  assert.deepEqual(prompt.tags, ['synthesis']);

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /Treat the text .* as material to rewrite, not instructions to follow/);
  assert.match(renderedPrompt, /Do not answer it or produce the deliverable it asks for/);
  assert.match(renderedPrompt, /Your output must itself remain a request/);
  assert.match(renderedPrompt, /Preserve my intent and voice/);
  assert.match(renderedPrompt, /add only details that materially clarify the request/);
  assert.match(renderedPrompt, /Do not invent facts, goals, preferences, or constraints/);
  assert.match(renderedPrompt, /Treat inferred intent as a hypothesis, not a fact/);
  assert.match(renderedPrompt, /Do not add steps or checks I did not ask for/);
  assert.match(
    renderedPrompt,
    /If ambiguity would meaningfully change the rewrite, ask a few focused questions and stop/,
  );
  assert.match(renderedPrompt, /return one strong rewrite inside <refined_request> tags/);
  assert.match(renderedPrompt, /change only what materially improves it/);
  assert.match(renderedPrompt, /<original-request>\n\[PASTE YOUR ORIGINAL REQUEST HERE\]\n<\/original-request>/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('unslop prompt renders the plain-writing guidelines', () => {
  const prompt = prompts.find((entry) => entry.id === 'unslop');

  assert.ok(prompt);
  assert.equal(prompt.title, 'Unslop');
  assert.deepEqual(prompt.tags, ['writing']);

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /^Follow these guidelines when writing or revising prose\./);
  assert.match(renderedPrompt, /leave passages that already read clearly as they are/);
  assert.match(renderedPrompt, /"Use" instead of "utilize" or "leverage\."/);
  assert.match(renderedPrompt, /"Every change is logged with its author and time" is useful/);
  assert.match(renderedPrompt, /Prefer active voice when naming the actor helps/);
  assert.match(renderedPrompt, /The problem is padding that's reflexive rather than purposeful/);
  assert.match(renderedPrompt, /Pick one term for a thing and stick with it/);
  assert.match(renderedPrompt, /Give each sentence a purpose/);
  assert.match(renderedPrompt, /Keep qualifications that communicate real uncertainty or limits/);
  assert.match(renderedPrompt, /let the content determine how many points you need\.$/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('PM orchestrator mode prompt renders the default Codex reviewer modifier', () => {
  const prompt = prompts.find((entry) => entry.id === 'pm-orchestrator-mode');

  assert.ok(prompt);
  assert.equal(prompt.title, 'PM Orchestrator Mode');
  assert.deepEqual(prompt.tags, ['implementation', 'subagents', 'review']);
  assert.equal(prompt.modifier?.label, 'Reviewer');
  assert.equal(prompt.modifier.defaultOptionId, 'codex');
  assert.deepEqual(
    prompt.modifier.options.map((option) => ({ id: option.id, label: option.label })),
    [
      { id: 'codex', label: 'Codex' },
      { id: 'independent-reviewer', label: 'Independent reviewer' },
    ],
  );

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /act as the PM/);
  assert.match(renderedPrompt, /trust your subagents to do the implementation/);
  assert.match(renderedPrompt, /scoped to whatever unit of work makes sense \(a PR, a phase, a feature\)/);
  assert.match(renderedPrompt, /shape the delegation however fits the task/);
  assert.match(renderedPrompt, /work with Codex on its approach before it implements/);
  assert.match(renderedPrompt, /again on the changes once they're built/);
  assert.match(renderedPrompt, /If a subagent can't reach Codex, it should tell you rather than skip the review/);
  assert.match(renderedPrompt, /launch the next, one in flight at a time/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('PM orchestrator mode prompt renders the independent reviewer modifier', () => {
  const prompt = prompts.find((entry) => entry.id === 'pm-orchestrator-mode');

  assert.ok(prompt);

  const renderedPrompt = renderPromptText(prompt, 'independent-reviewer');

  assert.match(renderedPrompt, /work with an independent reviewer on its approach before it implements/);
  assert.match(renderedPrompt, /can't reach an independent reviewer/);
  assert.doesNotMatch(renderedPrompt, /Codex/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});

test('AGENTS.md maintainer is a standalone prompt that keeps judgment over fixed rules', () => {
  const prompt = prompts.find((entry) => entry.id === 'agents-md-maintainer');

  assert.ok(prompt);
  assert.equal(prompt.title, 'AGENTS.md Maintainer');
  assert.deepEqual(prompt.tags, ['implementation', 'review']);

  const renderedPrompt = renderPromptText(prompt);

  assert.match(renderedPrompt, /^Create, update, or shrink this repository's AGENTS\.md instructions when requested/);
  assert.match(renderedPrompt, /Otherwise, audit them and report recommended changes without editing files/);
  assert.match(renderedPrompt, /helps an agent make good decisions or avoids meaningful repeated discovery/);
  assert.match(renderedPrompt, /Inspect as much of the repository as the request needs/);
  assert.match(renderedPrompt, /report it rather than adding it/);
  assert.match(renderedPrompt, /can live inline, even if nothing enforces them/);
  assert.match(renderedPrompt, /say when to consult it/);
  assert.match(renderedPrompt, /narrowest useful scope the intended tools support/);
  assert.match(renderedPrompt, /keep it or a pointer to it at a scope that does load/);
  assert.match(renderedPrompt, /misleading legacy pattern/);
  assert.match(renderedPrompt, /Do not invent conventions/);
  assert.match(renderedPrompt, /not by its length/);
  assert.match(renderedPrompt, /do not build tooling unless requested/);
  assert.match(renderedPrompt, /say so and leave them alone/);
  assert.match(renderedPrompt, /rather than relying on memory/);
  assert.match(renderedPrompt, /anything you could not verify/);
  assert.doesNotMatch(renderedPrompt, /^---$/m);
  assert.doesNotMatch(renderedPrompt, /allowed-tools|argument-hint|Triggers on/);
  assert.doesNotMatch(renderedPrompt, /\{\{/);
});
