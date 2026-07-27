export type PromptTagId =
  | 'review'
  | 'implementation'
  | 'planning'
  | 'subagents'
  | 'risk'
  | 'architecture'
  | 'synthesis'
  | 'blog';

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
  numberInput?: PromptNumberInput;
  modifier?: PromptModifier;
  toggleModifier?: PromptToggleModifier;
};

export type PromptNumberInput = {
  token: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
};

export type PromptRenderOptions = {
  numberInputValue?: number;
  enabledToggleOptionIds?: readonly string[];
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

export type PromptToggleModifierOption = {
  id: string;
  label: string;
  defaultEnabled: boolean;
  replacement: string;
};

export type PromptToggleModifier = {
  label: string;
  token: string;
  emptyReplacement: string;
  options: readonly PromptToggleModifierOption[];
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
    description:
      'Prompts that combine, reconstruct, or distill source material into coherent briefs, insights, or directions.',
    color: 'pink',
  },
  {
    id: 'blog',
    label: 'Blog',
    description: 'Prompts that write, polish, or prepare prose for blog publishing.',
    color: 'lime',
  },
] as const satisfies readonly PromptTag[];

const promptTagColorIds = new Set<PromptTagColorId>(promptTagColorIdValues);

const workflowTagIds = new Set<PromptTagId>(['review', 'implementation', 'planning', 'blog', 'synthesis']);

