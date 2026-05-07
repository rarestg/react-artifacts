# React Doctor Triage And Cleanup Plan

> **For agentic workers:** Implement this plan in small, reviewable batches. Update checkbox statuses as work completes. Do not treat React Doctor warnings as mandatory edits; inspect the cited code first and only change code when the recommendation improves correctness, accessibility, performance, or long-term maintainability in this repo.

**Goal:** Triage the React Doctor v0.0.47 warnings from the 2026-05-06 full-codebase scan, fix the low-risk/high-signal issues, document false positives and intentional exceptions, and defer larger architectural work into focused follow-up tasks.

**Architecture:** This is a code-quality cleanup pass across a React 19 + Vite + TypeScript artifact viewer. Keep changes narrowly scoped. Do not mix broad component refactors, design changes, or artifact rewrites into the first cleanup PR.

**Tech Stack:** Vite, React 19.2, TypeScript, Tailwind CSS v4, Biome, Knip, Node test runner, React Doctor.

---

## Source Scan

Initial command:

```bash
npx -y react-doctor@latest .
```

React Doctor result:
- Version: `react-doctor v0.0.47`
- Score: `88 / 100`
- Summary: `45 warnings across 20/100 files`
- Diagnostics directory: `/tmp/react-doctor-340674e9-b03d-48d9-87ab-014c16008a21`

The diagnostics directory contained one text file per rule. If the `/tmp` directory is gone or line numbers have drifted, refresh before editing:

```bash
npx -y react-doctor@latest . --verbose
```

After making cleanup changes, run:

```bash
npx -y react-doctor@latest . --verbose --diff
npx -y react-doctor@latest . --verbose
npm run check
```

If a broad `npm run check` is too expensive during iteration, run targeted checks first, then finish with the full check before PR:

```bash
npx biome check <changed-files>
npm run typecheck
node --import tsx --test tests/<relevant-suite>.test.ts
```

## Triage Principles

React Doctor is useful signal, not an authority. Apply these rules while implementing this plan:

- Fix warnings that identify real accessibility, correctness, maintainability, or measurable performance problems.
- Skip warnings that would break existing behavior.
- Skip warnings caused by static-analysis limitations when the existing pattern is intentional and already documented in code.
- Defer broad refactors when they need design review, contract changes, or migration across shared primitives.
- Do not raise the TypeScript target/lib or baseline browser support as a side effect of a small cleanup.
- Keep artifact-local code local unless there is a clear reusable contract.
- Preserve current design philosophy: sharp minimal geometry, explicit focus states, stable control layout, tokenized artifact UI through `ArtifactThemeRoot`.

---

## Recommended First Cleanup PR

This first PR should address low-risk warnings with clear merit. It should not attempt to remove every React Doctor warning.

### Task 1: Add Explicit Label Association To Palette Lab Range Inputs

**Warning:**
- Rule: `jsx-a11y/label-has-associated-control`
- File: `src/artifacts/palette-lab/index.tsx`
- Original diagnostic line: around `682`

**Why this deserves fixing:**

`RangeControl` renders a native range input inside a wrapping `<label>` that includes visible text, so browser accessibility is likely already acceptable. However, the scanner reports the label itself. Make the label/control relationship explicit so the code is robust for accessibility tools and easier for static analysis to understand.

**Desired fix:**

In `RangeControl`, import/use `useId()`, connect the visible label to the input with `htmlFor`/`id`, and keep the display value outside the accessible name. Add `aria-label` only if React Doctor still cannot follow the explicit relationship.

Preferred shape:

```tsx
function RangeControl({ label, value, min, max, step, displayValue, onChange }: RangeControlProps) {
  const inputId = useId();
  const labelId = `${inputId}-label`;

  return (
    <label htmlFor={inputId} className="grid gap-2">
      <span className="flex items-baseline justify-between gap-3">
        <span id={labelId} className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {label}
        </span>
        <span className="font-mono text-[11px] text-[var(--text)]">{displayValue}</span>
      </span>
      <input
        id={inputId}
        type="range"
        aria-labelledby={labelId}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[var(--text)]"
      />
    </label>
  );
}
```

