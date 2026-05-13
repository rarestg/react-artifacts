# Sharp2 Conversation Rendering Execution Plan

## Context

`sharp2` is the repo-local reference showcase for sharp minimal artifact UI. Its conversation rendering example lives under
`src/artifacts/sharp2/conversation/` and is displayed from the "Conversation Rendering" section of
`src/artifacts/sharp2/index.tsx`.

The current conversation UI is functional, but it reads as cards inside cards:

- `ConversationTurn.tsx` renders each turn as a bordered surface with a bordered header and a padded body.
- Inside that body, `MessageCard.tsx`, `ToolCall.tsx`, and `TokenCounter.tsx` render as their own bordered cards.
- The result is visually heavier than the content needs, especially when thinking, tool calls, and token counters are
  enabled.

The real goal is not to remove structure. Conversation transcripts need strong boundaries, role recognition, and clear
message starts and ends. The goal is to make each turn feel like one transcript group with row-level items, rather than
a card that contains more cards.

This plan also addresses a UX issue with token counters. The data can include token counters after many messages, but
showing every counter clutters the transcript. The default visible token counter should be the end-of-turn counter.
Intermediate token counters should be an explicit detail mode for the per-message data the source may include.

## Inputs Reviewed

- Current sharp2 docs: `src/artifacts/sharp2/README.md`
- Current conversation files:
  - `src/artifacts/sharp2/conversation/ConversationTurn.tsx`
  - `src/artifacts/sharp2/conversation/MessageCard.tsx`
  - `src/artifacts/sharp2/conversation/ToolCall.tsx`
  - `src/artifacts/sharp2/conversation/TokenCounter.tsx`
  - `src/artifacts/sharp2/conversation/markdown.tsx`
  - `src/artifacts/sharp2/conversation/types.ts`
  - `src/artifacts/sharp2/fixtures.tsx`
  - `src/artifacts/sharp2/index.tsx`
- Existing tests:
  - `tests/sharp2/conversation.test.ts`
  - `tests/sharp2/boundary.test.ts`
- Design guidance:
  - `design/SHARP_MINIMAL_DESIGN.md`
  - `design/ARTIFACT_DESIGN_GUIDE.md`
  - `design/UI_IMPLEMENTATION_NOTES.md`
- Intern prototype extracted to:
  - `.tmp/sharp-ui-status-system-unzipped/components/Conversation.tsx`
  - `.tmp/sharp-ui-status-system-unzipped/components/ConversationVariantB.tsx`
- Real transcript `token_count` event samples with:
  - `payload.info.total_token_usage`
  - `payload.info.last_token_usage`
  - `payload.info.model_context_window`
  - `payload.rate_limits`

## Confirmed Decisions

1. Keep role-specific message identity.

   User, assistant, thinking, and tool-related rows should keep a strong left accent. The accent is useful for scanning,
   role recognition, and finding message boundaries. It also ties directly to the existing filter colors.

2. Remove the nested-card feel from turns.

   Turns should render as a compact group header plus one contiguous item stack. Items should be separated by single
   horizontal separators. Message rows should not each add a full outer border.

3. Preserve source and copy behavior.

   User-authored text and tool/source output must remain literal and copyable as source. Assistant and thinking content
   can render lightweight markdown, but copy actions should copy the original source string, not the rendered view.

4. Keep sharp2's renderer, do not copy the prototype renderer.

   `markdown.tsx` already has the better local contract: source splitting, inline markdown, default render modes, and an
   error boundary fallback. The prototype markdown renderer is useful as visual reference only.

5. Make token counters end-of-turn by default.

   When token counters are enabled, show only the final token counter for each turn unless the user explicitly enables
   intermediate token counters.

6. Split tools and token counters into summary/detail controls.

   Tool visibility should become a two-level control: show tool summary rows first, then optionally show tool input and
   output details. Token visibility should become a two-level control: show end-of-turn token counters first, then
   optionally show intermediate counters.

7. Keep tokenized sharp minimal styling.

   Do not copy raw prototype classes like `bg-paper`, `text-success`, `bg-info/5`, or inverted terminal colors. Use
   artifact tokens such as `var(--surface)`, `var(--surface-muted)`, `var(--border)`, semantic tokens, and category
   tokens.