export const prompts = [
  {
    id: 'proposal-review-subagent',
    title: 'Proposal Review Subagent',
    summary:
      'Ask a fresh subagent to review or validate a proposal, written plan, or identified residual risks before acting.',
    tags: ['review', 'implementation', 'subagents', 'architecture', 'risk'],
    context:
      'Use after an agent proposes a solution, design, or implementation plan, or identifies residual risks at signoff, especially before implementation or when design tradeoffs are subtle.',
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
        {
          id: 'residual-risks',
          label: 'Residual risks',
          replacements: {
            reviewSubjectClause: 'the residual risks identified in the current work',
            contextOverview:
              "the work's underlying goal and each risk in depth: where it lives, why it arose, what assumptions or constraints shaped the current implementation, and what fixes currently seem plausible",
            sourceInstruction:
              'If the risks are written up somewhere, point them to it; otherwise summarize each risk clearly.',
            contextRoleStatement: 'the plausible fixes are context, not conclusions',
            soundnessQuestion:
              'each risk stems from a real constraint or an accidental one, and whether it can be eliminated or reduced more cleanly',
            changeOutcome: 'the risks are acceptable as they stand',
            validOutcomeExamples:
              '"No changes necessary," "the current architecture is already the right fit," and "a couple of small de-risking changes are enough"',
            synthesisInstruction:
              'compare their findings with your own view and recommend the best path forward, weighing the opportunity honestly against complexity, churn, and risk.',
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
    id: 'minimal-code-review-team',
    title: 'Minimal Code Review Team',
    summary: 'Spawn focused subagents to simplify existing code without breaking correctness or readability.',
    tags: ['review', 'subagents', 'architecture'],
    context:
      'Use when a script, gist, one-off tool, or already-written implementation should be reviewed from multiple lenses for the smallest version that still works and stays understandable.',
    toggleModifier: {
      label: 'Lenses',
      token: 'enabledLenses',
      emptyReplacement: 'No lenses are selected. Ask me which review lenses to use before spawning subagents.',
      options: [
        {
          id: 'minimalism',
          label: 'YAGNI',
          defaultEnabled: true,
          replacement:
            'Minimalism/YAGNI: find code, abstractions, options, config, helpers, branches, files, or behavior that can be deleted, collapsed, or deferred. Prefer exact deletion/replacement suggestions and estimate net line reduction when obvious.',
        },
        {
          id: 'stdlib-native',
          label: 'Stdlib/native',
          defaultEnabled: true,
          replacement:
            'Stdlib/native/deps: find hand-rolled logic, new dependencies, wrappers, or glue that the standard library, native platform, shell, database, browser, or already-installed packages can replace. Name the replacement directly.',
        },
        {
          id: 'correctness-safety',
          label: 'Safety',
          defaultEnabled: true,
          replacement:
            'Correctness/safety: identify edge cases and guardrails that must survive simplification: trust-boundary validation, data-loss handling, security, filesystem/network failure, idempotency, ordering, encoding, and user-visible behavior.',
        },
        {
          id: 'readability',
          label: 'Readability',
          defaultEnabled: true,
          replacement:
            'Readability/maintainability: check whether shorter code would become obscure. Prefer boring names, direct control flow, clear boundaries, and the simplest shape another engineer can understand quickly.',
        },
        {
          id: 'checks',
          label: 'Checks',
          defaultEnabled: true,
          replacement:
            'Small checks: identify the smallest runnable check that proves the simplified code still works. Prefer one assert/demo/smoke command over a test framework unless the repo already has one and using it is cheaper.',
        },
      ],
    },
    prompt: `Please spawn a focused subagent review team for the already-written code I provide or reference.

If I have not provided a script path, gist, pasted code, or clear target, ask me for that before spawning anyone.

Shared goal for every subagent: make the code minimal, still correct, and still understandable. Prefer deletion, standard-library/native features, already-installed dependencies, fewer branches, fewer files, and simpler control flow. Do not sacrifice trust-boundary validation, data-loss handling, security, accessibility, or behavior I explicitly asked to keep.

Spawn one fresh subagent per enabled lens below. Give each subagent only the context needed for that lens, tell them they are reviewing only and must not edit files, and ask them to report uncertainty instead of guessing.

{{enabledLenses}}

Ask each subagent to return:
- Top findings only.
- File/line references when available.
- Exact suggested deletion, replacement, or simplification.
- Whether the change is safe now or needs verification.
- Net line/dependency reduction when obvious.

After they report back, synthesize one ranked action list. Deduplicate overlapping findings, call out disagreements between lenses, separate "safe now" from "verify first", and name the smallest final shape that still works and remains readable.`,
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
    tags: ['implementation', 'planning', 'synthesis'],
    context:
      'Use after a plan has been written or a change has been discussed, when you want a short goal statement for an autonomous coding session.',
    prompt: `Please distill the plan or change we just discussed into a concise goal statement for an autonomous coding session.

The goal statement must be brief: a few short paragraphs at most, ideally shorter. It should name one objective and one stopping condition: what we are trying to accomplish and how we know the work is done.

Use the current conversation, any referenced plan document or file path, and the plan's "What Done Looks Like" section if one exists. Do not restate the whole plan. Distill the real objective, what to read first, important context, constraints, non-goals, risks, and verification signals an agent would need to execute autonomously.

Make the objective concrete: name the plan path or relevant files when useful, describe the user-visible or repo-visible outcome, and include required checks, tests, docs, review readiness, deployment steps, checkpointing, or short progress-log expectations only when they are truly part of done.

For the done condition, prefer observable criteria over feelings: implementation complete, relevant checks passing, docs updated when needed, no known regressions, and the work ready for rigorous senior-engineer review. It is fine to include a quality bar like being comfortable defending the implementation in review, but anchor it in concrete verification.

If the plan contains open questions or risky assumptions, include them as work to resolve before or during implementation. If the plan is too vague to define a safe stopping condition, say what is missing instead of inventing certainty.

Return only the goal statement unless I ask for explanation.`,
  },
  {
    id: 'fresh-session-handoff',
    title: 'Fresh Session Handoff',
    summary: 'Produce a paste-ready handoff prompt that briefs a fresh agent to continue the work.',
    tags: ['implementation', 'synthesis'],
    context:
      'Use before ending or transferring a work session, especially after meaningful exploration, debugging, design decisions, branch work, or environment setup.',
    prompt: `Please write a handoff prompt I can paste at the start of a new session so a fresh agent can continue this work with no prior conversation context.

Address it directly to that agent, as instructions to act on rather than a status report about the work: what we are trying to accomplish, where things stand, and what remains to finish, including how they will know it is done.

The next agent does not need everything you know; they need the shortest path to finishing well. Include the decisions, discoveries, and ruled-out paths that affect the remaining work, and the reasoning that prevents backtracking, rather than recapping the session or assigning material to re-read. Point to specific files, diffs, or commands only where the next agent will actually work or verify. Prefer exact paths, names, commands, and URLs over descriptions, and distinguish confirmed facts from assumptions.

If this session produced substantive changes, tell the next agent to review them with fresh eyes before building on them, treating those changes as context to check rather than conclusions to trust.

Keep it concise and scannable. Output only the handoff prompt.`,
  },
  {
    id: 'reconstructed-brief',
    title: 'Reconstructed Brief',
    summary: 'Reconstruct the precise request your latest answer addresses, as a standalone shareable brief.',
    tags: ['synthesis'],
    context:
      "Use when you want to share an agent's answer with someone and need the paste-ready request it actually answers, reconstructed from the full conversation rather than your last scattered message.",
    prompt: `Please reconstruct the ideal request behind your immediately preceding response: a standalone user message, in my voice, that can be pasted directly above that response when sharing it.

Work backward from that response using the whole conversation. The message I sent immediately before that response may carry only a fragment of the real request; earlier messages may hold the background, constraints, decisions, and clarifications that shaped what you produced. Reconstruct the clearest, most precise request that response answers: not a copy of that message, and not a summary of the conversation.

Write it as the message I would have sent if I had asked perfectly the first time. Include the context a reader needs: relevant background, artifacts, paths, constraints, and decisions, but only what was established before your response. Do not include anything that is only known because of your answer, do not fold your conclusions into the request, and do not invent missing context.

Do not narrate the conversation, mention that my request was vague, include process chatter, or summarize the response itself.

Make it concise but sufficient for someone who has never seen this conversation. Output only the brief.`,
  },
  {
    id: 'request-clarifier',
    title: 'Request Clarifier (use with /btw)',
    summary: 'Clarify a loosely expressed request, then rewrite it as a strong paste-ready prompt.',
    tags: ['synthesis'],
    context:
      'Use when you know roughly what you want but need help uncovering important distinctions, resolving ambiguity, and expressing the request clearly before anyone acts on it.',
    prompt: `Help me elucidate and refine the request below.

Do not answer or carry out the request yet. First, think carefully about what I may actually be trying to accomplish, including useful possibilities, distinctions, or implications that I may not know how to express.

Treat these possibilities as hypotheses to check, not conclusions about my intent.

Let the nature of the request determine the shape of the improved prompt. It might be a technical task, a personal decision, research, writing, organization, communication, advice, or something else entirely. Do not impose a standard template or add requirements merely because they are usually helpful.

If anything important is ambiguous—or if different interpretations would lead to meaningfully different requests—ask me a small number of focused clarifying questions first, then wait for my response. Ask only questions that will genuinely help shape the request. Feel free to introduce options or considerations I may not have known to mention.

If the request is already clear enough, you may skip the questions.

If the original request is already effective, preserve it and make only changes that materially improve it.

Once you understand what I want, write the best version of the request for me: clear, natural, self-contained, and ready to copy and use. Preserve my actual intent, priorities, and voice while adding whatever specificity would make the request more effective. Do not invent preferences, restrictions, or goals that I did not express.

If there are genuinely different good ways to frame the request, briefly explain the distinction and offer alternatives. Otherwise, give me one strong final version rather than unnecessary variations.

Here is my original, loosely expressed request:

<original-request>
[PASTE YOUR ORIGINAL REQUEST HERE]
</original-request>`,
  },
  {
    id: 'session-to-blog-article-polisher',
    title: 'Session-To-Blog Article Polisher',
    summary: 'Turn a finished work session into a polished blog article with staged review.',
    tags: ['blog', 'subagents'],
    context:
      'Use at the end of a substantial work session when the conversation produced a useful lesson, resolved a tricky problem, or surfaced insight worth sharing as a down-to-earth blog article.',
    modifier: {
      label: 'Article type',
      defaultOptionId: 'technical',
      options: [
        {
          id: 'technical',
          label: 'Technical article',
          replacements: {
            articleTypeChecks: `For a technical article, run a reproducibility pass before review. For each diagnostic claim, make sure the article shows the command, log line, observed output, source text, or explicit inference that supports it. If the article relies on an inference, label it as an inference and name the observation it came from.

Avoid copy-paste-dangerous placeholder commands. If a command needs an app-specific PID, service label, bundle ID, account name, host, path, or other local value, either show how to discover that value first or use an obvious placeholder with a short note explaining how to replace it. Do not put ellipses inside a runnable command block unless the block is explicitly marked as illustrative and not directly runnable.

Separate what was observed in this session from what is generally true and from what is expected but unverified. If a fix requires a reboot, redeploy, migration, or other follow-up that was not tested, say that plainly.`,
            reviewerLenses: `- Technical accuracy, reproducibility, and whether diagnostic claims are backed by commands, observed output, or explicit inference.
- Command safety: placeholders, destructive commands, local paths, PIDs, service labels, and environment-specific values.
- Reader clarity for an explain-like-I'm-an-intern audience.
- Narrative structure, usefulness, and whether the piece has a real point.
- Aggressive concision: what can be cut, merged, or reduced to one sentence while preserving the useful lesson.`,
          },
        },
        {
          id: 'general',
          label: 'General article',
          replacements: {
            articleTypeChecks: `For a general article, keep the evidence and examples in the natural language of the session. Do not impose debugging, implementation, or process scaffolding unless it genuinely belongs to the reader-facing lesson. Ground the article in concrete moments from the session when they help, but avoid over-disclosing private context or turning one personal observation into universal advice.

Separate what happened, what you inferred, and what you now believe. Prefer modest, specific claims over broad life lessons. Cut generic self-help takeaways unless the session actually earned them.`,
            reviewerLenses: `- Specificity, honesty, and whether the piece avoids overgeneralizing from one experience.
- Reader clarity for an explain-like-I'm-an-intern audience without technical scaffolding that does not belong.
- Voice, privacy, and whether concrete details are useful rather than over-shared.
- Narrative structure, usefulness, and whether the piece has a real point.
- Aggressive concision: what can be cut, merged, or reduced to one sentence while preserving the useful lesson.`,
          },
        },
      ],
    },
    prompt: `Please turn the session we just finished into a polished Markdown blog article that I can publish or revise further.

Start by reflecting on the conversation as source material. Identify what was learned, solved, clarified, or usefully reframed. Extract the durable lesson for a reader; do not write a transcript recap. Separate confirmed facts from assumptions, unresolved questions, and opinions.

If the session does not contain a durable reader-facing lesson, say so and propose a shorter note, outline, or no article instead of inflating it into a post.

Write the article in Markdown. A working title or H1 is fine if it helps the article stand on its own.

Create the draft as a Markdown file. If a repo-specific blog or content directory is obvious, use it with a clear kebab-case filename. If the destination is not clear, ask me for the target path before writing files.

Write for a useful blog. Be short by default: produce the shortest article that preserves the durable lesson. Prefer one clear sentence over a paragraph when one sentence carries the idea. Prefer a short note, compact section, or list over a full essay when the material does not justify an essay. The tone should be humane, plain, and pleasant where appropriate: explain like I'm an intern, not explain like I'm five. Preserve my voice where the conversation gives you enough signal. Do not ornament ordinary engineering work, dramatize the stakes, "Shakespeare-ify" the prose, or add literary scene-setting unless it adds concrete reader value. Avoid hype, filler, throat-clearing, buzzwords, generic lessons, clever hooks for their own sake, and anything that sounds like a content-marketing recap.

Do not invent stakes, examples, quotes, certainty, or takeaways that the session does not support.

{{articleTypeChecks}}

Before considering the draft done, run a compression pass. Delete or merge any paragraph that does not add a concrete fact, decision, tradeoff, example, consequence, caveat, or useful reader move. If a paragraph's point can be made in one sentence, make it one sentence.

After the initial draft exists, decide whether the session has enough substance to justify delegated review. For a small or low-stakes session, do a lighter self-review and explain why. For a substantial session, dispatch 2-4 fresh subagents in parallel with the draft and the relevant session context. Give each reviewer an orthogonal lens, such as:

{{reviewerLenses}}

Wait for all reviewer feedback. Synthesize the feedback into a concrete change proposal. Distinguish edits you will take from edits you will decline, and explain the tradeoff when it matters. Before applying those changes, dispatch one final fresh subagent to review the proposed edits against the draft and the original goal. Ask that subagent for precise edit guidance rather than direct edits so the final voice stays coherent.

Review the final draft yourself after the final subagent returns. Make any last touchups needed for accuracy, clarity, pacing, and publishability. Return a concise report with the draft path, the reviewers used or why review was skipped, the main changes made, and remaining caveats.`,
  },
  {
    id: 'article-frontmatter-generator',
    title: 'Article Frontmatter Generator',
    summary: 'Generate strict YAML frontmatter after carefully reading a finished Markdown article.',
    tags: ['blog'],
    context:
      'Use after a blog article draft is written and polished, when you want a fresh agent or later session to derive publication metadata from the article itself.',
    prompt: `Please generate publication frontmatter for the Markdown article I provide.

First read the finished article carefully. If I have not provided an article path or pasted article text, ask me for it before doing anything else. Base the metadata on the final article, not on prior conversation context unless that context is explicitly present in the article.

Return only YAML frontmatter and leave the article text unchanged. If the article already has frontmatter, produce the replacement frontmatter block only unless I explicitly ask you to modify the file.

Use this exact shape:

---
title: ""
summary: ""
published_at: "YYYY-MM-DDTHH:mm:ss±HH:MM"
timezone: ""
tags: []
keywords: []
entities:
  - name: ""
    type: ""
semantic_triples:
  - subject: ""
    predicate: ""
    object: ""
---

Use the current local date and time reported by the system clock for published_at, including the correct UTC offset for that date, and use the system's configured IANA timezone name for timezone. Write the summary after reading the whole article. Choose tags, keywords, entities, and semantic triples from the finished piece, not from everything that happened around it.

Keep the summary specific and useful, not promotional. Use the article H1 or title unless it is clearly a placeholder. Prefer a small, high-signal tag and keyword set over an exhaustive list. Entities should be concrete people, products, technologies, organizations, projects, concepts, or documents that matter to the article.

Semantic triples should capture only explicit, article-supported claims that would still be useful in a future knowledge graph. Each triple must express a real relationship, not a keyword pairing, title restatement, summary fragment, or vague theme. Use stable, specific subjects and objects, preferably entities or concrete concepts named in the article, with predicates as concise relationship phrases such as "depends on", "causes", "contrasts with", or "was chosen over". Do not infer facts from outside the article, do not turn opinions into facts, and do not generalize a one-off observation into a class-level fact. If the article only observed one app, one session, or one machine, scope the triple to that case. Before emitting a triple, check that it is supported, non-obvious, reusable, and more informative than a tag. Prefer 2-6 high-signal triples; fewer is better than noisy. If none pass that bar, use [].

Do not include placeholder entities or triples; use [] when none are warranted. Quote or escape YAML strings as needed.

Return only the frontmatter block unless I ask for explanation.`,
  },
  {
    id: 'founder-transcript-synthesis',
    title: 'Founder Transcript Synthesis',
    summary:
      'Extract actionable founder-oriented insight from a video, talk, interview, podcast, or lecture transcript.',
    tags: ['synthesis'],
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
    id: 'parallel-draft-synthesis',
    title: 'Parallel Draft Synthesis',
    summary: 'Generate independent drafts or options with parallel subagents, then synthesize the strongest result.',
    tags: ['planning', 'subagents', 'synthesis'],
    context:
      'Use when you want several independent attempts at a prose draft, UI mockup, strategy, plan, brainstorm, or other creative or analytical output before choosing or distilling a final direction.',
    numberInput: {
      token: 'draftCount',
      label: 'Options',
      defaultValue: 5,
      min: 2,
      max: 10,
      step: 1,
    },
    prompt: `Please orchestrate {{draftCount}} independent drafts, options, or mockups for the task we are working on, then synthesize the strongest path forward.

First clarify the actual goal, audience, constraints, source material, and success criteria from the current context. If something essential is missing, ask before dispatching subagents. Otherwise proceed.

Dispatch {{draftCount}} fresh subagents in parallel. Give each subagent the same core goal, relevant context, constraints, and definition of done. Make clear that the context is source material, not a conclusion they must preserve.

Choose the delegation shape that best fits the task:

- Use the same prompt for every subagent when independent attempts are more valuable than assigned roles.
- Use different lenses when diversity would improve the result, such as concise vs. expansive, conservative vs. bold, user-first vs. technical, visual layout alternatives, risk-first, narrative-first, or strategy-first.

Wait for all subagents to report back. Compare the outputs directly and use judgment to identify what is strongest, most interesting, most useful, or most fitting for the task. Favor the ideas and directions you would actually want to carry forward, whether that means choosing one standout approach, combining parts of several, or using the round to discover a better target.

Then decide the next step:

- If the user should inspect distinct variants before distillation, present the variants clearly and ask for a choice or direction.
- If the best synthesis is clear, produce the final distilled draft, recommendation, mockup direction, plan, or next-step proposal.
- If the first round is unsatisfactory but reveals a better target, optionally run one focused follow-up round with a narrower prompt before final synthesis.

Return the result in the structure that best fits the work. Keep the report concise: explain which subagent approaches were used, what survived synthesis, what was rejected, and any remaining assumptions or decisions needed.`,
  },
  {
    id: 'stacked-pr-comment-triage',
    title: 'Stacked PR Comment Triage',
    summary:
      'Triage review comments across a PR stack against the current top of stack, landing fixes in a new PR above it.',
    tags: ['review', 'implementation'],
    context:
      'Use when a stack of dependent pull requests has accumulated review comments across multiple PRs, and fixes should land in a new PR on top of the stack rather than by amending older reviewed branches.',
    prompt: `Please triage the review comments that have accumulated across this stack of dependent PRs, then land any fixes in a new PR on top of the stack.

Use the GitHub tooling available to you to identify the PRs in the stack, their order, and the top branch, and to collect the review comments from every PR. If you cannot determine the stack membership or its top branch reliably, ask me instead of guessing.

Work with the checkout pointed at the top of the stack so every comment is judged against the code as it exists now, not as it was when the comment was written.

Triage bottom to top. Treat lower-PR comments as potentially superseded by later changes: each one may already be addressed, apply to code that has since moved to another file or branch, be obsolete, be worth declining, or still identify a real issue at its current location. Do not assume a comment remains valid just because it was valid when written. For each comment, decide: already addressed, obsolete, decline with rationale, or fix.

For each comment worth fixing, implement the best fix against the current code, which is not necessarily the fix the comment originally suggested.

Do not amend, rebase, force-push, or otherwise rewrite older reviewed branches. All fixes land on a new branch created from the top branch, in a PR that uses the top branch as its base, scoped to review resolution. Run the relevant checks before opening it. If nothing needs fixing, do not open an empty follow-up PR.

Once the follow-up PR exists, or triage ends with nothing to fix, reply to each original comment with its outcome, linking the follow-up PR for fixed comments.

Return a concise report: comments already addressed, obsolete, declined, and fixed; files changed; checks run; and the follow-up PR URL or a note that none was needed.`,
  },
  {
    id: 'pm-orchestrator-mode',
    title: 'PM Orchestrator Mode',
    summary:
      'Act as the PM and hand each scoped chunk of work to a fresh subagent that reviews before and after, looping one at a time.',
    tags: ['implementation', 'subagents', 'review'],
    context:
      'Use when the work ahead splits into sensible chunks (PRs, phases, or features) and you would rather orchestrate the build through subagents than implement it yourself.',
    modifier: {
      label: 'Reviewer',
      defaultOptionId: 'codex',
      options: [
        {
          id: 'codex',
          label: 'Codex',
          replacements: {
            reviewer: 'Codex',
          },
        },
        {
          id: 'independent-reviewer',
          label: 'Independent reviewer',
          replacements: {
            reviewer: 'an independent reviewer',
          },
        },
      ],
    },
    prompt: `Please step back from the keyboard and act as the PM on this work: orchestrate it rather than build it yourself, and trust your subagents to do the implementation. Hand each large-scoped chunk to a fresh subagent, scoped to whatever unit of work makes sense (a PR, a phase, a feature), but shape the delegation however fits the task. Ask each subagent to work with {{reviewer}} on its approach before it implements, and again on the changes once they're built. When a subagent reports back, review its work, give any feedback or follow-up, then launch the next, one in flight at a time.`,
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

export function getDefaultPromptToggleOptionIds(prompt: PromptEntry): string[] {
  return prompt.toggleModifier?.options.filter((option) => option.defaultEnabled).map((option) => option.id) ?? [];
}

export function normalizePromptNumberInputValue(value: number | undefined, input: PromptNumberInput): number {
  const fallback = input.defaultValue;
  const numericValue = value === undefined || !Number.isFinite(value) ? fallback : value;
  const step = input.step ?? 1;
  const steppedValue = Math.round((numericValue - input.min) / step) * step + input.min;

  return Math.min(input.max, Math.max(input.min, Math.trunc(steppedValue)));
}

export function renderPromptText(
  prompt: PromptEntry,
  optionId = prompt.modifier?.defaultOptionId,
  options: PromptRenderOptions = {},
): string {
  const numberInput = prompt.numberInput;
  const numberInputValue = numberInput
    ? normalizePromptNumberInputValue(options.numberInputValue, numberInput)
    : undefined;
  const modifierOption = prompt.modifier?.options.find((item) => item.id === optionId);
  const selectedToggleOptionIds = prompt.toggleModifier
    ? (options.enabledToggleOptionIds ?? getDefaultPromptToggleOptionIds(prompt))
    : undefined;

  if (prompt.modifier && !modifierOption) {
    throw new Error(`Prompt "${prompt.id}" uses unknown modifier option: ${optionId}`);
  }

  if (prompt.toggleModifier && selectedToggleOptionIds) {
    const knownOptionIds = new Set(prompt.toggleModifier.options.map((option) => option.id));
    for (const selectedOptionId of selectedToggleOptionIds) {
      if (!knownOptionIds.has(selectedOptionId)) {
        throw new Error(`Prompt "${prompt.id}" uses unknown toggle option: ${selectedOptionId}`);
      }
    }
  }

  const toggleReplacement =
    prompt.toggleModifier && selectedToggleOptionIds
      ? selectedToggleOptionIds.length
        ? (() => {
            const selectedOptionIdSet = new Set(selectedToggleOptionIds);
            return prompt.toggleModifier.options
              .filter((option) => selectedOptionIdSet.has(option.id))
              .map((option, index) => `${index + 1}. ${option.replacement}`)
              .join('\n');
          })()
        : prompt.toggleModifier.emptyReplacement
      : undefined;

  return prompt.prompt.replace(promptTokenPattern, (token, name: string) => {
    if (numberInput && name === numberInput.token) {
      return String(numberInputValue);
    }

    if (prompt.toggleModifier && name === prompt.toggleModifier.token) {
      return toggleReplacement ?? prompt.toggleModifier.emptyReplacement;
    }

    const replacement = modifierOption?.replacements[name];
    if (replacement !== undefined) {
      return replacement;
    }

    if (modifierOption) {
      throw new Error(`Prompt "${prompt.id}" modifier option "${modifierOption.id}" is missing replacement: ${token}`);
    }

    throw new Error(`Prompt "${prompt.id}" has unresolved template token: ${token}`);
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
  const numberInputTokenName = entry.numberInput?.token;
  const toggleTokenName = entry.toggleModifier?.token;
  const modifierTokenNames = tokenNames.filter(
    (tokenName) => tokenName !== numberInputTokenName && tokenName !== toggleTokenName,
  );
  const toggleTokenNames = tokenNames.filter((tokenName) => tokenName !== numberInputTokenName);

  if (entry.numberInput) {
    validatePromptNumberInput(entry, tokenNames);
  }

  if (entry.modifier && entry.toggleModifier) {
    throw new Error(`Prompt "${entry.id}" cannot use both modifier and toggleModifier`);
  }

  if (!entry.modifier && !entry.toggleModifier) {
    if (modifierTokenNames.length) {
      throw new Error(`Prompt "${entry.id}" has template tokens without a modifier`);
    }
    return;
  }

  if (entry.modifier) {
    validatePromptModifier(entry, modifierTokenNames);
    return;
  }

  if (entry.toggleModifier) {
    validatePromptToggleModifier(entry, toggleTokenNames);
  }
}

function validatePromptModifier(entry: PromptEntry, modifierTokenNames: readonly string[]): void {
  if (!entry.modifier) return;

  if (!entry.modifier.label.trim()) {
    throw new Error(`Prompt "${entry.id}" modifier must have a label`);
  }

  if (!entry.modifier.options.length) {
    throw new Error(`Prompt "${entry.id}" modifier must have options`);
  }

  if (!modifierTokenNames.length) {
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
    for (const tokenName of modifierTokenNames) {
      if (!replacementNames.has(tokenName)) {
        throw new Error(`Prompt "${entry.id}" modifier option "${option.id}" is missing replacement: ${tokenName}`);
      }
    }

    for (const replacementName of replacementNames) {
      if (!modifierTokenNames.includes(replacementName)) {
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

function validatePromptNumberInput(entry: PromptEntry, tokenNames: readonly string[]): void {
  const input = entry.numberInput;
  if (!input) return;

  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(input.token)) {
    throw new Error(`Prompt "${entry.id}" number input token is invalid: ${input.token}`);
  }

  if (!tokenNames.includes(input.token)) {
    throw new Error(`Prompt "${entry.id}" number input token is not used: ${input.token}`);
  }

  if (!input.label.trim()) {
    throw new Error(`Prompt "${entry.id}" number input must have a label`);
  }

  if (!Number.isInteger(input.min) || !Number.isInteger(input.max) || input.min > input.max) {
    throw new Error(`Prompt "${entry.id}" number input must have an integer min and max range`);
  }

  if (!Number.isInteger(input.defaultValue) || input.defaultValue < input.min || input.defaultValue > input.max) {
    throw new Error(`Prompt "${entry.id}" number input default must be inside the range`);
  }

  if (input.step !== undefined && (!Number.isInteger(input.step) || input.step <= 0)) {
    throw new Error(`Prompt "${entry.id}" number input step must be a positive integer`);
  }
}

function validatePromptToggleModifier(entry: PromptEntry, toggleTokenNames: readonly string[]): void {
  const toggleModifier = entry.toggleModifier;
  if (!toggleModifier) return;

  if (!toggleModifier.label.trim()) {
    throw new Error(`Prompt "${entry.id}" toggle modifier must have a label`);
  }

  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(toggleModifier.token)) {
    throw new Error(`Prompt "${entry.id}" toggle modifier uses invalid token: ${toggleModifier.token}`);
  }

  if (!toggleTokenNames.includes(toggleModifier.token) || toggleTokenNames.length !== 1) {
    throw new Error(`Prompt "${entry.id}" toggle modifier must render exactly one template token`);
  }

  if (!toggleModifier.emptyReplacement.trim()) {
    throw new Error(`Prompt "${entry.id}" toggle modifier must have emptyReplacement text`);
  }

  if (!toggleModifier.options.length) {
    throw new Error(`Prompt "${entry.id}" toggle modifier must have options`);
  }

  const optionIds = new Set<string>();
  for (const option of toggleModifier.options) {
    if (optionIds.has(option.id)) {
      throw new Error(`Prompt "${entry.id}" toggle modifier has duplicate option id: ${option.id}`);
    }
    optionIds.add(option.id);

    if (!option.label.trim()) {
      throw new Error(`Prompt "${entry.id}" toggle modifier option "${option.id}" must have a label`);
    }

    if (!option.replacement.trim()) {
      throw new Error(`Prompt "${entry.id}" toggle modifier option "${option.id}" must have replacement text`);
    }
  }

  const renderedPrompt = renderPromptText(entry);
  if (getPromptTokenNames(renderedPrompt).length) {
    throw new Error(`Prompt "${entry.id}" toggle modifier renders unreplaced template tokens`);
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
