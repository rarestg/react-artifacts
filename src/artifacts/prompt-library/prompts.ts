export type PromptTagId = 'review' | 'implementation' | 'subagents' | 'risk' | 'architecture';

export type PromptTag = {
  id: PromptTagId;
  label: string;
  description: string;
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
  },
  {
    id: 'implementation',
    label: 'Implementation',
    description: 'Prompts used while planning, executing, or changing implementation work.',
  },
  {
    id: 'subagents',
    label: 'Subagents',
    description: 'Prompts that dispatch or coordinate a fresh subagent.',
  },
  {
    id: 'risk',
    label: 'Risk',
    description: 'Prompts that examine residual risk, assumptions, constraints, and mitigation paths.',
  },
  {
    id: 'architecture',
    label: 'Architecture',
    description: 'Prompts that evaluate design cleanliness, maintainability, and larger structural alternatives.',
  },
] as const satisfies readonly PromptTag[];

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
    summary: 'Ask a fresh subagent to validate or improve a proposed solution.',
    tags: ['review', 'subagents', 'architecture'],
    context:
      'Use after an agent has assessed feedback and proposed a solution, especially when the design tradeoffs are subtle or a cleaner architecture may exist.',
    prompt: `Please dispatch a fresh subagent to review this issue and the solution you proposed.

Give them enough context to understand the original feedback or concern, the relevant code or architecture area, why the issue matters, the solution you currently recommend, and the tradeoffs, constraints, or assumptions behind that recommendation.
Make clear that your proposed solution is context, not a conclusion.

Ask them to investigate from first principles whether the proposal is sound. They should look for failure modes, hidden coupling, simpler targeted fixes, and any cleaner long-term design shift that would improve correctness, maintainability, or architecture.

They should not manufacture work. "The proposed solution is the right fit," "a smaller change is enough," and "no change is needed" are valid answers if the evidence supports them.

After they report back, compare their findings with your own view and recommend the best path forward.`,
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

export function validatePrompts(entries: readonly PromptEntry[] = prompts): void {
  const ids = new Set<string>();
  const tagIds = new Set<PromptTagId>(promptTags.map((tag) => tag.id));

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