8. Use the intern transcript viewer's flat token telemetry pattern.

   Prefer the compact "Conversation (Transcript Viewer)" context-window row over the more ceremonial telemetry block in
   the chat-view prototype. The row should tack onto the bottom of a turn as quiet footer telemetry, not render as a
   separate card.

## Provisional Recommendations And Open Questions

- Tool details should likely be collapsed by default when tool summaries are enabled. This matches the cleaner prototype
  transcript behavior and keeps long command output from dominating the first scan.
- The current `ToolCall` component owns its expanded state internally. That may need to become a prop such as
  `showDetails` or `detailsMode` so the toolbar can control whether details are shown globally.
- It is open whether a user can still expand one specific tool row when global tool details are off. A simple first pass
  can make global detail visibility authoritative. A richer pass can support per-row expansion later.
- Token counters can be derived in `ConversationTurn` without changing the data format. If the data model later exposes
  explicit counter scope metadata, prefer that over positional inference.
- The current "items" count in the turn header should probably count visible rows, not raw items, after token/tool
  filtering is applied. Confirm this in the implementation.

## Proposed Direction

Use the intern prototype's `ConversationVariantB.tsx` as the structural reference, not as source code to copy.

The useful pattern is:

- A turn is one transcript group.
- The turn has one compact header with turn number, timestamp, duration, and visible item count.
- The body is a row stack.
- Each row owns its role accent, compact metadata, content, and copy affordances.
- Tools are collapsed summary rows first, with details shown only when requested.
- Token counters are quiet telemetry rows, not full cards.

In sharp2 terms, that means:

- `ConversationTurn.tsx` should stop rendering `p-3 space-y-3` around separate item cards.
- `MessageCard.tsx` should become row-like: no full border around each message, but keep the left role border and header.
- `ToolCall.tsx` should become row-like and support summary-only rendering.
- `TokenCounter.tsx` should become a flatter telemetry row, while preserving its invalid-value handling and copy summary.
- `index.tsx` should replace the single tool/token filters with dependent summary/detail controls.

## Token Telemetry Shape

Real transcript token events look like:

- `payload.info.total_token_usage.input_tokens`
- `payload.info.total_token_usage.cached_input_tokens`
- `payload.info.total_token_usage.output_tokens`
- `payload.info.total_token_usage.reasoning_output_tokens`
- `payload.info.total_token_usage.total_tokens`
- `payload.info.last_token_usage.*`
- `payload.info.model_context_window`
- `payload.rate_limits.primary.used_percent`
- `payload.rate_limits.secondary.used_percent`

Confirmed interpretation:

- The compact `Context Window` row should represent context-window usage, not account rate-limit usage.
- Use `total_token_usage.total_tokens` as the visible `Used` value.
- Use `model_context_window` as the visible `Limit` value.
- Calculate the visible percentage from `total_tokens / model_context_window`.
- Use `total_token_usage.cached_input_tokens` for optional `Cached`.
- Treat `cached_input_tokens: 0` as a real provided value. Do not hide it with a truthy check if the design chooses to
  display cached counts whenever the field exists.
- Keep `input_tokens`, `output_tokens`, `reasoning_output_tokens`, `last_token_usage`, and `rate_limits` available for
  copy text or future detail views, but do not force them into the default footer row.
- Do not use `rate_limits.primary.used_percent` or `rate_limits.secondary.used_percent` as the context-window percent.

Suggested normalized view model:

```ts
type TokenUsageViewModel = {
  label?: string;
  used: number;
  limit: number;
  cached?: number;
  inputTokens?: number;
  outputTokens?: number;
  reasoningOutputTokens?: number;
  lastUsage?: {
    inputTokens?: number;
    cachedInputTokens?: number;
    outputTokens?: number;
    reasoningOutputTokens?: number;
    totalTokens?: number;
  };
  rateLimits?: unknown;
};
```

Keep the existing `used` / `limit` fixture shape working during the first implementation pass. Add optional fields such
as `cached` only when the UI uses them.

## Implementation Milestones

### Milestone 1 - Baseline And Feasibility

Purpose: confirm current tests and exact behavior before visual restructuring.

Run:

```bash
node --import tsx --test tests/sharp2/conversation.test.ts
```

Expected observation:

- Current conversation tests pass before edits.

Feasibility checks:

- Confirm `ConversationTurn` can derive token counter visibility from item positions without changing
  `fixtures.tsx`.
- Confirm `ToolCall` can accept a prop for detail visibility without breaking existing tests.

Recovery note:

- If existing tests fail before changes, record the failure and do not mix test repair with this UI work unless the
  failure is directly blocking the implementation.

### Milestone 2 - Derive Visible Turn Items

Purpose: centralize the transcript row filtering rules before changing visuals.

Update `src/artifacts/sharp2/conversation/ConversationTurn.tsx` and related types as needed.

Suggested state shape:

```ts
type ConversationDetailVisibility = {
  showToolSummaries: boolean;
  showToolDetails: boolean;
  showTokenCounters: boolean;
  showIntermediateTokenCounters: boolean;
};
```

Alternative: extend `VisibleTypes` if that remains simpler, but avoid overloading one boolean with both summary and
detail behavior. `showIntermediateTokenCounters` means "show all token counters, including the final end-of-turn
counter"; it is not a separate counter category.

Derivation rules:

- User and assistant rows follow the existing user/assistant visibility filters.
- Thinking rows follow the existing thinking visibility filter.
- Tool calls:
  - Hidden when tool summaries are off.
  - Summary row visible when tool summaries are on.
  - Input/output details visible only when tool details are on.
- Token counters:
  - Hidden when `showTokenCounters` is off.
  - If `showTokenCounters` is on and `showIntermediateTokenCounters` is off, show only the final token counter item in
    each turn.
  - If `showIntermediateTokenCounters` is on, show all token counter items, including the final end-of-turn counter.

Expected tests:

- Add coverage that enabling token counters without intermediate mode renders only one counter per turn.
- Add coverage that enabling intermediate mode renders all token counters.
- Add coverage that tool summaries can render without input/output detail text.
- Add coverage that the turn header visible item count follows visible rows after token counters collapse to one row.

Pitfall:

- Preserve original indexes for render-mode state and duplicate-key handling. Current tests cover this behavior.

### Milestone 3 - Convert Turn Body To A Transcript Stack

Purpose: remove the visible "card containing cards" structure.

Update `src/artifacts/sharp2/conversation/ConversationTurn.tsx`.

Target structure:

```tsx
<div className="border border-[var(--border)] bg-[var(--surface)]">
  <div className="... turn header ...">...</div>
  <div className="flex flex-col">
    {visibleItems.map((item) => (
      <div className="border-b border-[var(--border)] last:border-b-0">...</div>
    ))}
  </div>
</div>
```

Use one separator strategy. Prefer child row wrappers with `border-b last:border-b-0`, not a mix of `divide-y` plus
per-row borders.

Expected observation:

- A turn still has a clear header and boundary.
- The body reads as one transcript surface.
- Rows do not float inside a padded box.

Pitfall:

- Do not remove all boundaries. The user still wants message starts and ends to be easy to parse.
- Inner borders remain appropriate for genuine literal/code/detail blocks, such as assistant code fences and tool
  input/output `<pre>` sections. Avoid using inner borders to recreate message cards inside the turn body.

### Milestone 4 - Make Message Rows Flatter

Purpose: keep role accents and copy/render behavior while removing message-card outlines.

Update `src/artifacts/sharp2/conversation/MessageCard.tsx`.

Recommended visual changes:

- Replace outer `border border-[var(--border)] border-l-2` with row padding plus `border-l-2`.
- Keep the role label, timestamp, render-mode toggle, and `CopyButton`.
- Make the header part of the row, not a separate boxed header with its own full-width border unless the row needs it.
- Preserve `font-mono`, literal whitespace handling, and rendered markdown fallback.

Expected tests:

- Existing tests for default render modes, render toggle state, and copy source behavior should continue to pass.
- Add or adjust tests only if the public behavior changes.

Pitfall:

- Do not remove the render toggle from assistant/thinking messages.
- Do not make user content rendered by default.

### Milestone 5 - Make Tool Calls Summary-First

Purpose: let tool calls remain visible for execution flow without forcing large input/output blocks into the main scan.

Update `src/artifacts/sharp2/conversation/ToolCall.tsx`.

Recommended API:

```ts
export type ToolCallProps = {
  tool: string;
  input: string;
  output: string;
  timestamp?: string;
  status?: ToolCallStatus;
  showDetails?: boolean;
};
```

Behavior:

- Summary row always shows tool name, status, timestamp, and copy action when tool summaries are enabled.
- The summary copy action must have an explicit accessible label that matches what is copied. If it copies hidden
  input/output, label it like `Copy tool input and output`; if it copies only visible metadata, label it like
  `Copy tool summary`.
- Detail mode should keep separate input and output copy actions so users can copy only the source segment they need.
- Input/output sections render only when `showDetails` is true.
- Keep literal `<pre>` rendering for input and output.
- Keep status color tokenization and accessible expand/collapse affordances if row-level expansion remains.
- If global `showDetails` is authoritative, remove row click, chevron, and `aria-expanded` affordances entirely so the
  row does not look independently expandable.

Expected tests:

- A summary-only tool row should include the tool name and status.
- Summary-only mode should not include input/output content.
- Detail mode should include input/output content.
- The collapse/expand button must retain an accessible name if it remains interactive.

Pitfall:

- If global `showDetails` replaces local expansion entirely, update the existing collapse-button test accordingly rather
  than leaving stale assertions.
- Avoid a mixed state where the toolbar controls details but individual rows still look clickable or expandable.

### Milestone 6 - Flatten Token Counter Rows

Purpose: make token counters read as telemetry, not another card.

Update `src/artifacts/sharp2/conversation/TokenCounter.tsx`.

Keep:

- `getTokenUsageSummary` and its invalid-value behavior.
- Copying an exact pasteable summary.
- Monospace, tabular numeric formatting.

Change:

- Remove the full bordered card feel.
- Render as a compact footer-style row with a label, monospace meter, percentage, usage text, optional cached count, and
  copy button.
- Use the transcript viewer layout as the visual model:

  ```text
  Context Window
  [▮-------------------]
  5.6%
  Used: 450 / Limit: 8,096
  ```

  With cached input available:

  ```text
  Context Window
  [▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮----]
  80.3%
  Used: 6,500 / Limit: 8,096 | Cached: 1,200
  ```

- Use neutral or category styling for normal/low usage. Reserve warning and danger semantic colors for meaningful
  thresholds; do not use success green merely to mean "normal."
- The end-of-turn counter should visually tack onto the bottom of the turn stack as footer telemetry.
- Intermediate counters, when enabled, should use the same compact row pattern at their source positions.

Expected tests:

- Existing invalid limit and invalid usage tests must keep passing.
- Existing exact copy summary tests must keep passing.
- Add coverage that `cached` appears only when provided.
- Add coverage that the percent is calculated from `used / limit`, not from rate-limit fields.

Pitfall:

- Do not make invalid values look like valid zero usage.
- Avoid a meter that relies on color alone; keep text values visible.
- Do not gate `Cached` on truthiness; use explicit presence checks so `0` can render correctly when that is the intended
  display behavior.
- Do not copy the chat-view prototype's larger telemetry block; it takes more space and adds more ceremony than this
  transcript use case needs.
- Do not display account rate-limit percentages in the `Context Window` row unless a separate explicit rate-limit
  telemetry design is added later.

### Milestone 7 - Update Showcase Controls

Purpose: expose summary/detail controls without making the toolbar unstable.

Update `src/artifacts/sharp2/index.tsx`.

Recommended controls:

- Keep `FilterCheckbox` for message type filters.
- Replace the single `Tool Calls` checkbox with:
  - `Tools` or `Tool Summaries`
  - `Tool Details`, disabled unless summaries are enabled
- Replace the single `Token Counters` checkbox with:
  - `Token Counters`
  - `Intermediate Tokens`, disabled unless token counters are enabled

Control behavior:

- If a parent control is turned off, dependent detail controls should either disable or reset. Prefer disabling while
  preserving the user's choice if that pattern fits the rest of the UI.
- Disabled controls need to look disabled and explain why if the reason is not obvious.
- Keep control heights and label widths stable.

Expected tests:

- Existing boundary test that `FilterCheckbox` is used directly should continue to pass.
- Add test coverage only if new control behavior is testable without a browser.

Pitfall:

- Do not create new local `MessageTypeFilter` or `MessageTypeToggle` components. Existing tests assert that sharp2 uses
  shared `FilterCheckbox` directly.