**Tests/checks:**
- Existing Palette Lab tests should still pass.
- Add a focused static/render assertion in `tests/palette-lab/ui.test.ts`, because that suite already checks Palette Lab accessibility markup.

### Task 2: Replace Default `[]` Props With Stable Module Constants

**Warnings:**
- Rule: `react-doctor/rerender-memo-with-default-value`
- Files:
  - `src/artifacts/sharp2/components/SearchInput.tsx`
  - `src/artifacts/prompt-library/index.tsx`

**Why this deserves fixing:**

Default parameter values like `results = []` or `indices = []` allocate a new array every render when the prop is omitted. That can defeat memoization and creates unnecessary references. This is low-risk to fix and improves component hygiene.

**Desired fixes:**

Create typed module-level constants close to the related types.

For `src/artifacts/sharp2/components/SearchInput.tsx`:

```tsx
const EMPTY_SEARCH_RESULTS: readonly SearchResult[] = [];

export function SearchInput({
  ariaLabel = 'Search',
  placeholder = 'Search...',
  results = EMPTY_SEARCH_RESULTS,
  ...
}: SearchInputProps) {
  ...
}
```

Confirm the prop type. If `results` is mutable today, prefer changing the prop type to `readonly SearchResult[]` if all call sites are read-only. Otherwise use `const EMPTY_SEARCH_RESULTS: SearchResult[] = [];` and do not mutate it.

For `src/artifacts/prompt-library/index.tsx`:

```tsx
const EMPTY_HIGHLIGHTED_TAG_IDS: readonly PromptTagId[] = [];
const EMPTY_HIGHLIGHT_INDICES: HighlightIndices = [];
```

Then:

```tsx
function PromptTags({
  prompt,
  highlightedTagIds = EMPTY_HIGHLIGHTED_TAG_IDS,
}: {
  prompt: PromptEntry;
  highlightedTagIds?: readonly PromptTagId[];
}) {
  ...
}

function HighlightedText({
  text,
  indices = EMPTY_HIGHLIGHT_INDICES,
}: {
  text: string;
  indices?: HighlightIndices;
}) {
  ...
}
```

If `HighlightIndices` is not readonly, either keep the constant typed as `HighlightIndices` and verify no code mutates it, or change `HighlightIndices` to a readonly type if that is locally safe.

**Tests/checks:**
- `node --import tsx --test tests/prompt-library/*.test.ts`
- `node --import tsx --test tests/sharp2/*.test.ts`
- `npm run typecheck`

### Task 3: Replace `find()` Inside Prompt Tag Matching Loop

**Warning:**
- Rule: `react-doctor/js-index-maps`
- File: `src/artifacts/prompt-library/index.tsx`
- Original diagnostic line: around `442`

**Why this deserves fixing:**

The current logic uses `result.prompt.tags.find(...)` inside a loop over search matches. The arrays are small, so this is not a real performance problem today, but replacing it with a `Set` is clearer: we are testing whether a matched value is one of the prompt's tag IDs.

**Current shape:**

```tsx
function getMatchedTagIds(result: PromptSearchResult): PromptTagId[] {
  const tagIds = new Set<PromptTagId>();

  for (const match of result.matches) {
    if (match.key !== 'tags') continue;

    const tagId =
      typeof match.refIndex === 'number'
        ? result.prompt.tags[match.refIndex]
        : result.prompt.tags.find((promptTagId) => promptTagId === match.value);

    if (tagId) {
      tagIds.add(tagId);
    }
  }

  return [...tagIds];
}
```

**Desired fix:**

Build a local set once. Preserve the `refIndex` fast path because it keeps Fuse match positions precise.

