# JSONL Viewer Container-First Responsive Plan (Handoff)

## 1) Problem & Motivation

### What we’re solving and why now
- The artifact viewer’s device preview is a fixed-size container, not the browser viewport.
- The JSONL Structure Viewer still uses viewport breakpoints (`sm:`, `lg:`, `xl:`), which causes mismatches in the iPhone/iPad preview.
- We already measure container width; we should measure panel widths too and use those values for responsive decisions.

### Success criteria / desired outcomes
- All layout decisions in the JSONL viewer respond to container/panel width, not viewport width.
- iPhone/iPad preview matches real layout intent (action groups stack deterministically at narrow widths).
- No regressions in resize-handle behavior (see `docs/resize-slack-debug.txt`).
- Responsive logic is centralized and easy to reason about.

## 2) System Context

### Relevant code
- `src/artifacts/jsonl-structure-viewer/index.tsx`
  - Drives overall layout, measures `containerWidth`, computes `visibleLayoutMode` and `headerStacked`.
  - Contains all remaining viewport breakpoints to remove.
- `src/artifacts/jsonl-structure-viewer/components/PathList.tsx`
  - Uses `sm:` for action group layout.
- `src/artifacts/jsonl-structure-viewer/lib/ui.ts`
  - Shared classes for header/action styling.
- `docs/resize-slack-debug.txt`
  - Describes fragile resize/expand behavior; avoid DOM structure changes around input/output cards.
- `design/UI_IMPLEMENTATION_NOTES.md`
  - Required by README for UI/layout changes; check for relevant guidance.
- `todos/artifact-styling-guidelines.md`
  - Container-first responsiveness guidelines; this work should conform to it.

### Connections to other subsystems
- Device preview in `src/App.tsx` renders artifacts inside a fixed-size container.
- No iframe mode yet; artifacts must be container-responsive to behave correctly in preview.

## 3) Implementation Plan (ordered)

### Step 0 — Preflight: docs + breakpoint inventory
**What**
- Read `design/UI_IMPLEMENTATION_NOTES.md` for any relevant patterns.
- Read `todos/artifact-styling-guidelines.md` to align with container-first rules.
- Inventory current viewport breakpoints:
  - Run: `rg "sm:|lg:|xl:" -n src/artifacts/jsonl-structure-viewer`

**Why**
- Ensures we don’t miss a breakpoint and we follow documented UI guidance.

---

### Step 1 — Add a panel-width measurement hook
**What**
- Add `useElementWidth` that uses `ResizeObserver` and returns width for a ref.
- Include:
  - `initialWidth` param (seed with container width or `window.innerWidth` on client).
  - A small `minDelta` (e.g., 8px) to avoid thrash on minor changes.
    - Only update if `Math.abs(nextWidth - prevWidth) >= minDelta`.
  - Optional rounding (e.g., `Math.round(width)`) for stability.
  - Guard `ResizeObserver` availability; no-op on SSR.

**Where**
- New file: `src/artifacts/jsonl-structure-viewer/hooks/useElementWidth.ts`.

**Why**
- Provides stable per-panel widths for container-first layout decisions.

---

### Step 2 — Measure panel widths and define thresholds in `index.tsx`
**What**
- Use `useElementWidth` for `inputPanelRef`, `pathPanelRef`, `outputPanelRef`.
- Define explicit constants (start with values that mirror Tailwind breakpoints, then adjust if needed):
  - `ACTION_GROUP_STACK_WIDTH = 640` (input/output header actions).
  - `PATH_ACTION_STACK_WIDTH = 640` (PathList header/action rows).
  - `INPUT_OPTIONS_TWO_COL_WIDTH = 640` (input options grid).
  - `CONTENT_PADDING_WIDE_WIDTH = 1024` (lg-equivalent).
  - `CONTENT_PADDING_XL_WIDTH = 1280` (xl-equivalent).
- Note: layout mode cutoffs already use 900/1140 (`TWO_COLUMN_MIN_WIDTH` / `THREE_COLUMN_MIN_WIDTH`).
  - It is acceptable for action groups to stack at 640 while layout is already two-column; treat as intentional, not a bug.
- Derive flags:
  - `isInputNarrow = inputPanelWidth > 0 && inputPanelWidth < ACTION_GROUP_STACK_WIDTH`
  - `isOutputNarrow = outputPanelWidth > 0 && outputPanelWidth < ACTION_GROUP_STACK_WIDTH`
  - `isPathNarrow = pathPanelWidth > 0 && pathPanelWidth < PATH_ACTION_STACK_WIDTH`
  - `isInputOptionsTwoCol = inputPanelWidth >= INPUT_OPTIONS_TWO_COL_WIDTH`
  - `isContentPaddingWide = containerWidth >= CONTENT_PADDING_WIDE_WIDTH`
  - `isContentPaddingXL = containerWidth >= CONTENT_PADDING_XL_WIDTH`

