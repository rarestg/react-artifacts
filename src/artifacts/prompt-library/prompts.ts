export type PromptTagId =
  | 'review'
  | 'implementation'
  | 'planning'
  | 'subagents'
  | 'risk'
  | 'architecture'
  | 'synthesis';

const promptTagColorIdValues = ['blue', 'green', 'amber', 'violet', 'red', 'cyan', 'pink', 'lime'] as const;

export type PromptTagColorId = (typeof promptTagColorIdValues)[number];

export type PromptTag = {
  id: PromptTagId;
  label: string;
  description: string;
  color: PromptTagColorId;
};

export type PromptEntry = {
  id: string;
  title: string;
  summary: string;
  tags: readonly PromptTagId[];
  context: string;
  prompt: string;
  modifier?: PromptModifier;
};

export type PromptModifierOption = {
  id: string;
  label: string;
  replacements: Readonly<Record<string, string>>;
};

export type PromptModifier = {
  label: string;
  defaultOptionId: string;
  options: readonly PromptModifierOption[];
};

export const promptTags = [
  {
    id: 'review',
    label: 'Review',
    description: 'Prompts used while assessing completed work, code feedback, risks, or proposed changes.',
    color: 'blue',
  },
  {
    id: 'implementation',
    label: 'Implementation',
    description: 'Prompts used while executing or changing implementation work.',
    color: 'green',
  },
  {
    id: 'planning',
    label: 'Planning',
    description: 'Prompts that create plans, milestones, execution docs, or handoffs before implementation.',
    color: 'amber',
  },
  {
    id: 'subagents',
    label: 'Subagents',
    description: 'Prompts that dispatch or coordinate a fresh subagent.',
    color: 'violet',
  },
  {
    id: 'risk',
    label: 'Risk',
    description: 'Prompts that examine residual risk, assumptions, constraints, and mitigation paths.',
    color: 'red',
  },
  {
    id: 'architecture',
    label: 'Architecture',
    description: 'Prompts that evaluate design cleanliness, maintainability, and larger structural alternatives.',
    color: 'cyan',
  },
  {
    id: 'synthesis',
    label: 'Synthesis',
    description: 'Prompts that compress source material into insights, implications, and actionable takeaways.',
    color: 'pink',
  },
] as const satisfies readonly PromptTag[];

const promptTagColorIds = new Set<PromptTagColorId>(promptTagColorIdValues);

const workflowTagIds = new Set<PromptTagId>(['review', 'implementation', 'planning']);