```tsx
function getMatchedTagIds(result: PromptSearchResult): PromptTagId[] {
  const tagIds = new Set<PromptTagId>();
  const promptTagIds = new Set(result.prompt.tags);

  for (const match of result.matches) {
    if (match.key !== 'tags') continue;

    const tagId =
      typeof match.refIndex === 'number'
        ? result.prompt.tags[match.refIndex]
        : promptTagIds.has(match.value as PromptTagId)
          ? (match.value as PromptTagId)
          : undefined;

    if (tagId) {
      tagIds.add(tagId);
    }
  }

  return [...tagIds];
}
```

Before using the cast above, check the type of `match.value`. If it is already compatible with `PromptTagId`, no cast is needed. If it is a broad string, the cast is acceptable only after the `Set` membership check.

**Tests/checks:**
- `node --import tsx --test tests/prompt-library/*.test.ts`
- Verify highlighted tags still render for matched tag searches.

### Task 4: Add Passive Options To Non-Canceling Touch Cleanup Listeners

**Warning:**
- Rule: `react-doctor/client-passive-event-listeners`
- File: `src/App.tsx`
- Original diagnostic lines: around `334` and `335`

**Why this deserves fixing:**

The `touchmove` listener must stay non-passive because it calls `preventDefault()`. The `touchend` listener uses `handleUp` and does not call `preventDefault()`, so it can safely be passive. `touchcancel` is not flagged in the original output, but it shares the same non-canceling cleanup handler and should use the same option for consistency.

**Desired fix:**

Keep `touchmove` as `{ passive: false }`; add passive options to the cleanup listeners:

```tsx
document.addEventListener('touchmove', handleMove, { passive: false });
document.addEventListener('touchend', handleUp, { passive: true });
document.addEventListener('touchcancel', handleUp, { passive: true });
```

The matching `removeEventListener(...)` calls can remain unchanged because listener removal matching depends on event type, callback, and capture flag, not the passive value.

**Tests/checks:**
- Manually smoke-test sidebar touch resizing if a touch-capable environment is available.
- At minimum, run `npm run typecheck` and React Doctor to confirm the passive-listener warning count changes as expected.

### Task 5: Optional ConversationTurn One-Pass Cleanup

**Warning:**
- Rule: `react-doctor/js-combine-iterations`
- File: `src/artifacts/sharp2/conversation/ConversationTurn.tsx`
- Original diagnostic line: around `28`

**Why this is optional:**

The current code is readable and the arrays are small. This is not high-signal enough to block the first cleanup PR. If touched opportunistically, use one clear pass and preserve the original index behavior.

**Current shape:**

```tsx
const filteredItems = items
  .map((item, originalIndex) => ({ item, originalIndex }))
  .filter(({ item }) => visibleTypes?.[getTurnItemVisibleType(item)] ?? true);
```

**Desired fix:**

Prefer a simple loop over a clever `reduce`, because this repo values clarity.

```tsx
const filteredItems: Array<{ item: TurnItem; originalIndex: number }> = [];

items.forEach((item, originalIndex) => {
  if (visibleTypes?.[getTurnItemVisibleType(item)] ?? true) {
    filteredItems.push({ item, originalIndex });
  }
});
```

If Biome prefers `for...of`, use `items.entries()`:

```tsx
const filteredItems: Array<{ item: TurnItem; originalIndex: number }> = [];

for (const [originalIndex, item] of items.entries()) {
  if (visibleTypes?.[getTurnItemVisibleType(item)] ?? true) {
    filteredItems.push({ item, originalIndex });
  }
}
```

**Tests/checks:**
- `node --import tsx --test tests/sharp2/*.test.ts`
- Verify toggling visible message types still keeps render-mode indices aligned.

### Task 6: Document Intentional Exceptions Near Code Only If Needed

Do not add comments everywhere. Add a short comment only when a warning is likely to be rediscovered and the existing code does not already explain the exception.

