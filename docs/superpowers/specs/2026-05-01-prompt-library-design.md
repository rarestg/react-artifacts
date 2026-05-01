# Prompt Library Artifact Design

Date: 2026-05-01

## Purpose

Build a curated prompt-reference artifact for recurring agentic development prompts. The artifact makes it easy to browse prompts by workflow-oriented tags, find prompts with fuzzy search, understand when to use them, and copy the exact prompt text quickly.

The prompt library is repo-managed. Adding or changing prompts happens through code changes in this repository and normal deployment, not through an in-app editor, localStorage, D1, or another database.

## Non-Goals

- No user-created prompts in the UI.
- No authentication, sync, database, Worker API, or Cloudflare binding changes.
- No prompt refinement state in the UI. Prompts are assumed to be refined before they enter the library.
- No markdown rendering of prompt bodies. Prompt text should remain literal and copyable.

## Artifact Structure

Create a new artifact folder at `src/artifacts/prompt-library/`.

Planned files:

- `index.tsx`: artifact UI and state wiring.
- `meta.ts`: shell metadata.
- `prompts.ts`: typed prompt entries and curated tag definitions.
- `search.ts`: Fuse options, search result helpers, snippet/highlight helpers.
- `PROMPT_REFINEMENT.md`: maintainer guidance for refining prompts before adding them.

`meta.ts` exports:

```ts
const meta = {
  name: 'Prompt Library',
  subtitle: 'Curated agentic development prompts',
  kind: 'app',
} as const;

export default meta;
```

This structure keeps prompt content separate from UI logic and keeps the search layer replaceable.

## Data Model

Prompt entries are static TypeScript data. Each entry includes:

- `id`: stable slug.
- `title`: short display name.
- `summary`: one-line description.
- `tags`: curated tag ids.
- `context`: short usage context explaining when and why to use the prompt.
- `prompt`: exact copyable prompt body.

Tags are a small curated set defined once in code. Workflow stage is represented as a tag rather than a separate category field. This keeps the taxonomy flat and prevents parallel grouping systems.

Initial curated tags, in display order:

| ID | Label | Description |
| --- | --- | --- |
| `review` | Review | Prompts used while assessing completed work, code feedback, risks, or proposed changes. |
| `implementation` | Implementation | Prompts used while planning, executing, or changing implementation work. |
| `subagents` | Subagents | Prompts that dispatch or coordinate a fresh subagent. |
| `risk` | Risk | Prompts that examine residual risk, assumptions, constraints, and mitigation paths. |
| `architecture` | Architecture | Prompts that evaluate design cleanliness, maintainability, and larger structural alternatives. |

Every prompt must have at least one high-level workflow tag such as `review` or `implementation`. Topical tags such as `subagents`, `risk`, and `architecture` are optional. This is a validation convention, not a separate category field.

Tag filters use AND semantics. Selecting `Review` and `Subagents` shows prompts that have both tags. Tag chips display label, selected state, and result count for the currently visible corpus.

The tag list can be updated through repo changes as the library grows.

## Initial Prompt Content

Seed the library with these two prompt entries:

```ts
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
] as const;
```

The long conversation example used to motivate the second prompt does not appear in the UI. It informs the prompt wording and context only.

## UI Design

Use a board-first interface inspired by note/sticky-note tools, adapted to the repo's sharp minimal design standard.

Default screen:

- Wrap the artifact in `ArtifactThemeRoot`.
- Compact header with artifact name, prompt count, and a visible `Cmd/Ctrl+K` search command.
- Tag filter row using stable checkbox-like chips.
- Prompt board as a responsive grid of prompt notes.
- Notes show title, summary, context preview, tags, and a stable copy action.
- V1 does not group notes under tag headings because prompts can have multiple tags and grouping would duplicate cards. Filtering remains the primary organization mechanism.
- Empty state explains that no prompts match the active filters.

Prompt detail:

- Opening/selecting a note reveals the full prompt text without navigating away from the artifact.
- The full prompt view is an opaque bordered detail dialog. It includes title, summary, usage context, tags, literal prompt text, and a primary copy action.
- Selecting a command-palette result closes the palette and opens the same detail dialog.
- Both the command palette and detail dialog must mount inside the `ArtifactThemeRoot` boundary so portals inherit artifact tokens.
- The detail dialog traps focus while open, closes with Escape and an explicit close button, sets initial focus to the dialog heading or copy button, returns focus to the invoking note/result on close, and contains prompt-body scrolling inside the dialog surface.

Copy behavior:

- Copy buttons copy only the prompt body.
- Copy feedback must be stable and avoid layout shift.
- Copy success and failure states are announced with `aria-live`. On failure, the feedback says the copy failed and leaves the prompt text selectable so the user can copy manually.
- Prefer existing shared copy patterns where they fit.