**Where**
- `src/artifacts/jsonl-structure-viewer/index.tsx` near existing layout flags.

**Why**
- Prevents reuse of `headerStacked` for panel-specific decisions.

**Dependencies**
- Requires Step 1.

---

### Step 3 — Make PathList responsive via prop
**What**
- Pass `isPathNarrow` into `PathList` as a prop.
- Use that prop to control action group layout classes.
  - Update `PathListProps` to include `isPathNarrow` (required).

**Where**
- `src/artifacts/jsonl-structure-viewer/index.tsx` (prop).
- `src/artifacts/jsonl-structure-viewer/components/PathList.tsx` (prop + class usage).

**Why**
- Keeps PathList responsive without adding another local observer.

---

### Step 4 — Replace all viewport breakpoints with container-driven classes
**Inventory (current occurrences and explicit replacements)**

1) `src/artifacts/jsonl-structure-viewer/index.tsx` (Input header actions)
   - Current: `basis-full sm:basis-auto`
   - Replace with: `isInputNarrow ? 'basis-full' : 'basis-auto'` (via helper).

2) `src/artifacts/jsonl-structure-viewer/index.tsx` (Input options grid)
   - Current: `grid grid-cols-1 ... sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`
   - Replace with: `grid-cols-1` + conditional `grid-cols-[minmax(0,1fr)_minmax(0,1fr)]` when `isInputOptionsTwoCol`.

3) `src/artifacts/jsonl-structure-viewer/index.tsx` (Path panel section)
   - Current: `lg:flex-[0.9]` (no-op in grid context)
   - Replace with: remove `lg:flex-[0.9]` entirely.

4) `src/artifacts/jsonl-structure-viewer/index.tsx` (Output panel section)
   - Current: `visibleLayoutMode === 'two-column' ? 'lg:self-stretch' : ''`
   - Replace with: remove the class entirely (grid items already stretch by default; `self-stretch` is redundant).

5) `src/artifacts/jsonl-structure-viewer/index.tsx` (Output header actions)
   - Current: `basis-full sm:basis-auto`
   - Replace with: `isOutputNarrow ? 'basis-full' : 'basis-auto'` (via helper).

6) `src/artifacts/jsonl-structure-viewer/index.tsx` (Content padding)
   - Current: `px-6 py-10 lg:px-8 xl:px-10`
   - Replace with: compute a single `paddingX` class so only one `px-*` is ever applied.
     - Example: `const paddingX = isContentPaddingXL ? 'px-10' : isContentPaddingWide ? 'px-8' : 'px-6';`
     - Use: ``className={`${paddingX} py-10`}``

7) `src/artifacts/jsonl-structure-viewer/index.tsx` (Panels grid - 3 column)
   - Current: `lg:grid-cols-[minmax(0,10fr)_minmax(0,9fr)_minmax(0,9fr)]`
   - Replace with: apply this class when `visibleLayoutMode === 'three-column'` (no `lg:`).

8) `src/artifacts/jsonl-structure-viewer/index.tsx` (Panels grid - 2 column)
   - Current: `lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]`
   - Replace with: apply when `visibleLayoutMode === 'two-column'` (no `lg:`).

9) `src/artifacts/jsonl-structure-viewer/index.tsx` (Panels grid alignment)
   - Current: `lg:items-start`
   - Replace with: apply `items-start` when `visibleLayoutMode !== 'one-column'`.

10) `src/artifacts/jsonl-structure-viewer/index.tsx` (Left column wrapper)
    - Current: `lg:self-start`
    - Replace with: `self-start` (the wrapper only exists in two-column layout).

11) `src/artifacts/jsonl-structure-viewer/components/PathList.tsx`
    - Current: `basis-full sm:basis-auto` on two action groups
    - Replace with: `isPathNarrow ? 'basis-full' : 'basis-auto'` (prop-driven).

**Why**
- Eliminates all viewport breakpoints inside the JSONL viewer; layout becomes container-first.

**Dependencies**
- Step 2 (flags) + Step 3 (prop) + optional helper in Step 5.

---

### Step 5 — Centralize action group class logic (run before Step 4 or refactor after)
**What**
- Add a helper in `src/artifacts/jsonl-structure-viewer/lib/ui.ts`:
  - e.g., `export const actionGroupClass = (isNarrow: boolean) => ...`
- Use it in `index.tsx` and `PathList.tsx` for consistent action group layout.

**Why**
- Keeps view code small and reduces drift.

---