Possible candidates:
- `src/App.tsx` touch drag uses `{ passive: false }` intentionally because it calls `preventDefault()`.
- `src/components/ListboxSelect.tsx` already has comments and Biome ignores explaining the ARIA listbox pattern. No extra comment needed.

---

## Probably Leave Alone

These warnings are not good candidates for immediate code changes. Leave them alone unless new evidence appears.

### App Touchmove Passive Listener Warning

**Warning:**
- Rule: `react-doctor/client-passive-event-listeners`
- File: `src/App.tsx`
- Original diagnostic line: around `334`

**Why leave alone:**

The shell's sidebar resize touch handler calls `moveEvent.preventDefault()` during a custom drag gesture:

```tsx
const handleMove = (moveEvent: TouchEvent) => {
  if (moveEvent.touches.length !== 1) return;
  updateWidth(moveEvent.touches[0].clientX);
  moveEvent.preventDefault();
};

document.addEventListener('touchmove', handleMove, { passive: false });
```

Changing `touchmove` to `{ passive: true }` would silently ignore `preventDefault()` in modern browsers and would break the resize gesture by allowing page scrolling or browser gesture handling during the drag.

The adjacent `touchend`/`touchcancel` cleanup listeners are different: they do not call `preventDefault()` and should be handled in the first cleanup PR.

**Long-term note:**

If this code is revisited, consider Pointer Events (`pointerdown`/`pointermove`/`pointerup`) with pointer capture. That could unify mouse and touch resizing. But do not change this just to satisfy the warning.

### Numeric Conditional In App Canvas Size Copy UI

**Warning:**
- Rule: `react-doctor/rendering-conditional-render`
- File: `src/App.tsx`
- Original diagnostic line: around `571`

**Why leave alone:**

The rendered conditional is already boolean:

```tsx
{hasCanvasSize && (...)}
```

`hasCanvasSize` is computed as:

```tsx
const hasCanvasSize = canvasSize.width > 0 && canvasSize.height > 0;
```

This cannot render `0`. Treat this as a false positive.

### `useState` Updated But Never Read

**Warning:**
- Rule: `react-doctor/rerender-state-only-in-handlers`
- Files:
  - `src/artifacts/jsonl-structure-viewer/index.tsx`
  - `src/App.tsx`
  - `src/artifacts/message-unescaper/index.tsx`

**Why leave alone:**

The flagged state values are read through derived values, memoized calculations, controlled inputs, or rendered labels. Examples:

- `JsonlStructureViewer` `input` feeds debounced parsing, input stats, textarea value, and button handlers.
- `App` `canvasSize` and `rootFontSize` feed width/height labels and copy content.
- `MessageUnescaper` `mainContentWidth` feeds `canUseTwoColumnLayout` and the visible one-column/two-column layout state.

Replacing these with refs would be wrong because the UI must re-render when they change.

### PathList `indexOf()` Warning

**Warning:**
- Rule: `react-doctor/js-set-map-lookups`
- File: `src/artifacts/jsonl-structure-viewer/components/PathList.tsx`
- Original diagnostic line: around `48`

**Why leave alone:**

The code is string search, not array membership:

```tsx
const matchIndex = lowered.indexOf(loweredQuery, index);
```

A `Set` does not apply here. This is a static-analysis false positive.

### ListboxSelect Clickable `div` Warning

**Warning:**
- Rule: `jsx-a11y/click-events-have-key-events`
- File: `src/components/ListboxSelect.tsx`
- Original diagnostic line: around `202`

**Why leave alone:**

This is an intentional ARIA listbox pattern. Options use `role="option"` and are not independently tabbable. The parent listbox manages focus and keyboard interaction with `aria-activedescendant`. The code already documents this and has Biome ignores:

```tsx
// Options are not independently focusable...
// biome-ignore lint/a11y/useFocusableInteractive
// biome-ignore lint/a11y/useKeyWithClickEvents
<div role="option" ... />
```