### Milestone 8 - Visual Verification

Purpose: verify the structural change in the artifact viewer because this work is primarily visual and interaction
oriented.

Run:

```bash
npm run dev -- --host 0.0.0.0 --port 5174
```

If serving through the exe.dev proxy, set `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` as documented in the repo README and
exe.dev proxy docs.

Inspect:

- `/?artifact=sharp2`
- `/artifact/sharp2`

Check these states:

- Light and dark mode.
- Default filters.
- Thinking enabled.
- Tool summaries enabled with details off.
- Tool summaries enabled with details on.
- Token counters enabled with intermediate counters off.
- Token counters enabled with intermediate counters on.
- Long assistant markdown with code fences.
- Long user input with preserved whitespace.
- Long tool output.
- Invalid token values from tests or temporary fixture data.
- Narrow artifact/device preview widths.

Expected observation:

- Turns read as one transcript group, not nested card stacks.
- Message boundaries remain obvious through row separators and left accents.
- Tool and token detail controls do not cause layout jumps.
- Text does not overlap controls or overflow its row incoherently.
- Focus states remain visible and are not clipped.

### Milestone 9 - Documentation And Final Checks

Purpose: keep sharp2 docs aligned with the new demonstrated pattern.

Update documentation if the implementation changes meaningfully:

- `src/artifacts/sharp2/README.md`
  - Update the conversation examples section if component responsibilities change.
  - Preserve the note that conversation rendering is sharp2-local, not shared API.
- Consider adding a `design/UI_IMPLEMENTATION_NOTES.md` entry only if this produces a reusable recurring rule beyond
  sharp2, such as "turn transcript groups should use row stacks instead of nested cards."

Run focused checks:

```bash
node --import tsx --test tests/sharp2/conversation.test.ts
node --import tsx --test tests/sharp2/boundary.test.ts
npx biome check src/artifacts/sharp2 tests/sharp2
```

Before PR-level completion, run:

```bash
npm run check
```

Expected observation:

- Conversation tests pass.
- Boundary tests still pass.
- Biome reports no formatting or lint regressions.
- Full repo check passes before opening a PR.

## Tradeoffs

- Keeping a turn-level border preserves group scanability but still creates one outer surface. This is acceptable because
  the problem is nested boxed messages inside the turn, not the existence of turn grouping.
- Removing message borders makes the UI calmer, but it increases reliance on row separators and left accents. Test with
  long messages and hidden metadata states to ensure message boundaries remain clear.
- Global tool detail controls are simpler than per-tool expansion, but less flexible. Start global unless product needs
  row-level detail control.
- End-of-turn token counters are less detailed than intermediate counters, but they support the primary UX better. Keep
  intermediate counters available as an explicit diagnostic mode.

## Risks And Pitfalls

- Index-based render-mode state can break if filtered item indexes are changed. Preserve original item indexes when
  mapping rows.
- Token counter derivation based on "last token counter in turn" assumes the final counter is the end-of-turn summary.
  That matches current expectations but should be revisited if the data format later includes scope metadata.
- Tool rows can become too quiet if details are hidden and the summary lacks status or timestamp. Keep enough metadata
  visible for execution tracing.
- Copy buttons must copy source strings, not rendered markdown or visually transformed text.
- Markdown rendering must not render untrusted HTML.
- Avoid `divide-y` plus row borders together. Use one separator strategy.
- Verify light and dark mode if token, surface, status, or category colors change.

## What Done Looks Like

- Conversation turns read as transcript groups: one compact turn header and one contiguous stack of rows.
- User, assistant, thinking, and tool rows keep their left role accent and remain easy to scan.
- Message rows no longer look like standalone cards nested inside a turn card.
- Tool calls can be shown as summary rows without input/output details.
- Tool details can be enabled separately and still render literal input/output with copy behavior.
- Token counters default to one end-of-turn telemetry row per turn.
- Intermediate token counters remain available as an explicit detail mode.
- Source preservation, copy behavior, render defaults, filtering, and duplicate key/index behavior remain covered by tests.
- `node --import tsx --test tests/sharp2/conversation.test.ts` passes.
- `node --import tsx --test tests/sharp2/boundary.test.ts` passes.
- `npm run check` passes before PR handoff.
