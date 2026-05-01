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

Initial curated tags:

- `review`
- `subagents`
- `risk`
- `architecture`
- `implementation`

The tag list can be updated through repo changes as the library grows.

## Initial Prompt Content

Seed the library with two prompts from the design discussion:

1. **Risk-Challenging Discovery**
   - Use after an implementation/review signoff identifies residual risks.
   - The copied prompt asks the current agent to dispatch a fresh subagent for a first-principles review of the residual risks, with enough context to challenge assumptions and recommend the best path forward.

2. **Proposal Review Subagent**
   - Use after an agent has assessed feedback and proposed a solution, especially when the design tradeoffs may be subtle.
   - The copied prompt is refined from the provided draft. It asks the current agent to dispatch a fresh subagent, give them context on the issue and proposed solution, have them independently assess soundness, and invite a simpler or more maintainable alternative if the evidence supports one.

The long conversation example used to motivate the second prompt does not appear in the UI. It informs the prompt wording and context only.

## UI Design

Use a board-first interface inspired by note/sticky-note tools, adapted to the repo's sharp minimal design standard.

Default screen:

- Wrap the artifact in `ArtifactThemeRoot`.
- Compact header with artifact name, prompt count, and a visible `Cmd/Ctrl+K` search command.
- Tag filter row using stable checkbox-like chips.
- Prompt board as a responsive grid of prompt notes.
- Notes show title, summary, context preview, tags, and a stable copy action.
- Notes can be grouped under tag headings when useful, but filtering remains the primary organization mechanism.
- Empty state explains that no prompts match the active filters.

Prompt detail:

- Opening/selecting a note reveals the full prompt text without navigating away from the artifact.
- The full prompt view is an opaque bordered detail dialog. It includes title, summary, usage context, tags, literal prompt text, and a primary copy action.
- Selecting a command-palette result closes the palette and opens the same detail dialog.

Copy behavior:

- Copy buttons copy only the prompt body.
- Copy feedback must be stable and avoid layout shift.
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
- Results show highlighted title/summary and a highlighted snippet from `context` or `prompt`.
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

Use Fuse's inclusive `[start, end]` match indices when rendering highlights.

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