Adding `tabIndex` or per-option key handlers would make the component less correct by splitting keyboard ownership.

### `toSorted()` Recommendation

**Warning:**
- Rule: `react-doctor/js-tosorted-immutable`
- File: `src/artifacts/palette-lab/index.tsx`
- Original diagnostic line: around `367`

**Why leave alone for now:**

The recommendation is directionally fine for an ES2023 codebase, but this repo's app TypeScript config currently uses:

```json
"target": "ES2022",
"lib": ["ES2022", "DOM", "DOM.Iterable"]
```

Using `array.toSorted()` would require raising the TypeScript lib to `ES2023` or adding a polyfill/ambient type. That is too broad for this cleanup. The existing code:

```tsx
const selectedKey = [...selectedIndexes].sort((a, b) => a - b).join(',');
```

is acceptable under the current target.

**Possible future cleanup:**

If the repo intentionally raises `lib` to `ES2023`, then replace immutable spread-sort patterns with `toSorted()` in one focused compatibility PR.

### Duplicate `StatusTag` Export

**Warning:**
- Rule: `knip/duplicates`
- File: `src/components/StatusTag.tsx`

**Why leave alone for now:**

`StatusTag` intentionally supports both named and default imports. Existing tests assert that contract:

```ts
test('StatusTag supports default and named imports', ...)
```

Call sites currently use both forms:
- Named import in `src/artifacts/sharp2/index.tsx`
- Default import in `src/artifacts/example-app/App.tsx`

Removing the default export would be a valid cleanup only if done as a small compatibility-breaking import normalization:

1. Change all call sites to named imports.
2. Update tests to assert named export only.
3. Remove `export default StatusTag`.
4. Run Knip and shared primitive tests.

Do not do this in the first React Doctor cleanup PR unless the team explicitly wants named-only exports for shared primitives.

### Giant Component Warnings

**Warning:**
- Rule: `react-doctor/no-giant-component`
- Files include:
  - `src/artifacts/palette-lab/index.tsx`
  - `src/artifacts/sharp2/index.tsx`
  - `src/artifacts/example-app/App.tsx`
  - `src/artifacts/jsonl-structure-viewer/index.tsx`
  - `src/App.tsx`
  - `src/artifacts/focus-compare/index.tsx`

**Why leave alone for now:**

The warning has merit as a maintainability signal, especially for artifact shells that have accumulated controls, render sections, and local helper state. But splitting a large component is architectural work, not a lint fix. It should be driven by ownership boundaries:

- Extract repeated or reusable UI only when the contract is stable.
- Keep artifact-specific pieces local.
- Avoid splitting merely to reduce line count if it makes data flow harder to follow.
- Preserve design and behavior while moving code.

The current cleanup should not introduce broad file churn just to satisfy a line-count heuristic.

### `prefer-useReducer` Warnings

**Warning:**
- Rule: `react-doctor/prefer-useReducer`
- Files include:
  - `src/artifacts/palette-lab/index.tsx`
  - `src/artifacts/sharp2/index.tsx`
  - `src/artifacts/example-app/App.tsx`
  - `src/App.tsx`
  - `src/artifacts/prompt-library/index.tsx`
  - `src/artifacts/focus-compare/index.tsx`
  - `src/artifacts/message-unescaper/index.tsx`

**Why leave alone for now:**

Many components have several independent pieces of UI state. A reducer helps when state transitions are coupled, when actions need invariants, or when many event handlers update related fields. It is not automatically better for independent controls.

Do not convert components to `useReducer` just because they have many `useState` calls. Consider a reducer only when:

- Two or more state fields must change together to preserve invariants.
- State transitions are easier to understand as named actions.
- Reset/load/apply flows currently duplicate state-setting logic.
- A future component split needs a single state object and dispatch contract.

For the first cleanup PR, leave these warnings as architecture backlog.

### Cascading `setState` Warnings