export const prompts = [
  {
    id: 'risk-challenging-discovery',
    title: 'Risk-Challenging Discovery',
    summary: 'Dispatch a fresh subagent to challenge residual-risk assumptions.',
    tags: ['review', 'subagents', 'risk'],
    context:
      'Use after an implementation or review signoff identifies residual risks and you want a fresh reviewer to test whether those risks can be reduced without unnecessary churn.',
    prompt: `Please dispatch a fresh subagent to do a first-principles review of the residual risks you identified.

Give them enough context to understand each risk deeply: where it lives, why it arose, what assumptions or constraints shaped the current implementation, and what fixes you currently think are plausible.
Make clear that those fixes are context, not conclusions.

Ask them to challenge the assumptions behind the risks and look for whether there is a cleaner way to eliminate or reduce them. They should distinguish real constraints from accidental ones, and consider both small targeted changes and larger design shifts.

They should not manufacture work. "No changes necessary," "the current architecture is already the right fit," or "a couple of small de-risking changes are enough" are all valid answers if the evidence supports them. The point is to weigh the opportunity honestly against complexity, churn, and risk.

After they report back, compare their findings with your own view and recommend the best path forward.`,
  },
  {
    id: 'proposal-review-subagent',
    title: 'Proposal Review Subagent',
    summary: 'Ask a fresh subagent to review or validate a proposal or written plan before acting on it.',
    tags: ['review', 'implementation', 'subagents', 'architecture'],
    context:
      'Use after an agent proposes a solution, design, or implementation plan, especially before implementation or when design tradeoffs are subtle.',
    modifier: {
      label: 'Source type',
      defaultOptionId: 'plan',
      options: [
        {
          id: 'plan',
          label: 'Plan',
          replacements: {
            reviewSubjectClause: 'the current plan before we act on it',
            contextOverview:
              'the goal, the issue that led here, the relevant code or architecture area, and why this direction was proposed',
            sourceInstruction:
              'If there is a written plan or document, point them to it; otherwise summarize the plan and assumptions clearly.',
            contextRoleStatement: 'the plan is context, not a conclusion',
            soundnessQuestion: 'this is the best path',
            changeOutcome: 'no change is needed',
            validOutcomeExamples: '"The plan is solid," "a smaller change is enough," and "no change is needed"',
            synthesisInstruction:
              "compare their view with yours. Synthesize the strongest overall path, not merely a choice between the original plan and the subagent's view.",
          },
        },
        {
          id: 'proposal',
          label: 'Proposal',
          replacements: {
            reviewSubjectClause: 'the current proposal before we act on it',
            contextOverview:
              'the goal, the issue that led here, the relevant code or architecture area, and why this direction was proposed',
            sourceInstruction: 'Summarize the proposal and assumptions clearly.',
            contextRoleStatement: 'the proposal is context, not a conclusion',
            soundnessQuestion: 'this is the best path',
            changeOutcome: 'no change is needed',
            validOutcomeExamples: '"The proposal is solid," "a smaller change is enough," and "no change is needed"',
            synthesisInstruction:
              "compare their view with yours. Synthesize the strongest overall path, not merely a choice between the original proposal and the subagent's view.",
          },
        },
        {
          id: 'multiple-proposals',
          label: 'Multiple proposals',
          replacements: {
            reviewSubjectClause: 'the current proposals before we act on them',
            contextOverview:
              'the goal, what led to these proposals, the relevant code or architecture areas they touch, and why these directions were proposed',
            sourceInstruction: 'Summarize the proposals and assumptions clearly.',
            contextRoleStatement: 'the proposals are context, not conclusions',
            soundnessQuestion: 'the proposed paths are sound independently or in combination',
            changeOutcome: 'no changes are needed',
            validOutcomeExamples:
              '"The proposals are solid," "some proposals should change," and "none of the proposals are needed"',
            synthesisInstruction:
              'compare their assessment with yours. Synthesize the strongest path forward, including combining, narrowing, changing, or rejecting proposals as warranted.',
          },
        },
      ],
    },
    prompt: `Please dispatch a fresh subagent to review {{reviewSubjectClause}}.

Give them enough context to understand {{contextOverview}}. {{sourceInstruction}} Make clear that {{contextRoleStatement}}.

Ask them to evaluate from first principles whether {{soundnessQuestion}}. They should extract the real intent, identify assumptions or inherited requirements, challenge whether any can be removed rather than satisfied, and look for failure modes, hidden coupling, simpler targeted fixes, unnecessary complexity, better long-term designs, or reasons {{changeOutcome}}.

They should not manufacture objections. {{validOutcomeExamples}} are valid answers if the evidence supports them.

After they report back, {{synthesisInstruction}}`,
  },
  {
    id: 'self-contained-execution-plan',
    title: 'Self-Contained Execution Plan',
    summary: 'Write a standalone implementation plan for a design, refactor, or architecture change.',
    tags: ['implementation', 'planning', 'architecture'],
    context:
      'Use after agreeing on a direction and before implementation, especially when another engineer or future session needs enough context to execute without the prior conversation.',
    prompt: `Please write a self-contained execution plan for the change we just discussed.

Include enough context for an engineer to understand the problem area without relying on this conversation: what prompted the work, the real goal, the relevant files or systems, the proposed direction, and why that direction is preferable. Distinguish confirmed decisions from provisional recommendations or open questions.

Cover the important implementation details, tradeoffs, risks, assumptions, and pitfalls that would be easy to miss. Include documentation or test updates when they matter.

For complex work, break the plan into independently verifiable milestones. Include concrete repo-relative paths, commands, expected observations, feasibility checks for major unknowns, and recovery notes for risky or hard-to-reverse steps when they matter.

Add a "What Done Looks Like" section that describes the expected end state in concrete terms.

Use the structure that best fits this work. Do not force a rigid template if another organization would be clearer.`,
  },
  {
    id: 'goal-statement-writer',
    title: 'Goal Statement Writer',
    summary: 'Distill a plan or recent change discussion into a concise objective and done condition.',
    tags: ['implementation', 'planning'],
    context:
      'Use after a plan has been written or a change has been discussed, when you want a short goal statement for an autonomous coding session.',
    prompt: `Please distill the plan or change we just discussed into a concise goal statement for an autonomous coding session.

The goal statement must be brief: under 3000 characters, ideally much shorter. It should name one objective and one stopping condition: what we are trying to accomplish and how we know the work is done.

Use the current conversation, any referenced plan document or file path, and the plan's "What Done Looks Like" section if one exists. Do not restate the whole plan. Distill the real objective, what to read first, important context, constraints, non-goals, risks, and verification signals an agent would need to execute autonomously.

Make the objective concrete: name the plan path or relevant files when useful, describe the user-visible or repo-visible outcome, and include required checks, tests, docs, review readiness, deployment steps, checkpointing, or short progress-log expectations only when they are truly part of done.

For the done condition, prefer observable criteria over feelings: implementation complete, relevant checks passing, docs updated when needed, no known regressions, and the work ready for rigorous senior-engineer review. It is fine to include a quality bar like being comfortable defending the implementation in review, but anchor it in concrete verification.

If the plan contains open questions or risky assumptions, include them as work to resolve before or during implementation. If the plan is too vague to define a safe stopping condition, say what is missing instead of inventing certainty.

Return only the goal statement unless I ask for explanation.`,
  },
  {
    id: 'fresh-session-handoff',
    title: 'Fresh Session Handoff',
    summary: 'Prepare a concise handoff for continuing work in a new session.',
    tags: ['implementation'],
    context:
      'Use before ending or transferring a work session, especially after meaningful exploration, debugging, design decisions, branch work, or environment setup.',
    prompt: `Please write a fresh-session handoff for a future agent who will continue this work with no prior conversation context.

Focus on the information that would materially shorten their ramp-up: the current goal and status, relevant files or modules, active branch or PR state, important decisions and why they were made, commands or setup details, verification already run, known risks, open questions, and the next sensible steps.

Prioritize hard-won context over a chronological transcript. Include concrete paths, names, commands, URLs, and dates when useful. Distinguish confirmed facts from assumptions or recommendations.

Keep it concise and scannable so it can be pasted at the start of a new session.`,
  },
  {
    id: 'founder-transcript-synthesis',
    title: 'Founder Transcript Synthesis',
    summary:
      'Extract actionable founder-oriented insight from a video, talk, interview, podcast, or lecture transcript.',
    tags: ['planning', 'synthesis'],
    context:
      'Use when you have a transcript from a video, talk, interview, podcast, or lecture and want concise strategic synthesis for a technically minded startup founder.',
    prompt: `Analyze the transcript I provide as source material from a video, talk, interview, podcast, or lecture.

Give me a deep but concise synthesis of what is presented. Write for a technically minded startup founder who is hungry for knowledge, opportunity, and better strategic judgment.

Focus on:

- The core thesis or worldview behind the material.
- The most important ideas, arguments, frameworks, or claims.
- Which insights are practically actionable, and what someone could do differently because of them.
- The non-obvious lessons that could change a person's trajectory, priorities, perspective, or way of thinking.
- Any assumptions, blind spots, incentives, or caveats that should temper the advice.
- The strongest opportunities, risks, or strategic implications for a technical founder.

Do not merely recap the transcript in order. Distill it. Separate signal from filler. Preserve nuance where it matters, and say when an idea is interesting but not clearly actionable.

Use whatever structure best fits the material, but keep the result concise enough to be useful.`,
  },
  {
    id: 'stacked-pr-review-orchestrator',
    title: 'Stacked PR Review Orchestrator',
    summary: 'Coordinate stacked PR review-comment triage, follow-up fixes, and durable replies.',
    tags: ['review', 'implementation', 'planning', 'subagents'],
    context:
      'Use when a stack of dependent pull requests has accumulated review comments across multiple PRs, and fixes should land in a new PR above the current stack rather than by amending older reviewed branches.',
    prompt: `Please dispatch a fresh subagent as the mini-PM for stacked PR review-comment cleanup.

The mini-PM must first read the installed GitHub review workflow skill at ~/.agents/skills/github-review-workflow/SKILL.md and its referenced SOP, then use its export scripts and durable reply queue.

Give the mini-PM the PR stack, current branch context, and top-of-stack branch if known. They own exporting review bundles for every PR, stack-aware triage, implementation coordination, follow-up PR creation, queued replies, review-file moves per SOP, and the final report.

Triage bottom to top. Treat lower-PR comments as potentially superseded by later changes: each may already be addressed, now live in another file or branch, be obsolete, be intentionally declined, or still identify a real issue at the current location. Do not assume a comment remains valid just because it was proposed when written.

Fan out triage to additional subagents only when stack size or comment volume justifies the coordination cost. For each comment, decide: already addressed, obsolete, will not take with rationale, or will fix.

For each still-valid comment, propose the best current-codebase fix. Before implementation, a fresh subagent must review the proposal with enough context to assess the original comment, current location, rationale, constraints, smaller alternatives, whether no change is justified, and relevant risks or tests.

Create durable reply-queue drafts as decisions are made. Implement only accepted fixes. Do not amend, rebase, force-push, or otherwise update older reviewed PR branches. All code fixes must land on a new branch and PR stacked above the current highest PR. Keep changes scoped to review resolution.

If implementation is delegated, avoid overlapping file edits, review diffs, run relevant checks, commit, push, and open the new top-of-stack PR according to the workflow.

After the follow-up PR exists, use the workflow's reply queue to post replies to the original comments, referencing the new PR for fixed comments. Leave outside-diff or nitpick items local-only unless the SOP says otherwise.

Return a concise report with the PR stack, comments reviewed, comments fixed, comments declined or obsolete, files changed, checks run, follow-up PR URL, and remaining risks.`,
  },
] as const satisfies readonly PromptEntry[];