## Search And Command Palette

Add `fuse.js` and `cmdk`.

Responsibilities:

- Fuse handles fuzzy search, weighted ranking, match metadata, snippets, and highlighting.
- cmdk handles the command dialog, keyboard navigation, active item behavior, and dialog accessibility.
- Do not look for or add a third-party Fuse/cmdk wrapper.

Command behavior:

- `Cmd+K` on macOS and `Ctrl+K` elsewhere open the search palette.
- A visible search button in the header opens the same palette.
- The palette uses `Command.Dialog`.
- Use `shouldFilter={false}` so cmdk does not override Fuse ordering.
- Each `Command.Item` must use the stable prompt id as its `value`.
- Selecting a result opens/focuses the prompt in the board/detail view.
- The command palette does not add a direct-copy keyboard shortcut in v1. Selecting a result opens the prompt detail dialog, where the primary copy action is explicit.

Search behavior:

- Active tag filters narrow the prompt list first.
- Fuse searches the tag-filtered prompt list.
- Empty query in the palette shows all tag-filtered prompts in source order.
- Non-empty query shows ranked Fuse results.
- Results show highlighted title/summary and a highlighted snippet from the highest-priority matched field in this order: `summary`, `context`, `prompt`.
- If a result matches only tags, the result shows the matching tag chip as highlighted and uses the context preview as the snippet.
- Detail view highlights matches in title, summary, context, and prompt body when opened from an active search result.

Initial Fuse options:

```ts
{
  keys: [
    { name: 'title', weight: 2 },
    { name: 'tags', weight: 1.75 },
    { name: 'summary', weight: 1.5 },
    { name: 'context', weight: 1 },
    { name: 'prompt', weight: 1 },
  ],
  includeMatches: true,
  includeScore: true,
  ignoreLocation: true,
  findAllMatches: true,
  threshold: 0.35,
  minMatchCharLength: 2,
}
```

Use Fuse's inclusive `[start, end]` match indices when rendering highlights. Highlight rendering must preserve prompt whitespace with literal text nodes and `<mark>` wrappers only. Copy actions always use the raw `prompt` string, never rendered DOM text.

## Prompt Refinement Guide

Add `PROMPT_REFINEMENT.md` near the artifact. It is concise and practical. It helps decide whether a prompt is ready to enter the curated library.

The guide includes these checks:

- Is the prompt clear about who should do what?
- Is it generalizable beyond one conversation?
- Does it provide enough context without embedding stale specifics?
- Does it make room for "no change needed" when evidence supports that?
- Does it avoid forcing an output format that may not fit the task?
- Does it avoid unnecessary complexity or process ceremony?
- Does it distinguish context from conclusions?
- Does it optimize for honest assessment rather than manufactured work?

## Accessibility And Interaction Requirements

- Keyboard focus must be visible and not clipped.
- Tag filters must expose selected state through more than color.
- Copy buttons need accessible names and stable feedback.
- Command palette must close with Escape and support keyboard navigation through cmdk.
- Search highlights must not be the only indication of result relevance.
- Long prompt text must remain readable, scrollable within the detail dialog, and copyable.

## Responsive Behavior

The artifact runs inside a fixed-size device preview, not a real browser viewport. The layout should be container-conscious:

- The board grid adapts to available container width.
- Tag/filter controls wrap without shifting critical actions.
- Long titles, tags, and prompt text do not overflow controls.
- The command palette fits smaller preview sizes and keeps the input/results usable.

## Styling Direction

Follow `design/SHARP_MINIMAL_DESIGN.md` and `design/ARTIFACT_DESIGN_GUIDE.md`.

- Sharp, quiet, structured UI.
- Opaque surfaces, borders, spacing, and alignment for hierarchy.
- Avoid decorative gradients, blur, shadows, nested card clutter, and one-note palettes.
- Use tokenized colors through `ArtifactThemeRoot`.
- Cards are used only for individual prompt notes, with restrained radius and stable dimensions.
- Use lucide icons where familiar icons improve command clarity.

## Testing And Validation

Implementation includes focused tests for pure search/snippet/highlight helpers.

Manual validation covers:

- Search finds matches in title, tags, summary, context, and prompt body.
- Search highlights use correct inclusive Fuse ranges.
- Tag filtering uses exact curated tags and combines with search correctly.
- Copy buttons copy only the prompt body.
- Command palette opens from header button and keyboard shortcut, closes with Escape, and selects results with keyboard.
- Light and dark themes remain legible.
- Fixed preview sizes do not break the board or palette.

Run the repo's relevant checks before completion, at minimum lint/typecheck/build or `npm run check` if feasible.