**Warning:**
- Rule: `react-doctor/no-cascading-set-state`
- Files:
  - `src/artifacts/sharp2/components/SearchInput.tsx`
  - `src/artifacts/jsonl-structure-viewer/index.tsx`
  - `src/components/ListboxSelect.tsx`

**Why leave alone for now:**

These effects synchronize UI state after open/close, search-result changes, or parsed tree changes. There may be room to simplify some of them, but the current warnings are not evidence of a bug.

Specific notes:

- `SearchInput` sets active result state based on dropdown visibility and result count. This is a local interaction-state sync.
- `ListboxSelect` sets active index when the listbox opens and resets it when closed. This is expected for managed listbox behavior.
- `JsonlStructureViewer` synchronizes selection and expanded-path records after the parsed tree changes. This is coupled state and would require careful behavior tests before refactoring.

Defer unless there is a concrete bug such as flicker, stale active option, broken keyboard navigation, or selection loss.

### Inline Render Function `renderInlineMarkdown()`

**Warning:**
- Rule: `react-doctor/no-render-in-render`
- File: `src/artifacts/sharp2/conversation/MessageCard.tsx`

**Why leave alone for now:**

The diagnostic points to calls to `renderInlineMarkdown(...)`, which is imported from `markdown.tsx`, not defined inline inside `MessageCard`. It returns arrays of React nodes for lightweight inline markdown tokens. This is closer to a rendering helper than an inline component definition.

Potential future improvement:

- If conversation rendering grows, extract paragraph/list/code rendering into named components such as `RenderedMessageContent`, `RenderedParagraph`, and `RenderedList`.
- Keep raw/literal rendering separate from markdown rendering.
- Add tests around markdown token output before refactoring.

Do not make this change just to satisfy the warning.

---

## Deferred Focused Follow-Ups

These items have merit but should be separate implementation plans or PRs.

### Follow-Up 1: React 19 `forwardRef` And Context API Migration

**Warning:**
- Rule: `react-doctor/no-react19-deprecated-apis`
- Files:
  - `src/components/CopyButton.tsx`
  - `src/components/Input.tsx`
  - `src/components/Button.tsx`
  - `src/components/ArtifactThemeRoot.tsx`
  - `src/components/Panel.tsx`
  - `src/artifacts/jsonl-structure-viewer/components/CopyButton.tsx`

**Why defer:**

This is real long-term cleanup, but it touches shared primitives and public component contracts. It should be done as a focused React 19 migration because refs are part of component API shape and mistakes can silently break focus management, imperative copy handles, and theme-guard DOM checks.

React 19 allows `ref` as a regular prop on function components. `forwardRef` remains supported, but is no longer required for new code. Moving shared primitives away from `forwardRef` should be deliberate, tested, and consistent.

Detailed implementation guidance lives in `docs/superpowers/plans/2026-05-06-react-19-ref-prop-migration-plan.md`. That plan covers the inventory command, regular `ref` prop typing patterns, `ArtifactThemeRoot`, `CopyButton` imperative handles, tests, rollout order, and stop conditions.

Keep this triage PR limited to documenting the deferral. Do not start the `forwardRef` migration here.

### Follow-Up 2: `StatusTag` Export Normalization

**Why defer:**

The duplicate export warning is valid only if the repo wants named-only shared primitive exports. Current tests intentionally allow both.

**Clean future approach:**

- [ ] Decide convention: shared primitives should use named exports only.
- [ ] Change default import call sites to named imports.
- [ ] Update tests to remove the default import contract.
- [ ] Remove `export default StatusTag`.
- [ ] Run `npm run knip`, shared primitive tests, and `npm run typecheck`.

This should be a tiny PR if the convention decision is already made.

### Follow-Up 3: Component Splitting For Large Artifacts

**Why defer:**

Line-count warnings identify possible maintenance pain, but the fix requires understanding each artifact's workflow and data flow.

**Clean future approach:**

