# Artifact Styling Guidelines + Cleanup Plan

## 1) Problem & Motivation

### What we’re solving and why now
- The artifact viewer’s device preview is a *container*, not a viewport.
- Tailwind viewport breakpoints (`sm:`, `md:`, `lg:`) do **not** respond to container size, causing layout mismatches in preview.
- Recent UI tweaks introduced a mix of container‑driven logic (via `containerWidth`) and viewport breakpoints, which is fragile and hard to reason about.

### Success criteria / desired outcomes
- Artifacts respond to **container width** by default, so device preview reflects intended layout.
- Responsive logic is centralized and readable; fewer ad‑hoc class strings.
- Action groups **take their own row at narrow widths** (stable, deterministic layout).
- The JSONL Structure Viewer header/actions layout remains stable across widths with predictable alignment.

## 2) System Context

### Relevant code
- `src/artifacts/jsonl-structure-viewer/index.tsx`
  - Container width is measured via `containerRef` + `ResizeObserver`.
  - Multiple derived class strings drive header layout (`headerGridClass`, `headerControlsClass`, etc.).
  - Action groups in input/output headers use viewport breakpoints (`sm:`), which don’t follow container size.

- `src/artifacts/jsonl-structure-viewer/components/PathList.tsx`
  - Action groups use `basis-full sm:basis-auto` which is viewport‑based.

### How affected code connects to other subsystems
- Device preview in `src/App.tsx` wraps artifacts in a fixed‑size container.
- There is no iframe mode (yet), so artifacts must be container‑responsive to preview correctly.

## 3) Implementation Plan (ordered)

### Step 1: Adopt a container‑first styling guideline
**What to do**
- Document the default rule: artifacts should use **container‑driven** breakpoints instead of `sm:/lg:` unless they are intentionally full‑page prototypes.
- Provide the preferred pattern:
  - Measure container width (as already done in JSONL viewer),
  - Derive layout flags in JS (e.g., `isCompact`, `isTwoColumn`),
  - Use those flags to choose class names.
- Explicitly allow viewport breakpoints only when:
  - the artifact is a full‑page app, or
  - it will be tested in actual viewport emulation (DevTools or iframe mode).

**Where**
- This document (and optionally a short note in `README.md` under “Adding an Artifact”).

**Why**
- Aligns layout behavior with the viewer’s preview model.

### Step 2: Remove viewport breakpoints from JSONL viewer action groups
**What to do**
- Replace `basis-full sm:basis-auto` in:
  - `src/artifacts/jsonl-structure-viewer/index.tsx` (input/output header actions)
  - `src/artifacts/jsonl-structure-viewer/components/PathList.tsx` (Expand/Collapse + selection buttons)
- Use container‑driven flags instead (e.g., `headerStacked`) and **force action groups onto their own row** at narrow widths (do not rely on “wrap only when needed”).

**Why**
- Fixes the mismatch where device preview shows desktop behavior because `sm:` still sees the large viewport.

### Step 3: Consolidate header layout logic
**What to do**
- Replace the 5 derived class strings with a single layout object or a small `HeaderControls` component.
- Example approach:
  - Compute `headerStacked` and `headerAlign` once.
  - Use a single wrapper layout for right‑side controls.
  - Keep a simple, explicit structure:
    - Layout controls (optional)
    - Word Wrap + Show Help row
- Use conditional classes sparingly and keep class derivations local to the header block.

**Why**
- Improves maintainability and reduces the chance of misaligned alignment logic.

### Step 4: Normalize alignment for “Show Help”
**What to do**
- Avoid `ml-auto` where possible; prefer `justify-between` on the row or a two‑column container.
- Make the alignment explicit in the layout structure, not via the button itself.
- When narrow, keep “Show Help” on its own row (or the shared action row) to avoid jitter from label changes.

**Why**
- Prevents “floating right” when the row wraps; avoids brittle alignment tied to a single element.

## 4) Key Decisions & Tradeoffs

### Decision: container‑first responsive logic
**Why this approach**
- It matches how device preview actually works and avoids layout surprises.

### Alternatives considered
- **Keep `sm:/lg:` and rely on DevTools/iframe**: requires additional tooling or a future iframe implementation; currently inconsistent.

### Tradeoffs accepted
- More JS‑driven layout state (container width) vs. simple Tailwind breakpoint usage.
- Slightly more logic in each artifact, but consistent behavior in the viewer.

## 5) Risks & Landmines