const promptTokenPattern = /\{\{([A-Za-z][A-Za-z0-9]*)\}\}/g;

export function getPromptTag(id: PromptTagId): PromptTag {
  const tag = promptTags.find((item) => item.id === id);
  if (!tag) {
    throw new Error(`Unknown prompt tag: ${id}`);
  }
  return tag;
}

export function hasWorkflowTag(prompt: PromptEntry): boolean {
  return prompt.tags.some((tag) => workflowTagIds.has(tag));
}

export function getDefaultPromptModifierOptionId(prompt: PromptEntry): string | undefined {
  return prompt.modifier?.defaultOptionId;
}

export function renderPromptText(prompt: PromptEntry, optionId = prompt.modifier?.defaultOptionId): string {
  if (!prompt.modifier) {
    return prompt.prompt;
  }

  const option = prompt.modifier.options.find((item) => item.id === optionId);
  if (!option) {
    throw new Error(`Prompt "${prompt.id}" uses unknown modifier option: ${optionId}`);
  }

  return prompt.prompt.replace(promptTokenPattern, (token, name: string) => {
    const replacement = option.replacements[name];
    if (replacement === undefined) {
      throw new Error(`Prompt "${prompt.id}" modifier option "${option.id}" is missing replacement: ${token}`);
    }
    return replacement;
  });
}