Pick one large component at a time. Do not split all flagged components in one PR.

For each target:

- [ ] Identify stable visual sections and state ownership.
- [ ] Extract pure helper functions first if they are mixed into render code.
- [ ] Extract presentational subcomponents only when props are simple and names match domain concepts.
- [ ] Keep state near the owner unless multiple children need the same transition contract.
- [ ] Add tests around behavior before moving code.
- [ ] Verify light/dark theme and device preview behavior.

Good first candidates:

- `PaletteLab`: extract `PaletteControls`, `PaletteExportPanel`, and color-card list only if props remain manageable.
- `JsonlStructureViewer`: extract resize/debug controls and output panels only after preserving selection/expanded-path behavior with tests.
- `App`: extract shell control groups only if URL/theme/sidebar behavior remains easy to trace.

### Follow-Up 4: Reducer Refactors Where State Is Actually Coupled

**Why defer:**

Reducers are useful when transitions are coupled. They are noise when state values are independent controls.

**Clean future approach:**

For a candidate component:

- [ ] List state fields and mark which ones change together.
- [ ] Identify invariants that must always hold.
- [ ] Write action names before writing reducer code.
- [ ] Keep reducer local unless another component needs it.
- [ ] Avoid one giant reducer for unrelated settings.

Potential reducer candidates:

- `PaletteLab` generated settings if reset/randomize/apply operations grow.
- `JsonlStructureViewer` selection/expanded state after tree changes, but only with behavior tests.
- `App` sidebar drag state only if migrating to Pointer Events introduces more gesture state.

### Follow-Up 5: ES2023 `toSorted()` Adoption

**Why defer:**

Current app config targets `ES2022`. `toSorted()` needs `ES2023` library support or polyfill decisions.

**Clean future approach:**

- [ ] Decide browser/runtime baseline and TypeScript lib change.
- [ ] Update `tsconfig.app.json` intentionally.
- [ ] Search immutable sort patterns:

```bash
rg -n "\\[\\.\\.\\w+\\]\\.sort|\\.slice\\(\\)\\.sort" src tests
```

- [ ] Replace with `toSorted()` where supported.
- [ ] Run typecheck and browser smoke tests.

---

## Implementation Checklist For The First PR

- [ ] Refresh React Doctor diagnostics with `npx -y react-doctor@latest . --verbose`.
- [ ] Fix Palette Lab range input label association.
- [ ] Add stable empty array constants for SearchInput and prompt-library render helpers.
- [ ] Replace prompt-library tag `find()` inside loop with a local `Set`.
- [ ] Add passive options to non-canceling `touchend`/`touchcancel` cleanup listeners in `App`.
- [ ] Optional: combine `ConversationTurn` `map().filter()` into one pass if it stays low-churn.
- [ ] Run targeted tests:

```bash
node --import tsx --test tests/palette-lab/*.test.ts
node --import tsx --test tests/prompt-library/*.test.ts
node --import tsx --test tests/sharp2/*.test.ts
```

- [ ] Run full checks:

```bash
npm run check
npx -y react-doctor@latest . --verbose --diff
npx -y react-doctor@latest . --verbose
```

- [ ] Record whether React Doctor score/warning count improved.
- [ ] In the PR description, explicitly list the warnings intentionally left alone.

## Expected Outcome

The first PR should reduce several low-risk warnings without changing UI behavior or public component contracts. Some warnings should remain by design:

- The intentional non-passive `touchmove` listener in `App`.
- Numeric conditional false positive in `App`.
- `useState` false positives where state drives rendered derived values.
- String `indexOf()` false positive in `PathList`.
- Managed listbox option click warning.
- `toSorted()` until ES2023 support is intentional.
- `forwardRef` until the focused React 19 primitive migration.
- Large component and reducer architecture warnings until scoped refactor plans exist.

This is the best long-term path because it turns React Doctor into actionable maintenance signal without letting broad heuristics churn stable artifact code.