- Mixing viewport breakpoints with container width logic will continue to cause “looks fine in preview, breaks in reality” regressions.
- Over‑centralizing layout state can hide how a block responds to width; keep names explicit (`headerStacked`, `isTwoColumn`).
- `ml-auto` in wrapped flex rows can create surprising alignment; prefer structural alignment.

## 6) Verification & Validation

### Manual checks
- Set the device preview to iPhone (390×844) and confirm:
- Action groups move to their own row at narrow widths, even if there is room.
  - “Show Help” aligns as intended.
  - Header controls respond to container width (not viewport).
- Resize the container (sidebar drag) and verify the header and action groups update predictably.

### Tests to run
- `npm run dev` and visually confirm behavior.
- `npm run build` for TypeScript sanity.

### Rollback plan
- Revert to the previous class‑string logic and reintroduce viewport breakpoints if container logic proves too complex.

## 7) Open Questions / Follow‑ups

- Should the repo include a small utility hook (e.g., `useContainerWidth`) to standardize container‑driven responsiveness across artifacts?
- Should the viewer implement iframe mode later to support viewport‑based breakpoints for full‑page artifacts?

## 8) JSONL Structure Viewer Alignment Plan (Action Groups Always Own Row at Narrow Widths)

### What would change

1) **Header controls (Word Wrap + Show Help)**  
File: `src/artifacts/jsonl-structure-viewer/index.tsx`  
- Replace the current “wrap when needed” layout in `headerControlsRowClass` with an explicit stacked layout when `headerStacked` is true.  
- Structure in narrow mode: Word Wrap row first, Show Help on its own row beneath (no `ml-auto`).

2) **Input header action group (Clear / Load Sample / Parsing)**  
File: `src/artifacts/jsonl-structure-viewer/index.tsx`  
- Remove viewport `sm:` classes and use a container‑width flag (e.g., `headerStacked`) to force the action group to full width (own row) at narrow widths.

3) **Output header action group (Copy Output)**  
File: `src/artifacts/jsonl-structure-viewer/index.tsx`  
- Same as above: replace `sm:` with container‑driven flags so the action group always drops to its own row when narrow.

4) **Path Filters action groups (Expand/Collapse + Select/Deselect/Invert/Reset)**  
File: `src/artifacts/jsonl-structure-viewer/components/PathList.tsx`  
- Replace `basis-full sm:basis-auto` with a container‑driven prop (e.g., `isNarrow`) and force each action group to be full‑width rows in narrow mode.

### Why this aligns with the guideline
- It removes viewport breakpoints from the artifact UI.
- It makes the “row break” deterministic rather than relying on wrap heuristics.
- It ensures device preview layouts match the intended responsive behavior.

## 9) Alternative Alignment Plan (Option B: Only Wrap When Needed)

### Summary
This approach keeps action groups inline until they actually run out of room. It prioritizes compactness over deterministic row breaks.

### What would change

1) **Header controls (Word Wrap + Show Help)**  
File: `src/artifacts/jsonl-structure-viewer/index.tsx`  
- Use a single flex row with `flex-wrap` and `min-w-0`.  
- Remove any forced row breaks tied to `headerStacked`.  
- Keep alignment simple (e.g., `justify-between` on the row, or `ml-auto` on Show Help if you accept the “floating right” behavior on wrap).

2) **Input header action group (Clear / Load Sample / Parsing)**  
File: `src/artifacts/jsonl-structure-viewer/index.tsx`  
- Keep a single flex row with `flex-wrap` + `min-w-0` and **no** explicit “stacked” rule.  
- Avoid viewport `sm:` breakpoints; rely on wrap instead.

3) **Output header action group (Copy Output)**  
File: `src/artifacts/jsonl-structure-viewer/index.tsx`  
- Same as above: single flex row, wrap only when needed, no container‑width breakpoints.

4) **Path Filters action groups (Expand/Collapse + Select/Deselect/Invert/Reset)**  
File: `src/artifacts/jsonl-structure-viewer/components/PathList.tsx`  
- Replace `basis-full sm:basis-auto` with `flex-wrap` + `min-w-0`.  
- Allow buttons to wrap to the next line only when space runs out.

### Tradeoffs (vs. “own row”)
- **Pros:** More compact at medium widths; fewer forced line breaks.  
- **Cons:** Layout can shift when labels change (“Show Help” ↔ “Hide Help”) or when a single button wraps earlier than expected.

### Implementation checklist
- Remove all viewport `sm:`/`lg:` breakpoint usage from action groups.  
- Keep container‑width flags only for major layout changes (e.g., header two‑column vs. one‑column).  
- Prefer `min-w-0` + `flex-wrap` to allow natural wrapping instead of explicit rows.