export function validatePrompts(
  entries: readonly PromptEntry[] = prompts,
  tags: readonly PromptTag[] = promptTags,
): void {
  const ids = new Set<string>();
  const tagIds = new Set<PromptTagId>();

  for (const tag of tags) {
    if (tagIds.has(tag.id)) {
      throw new Error(`Duplicate prompt tag id: ${tag.id}`);
    }
    tagIds.add(tag.id);

    if (!promptTagColorIds.has(tag.color)) {
      throw new Error(`Prompt tag "${tag.id}" uses unknown tag color: ${tag.color}`);
    }
  }

  for (const entry of entries) {
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate prompt id: ${entry.id}`);
    }
    ids.add(entry.id);

    if (!hasWorkflowTag(entry)) {
      throw new Error(`Prompt "${entry.id}" must include at least one workflow tag`);
    }

    for (const tag of entry.tags) {
      if (!tagIds.has(tag)) {
        throw new Error(`Prompt "${entry.id}" uses unknown tag: ${tag}`);
      }
    }

    validatePromptTemplate(entry);
  }
}

function validatePromptTemplate(entry: PromptEntry): void {
  const tokenNames = getPromptTokenNames(entry.prompt);

  if (!entry.modifier) {
    if (tokenNames.length) {
      throw new Error(`Prompt "${entry.id}" has template tokens without a modifier`);
    }
    return;
  }

  if (!entry.modifier.label.trim()) {
    throw new Error(`Prompt "${entry.id}" modifier must have a label`);
  }

  if (!entry.modifier.options.length) {
    throw new Error(`Prompt "${entry.id}" modifier must have options`);
  }

  if (!tokenNames.length) {
    throw new Error(`Prompt "${entry.id}" modifier must render at least one template token`);
  }

  const optionIds = new Set<string>();
  for (const option of entry.modifier.options) {
    if (optionIds.has(option.id)) {
      throw new Error(`Prompt "${entry.id}" modifier has duplicate option id: ${option.id}`);
    }
    optionIds.add(option.id);

    if (!option.label.trim()) {
      throw new Error(`Prompt "${entry.id}" modifier option "${option.id}" must have a label`);
    }

    const replacementNames = new Set(Object.keys(option.replacements));
    for (const tokenName of tokenNames) {
      if (!replacementNames.has(tokenName)) {
        throw new Error(`Prompt "${entry.id}" modifier option "${option.id}" is missing replacement: ${tokenName}`);
      }
    }

    for (const replacementName of replacementNames) {
      if (!tokenNames.includes(replacementName)) {
        throw new Error(
          `Prompt "${entry.id}" modifier option "${option.id}" has unused replacement: ${replacementName}`,
        );
      }
    }

    const renderedPrompt = renderPromptText(entry, option.id);
    if (getPromptTokenNames(renderedPrompt).length) {
      throw new Error(`Prompt "${entry.id}" modifier option "${option.id}" renders unreplaced template tokens`);
    }
  }

  if (!optionIds.has(entry.modifier.defaultOptionId)) {
    throw new Error(`Prompt "${entry.id}" modifier uses unknown default option: ${entry.modifier.defaultOptionId}`);
  }
}

function getPromptTokenNames(prompt: string): string[] {
  const tokenNames = new Set<string>();

  for (const match of prompt.matchAll(promptTokenPattern)) {
    const tokenName = match[1];
    if (tokenName) tokenNames.add(tokenName);
  }

  return [...tokenNames];
}

validatePrompts();