### Step 6 — Validate resize-handle behavior and DOM order
**What**
- Ensure no DOM structure changes around:
  - `inputCardRef`, `outputCardRef`, and resizable elements.
- Keep `panelContentIsLast` assumptions intact to avoid scrollbar regressions.
  - Avoid inserting wrappers after the card bodies or making the card body no longer the last child.

**Where**
- `src/artifacts/jsonl-structure-viewer/index.tsx`

**Why**
- The resize/expand system is sensitive; this avoids reintroducing known bugs.

## 4) Key Decisions & Tradeoffs

### Decisions
- Use per-panel `ResizeObserver` measurements (accurate, container-first).
- Pass `isPathNarrow` to `PathList` rather than adding a local observer (simpler, single source of truth).
- Remove all viewport breakpoints in the JSONL viewer.

### Alternatives considered
- Reuse `headerStacked` for panel action groups (rejected: header width != panel width).
- Keep `sm:` and accept preview mismatch (rejected: violates artifact styling guidelines).
- Measure header row widths instead of panel widths (possible follow-up; panel widths should be close enough).

### Tradeoffs
- Slightly more JS state (observer + thresholds) for correct preview behavior.
- Thresholds may need tuning; use constants to make tuning easy.

## 5) Risks & Landmines

- **Initial width = 0:** can cause a flash of narrow layout. Mitigate via `initialWidth` seed (use `containerWidth` for panels; fallback to `window.innerWidth` on client) and `minDelta`.
- **Threshold oscillation:** column switches can change panel widths; use a `minDelta`, rounding, and if needed hysteresis (enter/exit thresholds) to reduce thrash.
- **Scrollbar width:** can shift width ~15px; keep thresholds with some buffer.
- **ResizeObserver cleanup:** hook must handle ref changes and clean up properly.
- **DOM order sensitivity:** don’t insert wrappers after input/output cards (see `docs/resize-slack-debug.txt`).

## 6) Verification & Validation

### Manual checks
1) Device preview iPhone (390×844): action groups stack into their own rows.
2) Device preview iPad: layout uses two/three columns appropriately.
3) Drag sidebar width: action groups update based on container width, not viewport width.
4) Double-click resize handles (input/output): expansion happens without scrollbars.

### Tests to run
- `npm run dev` for visual checks.
- `npm run lint` (repo pre-push expectation).
- `npm run build` for TypeScript sanity.

### Rollback plan
- Revert to previous class strings and remove new width flags if layout becomes unstable.
- Use `docs/resize-slack-debug.txt` checks as baseline to confirm rollback correctness.

## 7) Open Questions / Follow-ups

- Should we move `useElementWidth` to a shared hooks folder for other artifacts?
- Do we want a shared constants file for responsive thresholds across artifacts?
- If panel-width-based behavior feels off, should we measure header row widths instead?

## 8) Helper Implementation Sketch (Reference Only)

> Purpose: clarify the intended shape of the hook + helper and remove ambiguity during implementation.

### `useElementWidth` (new hook)
```ts
import { useEffect, useRef, useState } from 'react';

type UseElementWidthOptions = {
  initialWidth?: number;
  minDelta?: number;
  round?: boolean;
};

export function useElementWidth<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  options: UseElementWidthOptions = {},
) {
  const { initialWidth = 0, minDelta = 8, round = true } = options;
  const [width, setWidth] = useState<number>(initialWidth);
  // Note: initialWidth seeds state; the ref starts as NaN so first apply is never gated.
  const lastWidthRef = useRef<number>(Number.NaN);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof ResizeObserver === 'undefined') return;
    const element = ref.current;
    if (!element) return;

    // Reset tracking on mount / effect re-run.
    // Use NaN so the first apply always updates, even if within minDelta.
    lastWidthRef.current = Number.NaN;

    const apply = (next: number) => {
      const value = round ? Math.round(next) : next;
      if (!Number.isNaN(lastWidthRef.current) && Math.abs(value - lastWidthRef.current) < minDelta) return;
      lastWidthRef.current = value;
      setWidth(value);
    };

    apply(element.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => apply(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, minDelta, round, initialWidth]);

  return width;
}
```

> Note: This sketch assumes the ref target is stable across renders (as in this artifact’s panel refs).
> If the ref can be reassigned to a different element, prefer a callback‑ref variant that stores the node in state
> and uses `element` (not `ref`) in the effect dependency array.

### `actionGroupClass` (UI helper)
```ts
export const actionGroupClass = (isNarrow: boolean) =>
  [
    'flex flex-wrap items-center gap-2 min-w-0',
    isNarrow ? 'basis-full' : 'basis-auto',
  ]
    .filter(Boolean)
    .join(' ');
```
