export type PromptTagId = 'review' | 'implementation' | 'subagents' | 'risk' | 'architecture';

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
    description: 'Prompts used while planning, executing, or changing implementation work.',
    color: 'green',
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
] as const satisfies readonly PromptTag[];

const promptTagColorIds = new Set<PromptTagColorId>(promptTagColorIdValues);

const workflowTagIds = new Set<PromptTagId>(['review', 'implementation']);

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
    prompt: `Please dispatch a fresh subagent to review the current proposal or plan before we act on it.

Give them enough context to understand the goal, the issue that led here, the relevant code or architecture area, and why this direction was proposed. If there is a written plan or document, point them to it; otherwise summarize the proposal and assumptions clearly. Make clear that the proposal or plan is context, not a conclusion.

Ask them to evaluate from first principles whether this is the best path. They should extract the real intent, identify assumptions or inherited requirements, challenge whether any can be removed rather than satisfied, and look for failure modes, hidden coupling, simpler targeted fixes, unnecessary complexity, better long-term designs, or reasons no change is needed.

They should not manufacture objections. "The proposal is solid," "a smaller change is enough," and "no change is needed" are valid answers if the evidence supports them.

After they report back, compare their view with yours. Synthesize the strongest overall path, not merely a choice between the original proposal and the subagent's view.`,
  },
  {
    id: 'self-contained-execution-plan',
    title: 'Self-Contained Execution Plan',
    summary: 'Write a standalone implementation plan for a design, refactor, or architecture change.',
    tags: ['implementation', 'architecture', 'risk'],
    context:
      'Use after agreeing on a direction and before implementation, especially when another engineer or future session needs enough context to execute without the prior conversation.',
    prompt: `Please write a self-contained execution plan for the change we just discussed.

Include enough context for an engineer to understand the problem area without relying on this conversation: what prompted the work, the real goal, the relevant files or systems, the proposed direction, and why that direction is preferable. Distinguish confirmed decisions from provisional recommendations or open questions.

Cover the important implementation details, tradeoffs, risks, assumptions, and pitfalls that would be easy to miss. Include documentation or test updates when they matter.

Add a "What Done Looks Like" section that describes the expected end state in concrete terms.

Use the structure that best fits this work. Do not force a rigid template if another organization would be clearer.`,
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
] as const satisfies readonly PromptEntry[];

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
  }
}

validatePrompts();
