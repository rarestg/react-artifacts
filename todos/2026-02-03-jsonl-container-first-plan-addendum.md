# JSONL Viewer Container-First Plan — Container Query Addendum

## 1) Purpose

This addendum proposes a more robust, CSS-first approach to container‑responsive behavior in the JSONL viewer using **container queries**. It explains the limitations of the current JS measurement plan, why container queries are a better long‑term fit, and how to implement them thoroughly. It also includes two alternative approaches (auto‑fit and hybrid) and their implications.

This document is intentionally standalone and does **not** modify the existing plan. It should be read as a higher‑fidelity alternative that prioritizes correctness, simplicity, and long‑term maintainability.

---

## 2) Limitations of the Current JS Measurement Plan

The current plan relies on `ResizeObserver` and width flags in React state to determine layout.

### Observed limitations
- **Flash of incorrect layout**: initial width often starts at `0`, causing narrow‑state rendering until the observer runs.
- **Threshold oscillation**: switching column counts changes panel widths, which can flip `is*Narrow` flags and create layout flicker.
- **Scrollbars affect width**: small width deltas (e.g., 15px) can change which layout applies.
- **JS-driven layout**: extra state + observers increases render churn and complexity.
- **Hard to reason about**: layout decisions spread across multiple flags and hooks, and must remain in sync.
- **Indirect coupling**: layout behavior depends on JS in a component that also manages data parsing and filtering.

These are manageable, but they are the inherent cost of a JS‑measurement approach.

---

## 3) Why Container Queries Are a Better Fit

Container queries are **explicitly designed** for “component responsiveness”—layout that depends on the size of a parent container, not the viewport. That is exactly the requirement for the artifact device preview.

### Benefits
- **Correct by construction**: styles respond directly to container size; no JS flags.
- **No initial flash**: layout uses CSS at first paint; no observer delays.
- **No oscillation**: CSS resolves layout continuously without threshold feedback loops.
- **Simpler state**: remove `useElementWidth` and layout flags.
- **More maintainable**: layout logic lives in `theme.css`, not scattered through component logic.

---

## 4) Implementation Plan (Container Query Version)

This plan keeps the **explicit layout mode controls** (1/2/3 columns) and uses container queries to handle panel‑level responsiveness (action groups, grids, padding). That provides the best balance of correctness and minimal UX change.

### Step 0 — Inventory (same as main plan)
- Review `design/UI_IMPLEMENTATION_NOTES.md` and `todos/artifact-styling-guidelines.md`.
- Run `rg "sm:|lg:|xl:" -n src/artifacts/jsonl-structure-viewer` to identify all viewport breakpoints.

### Step 1 — Add explicit structural hooks for CSS
Add stable class hooks or data attributes for container query targets. Examples:
- `.jsonl-content` (wrapper that currently has `px-6 py-10`).
- `.jsonl-input-card`, `.jsonl-output-card`, `.jsonl-path-card` (top-level card elements).
- `.jsonl-input-actions`, `.jsonl-output-actions`, `.jsonl-path-actions` (action group wrappers).
- `.jsonl-input-options` (input options grid).

These classes should be **local to the JSONL artifact** (preferably in `theme.css` scope).

### Step 2 — Define containers
Use `container-type: inline-size;` on the containers whose width should drive layout decisions:
- `jsonl-content` for overall padding decisions.
- Each card container (`jsonl-input-card`, `jsonl-output-card`, `jsonl-path-card`) for action groups and local grids.

Example (in `src/artifacts/jsonl-structure-viewer/theme.css`):
```css
.jsonl-structure-theme .jsonl-content {
  container-type: inline-size;
}
.jsonl-structure-theme .jsonl-input-card,
.jsonl-structure-theme .jsonl-output-card,
.jsonl-structure-theme .jsonl-path-card {
  container-type: inline-size;
}
```

### Step 3 — Replace viewport breakpoints with container queries
Move breakpoint logic into `theme.css` using `@container`:

#### Content padding
```css
.jsonl-structure-theme .jsonl-content {
  padding: 2.5rem 1.5rem; /* py-10 px-6 */
}
@container (min-width: 1024px) {
  .jsonl-structure-theme .jsonl-content { padding-left: 2rem; padding-right: 2rem; } /* px-8 */
}
@container (min-width: 1280px) {
  .jsonl-structure-theme .jsonl-content { padding-left: 2.5rem; padding-right: 2.5rem; } /* px-10 */
}
```

#### Action group stacking
```css
.jsonl-structure-theme .jsonl-input-actions,
.jsonl-structure-theme .jsonl-output-actions,
.jsonl-structure-theme .jsonl-path-actions {
  flex-basis: 100%;
}
@container (min-width: 640px) {
  .jsonl-structure-theme .jsonl-input-actions,
  .jsonl-structure-theme .jsonl-output-actions,
  .jsonl-structure-theme .jsonl-path-actions {
    flex-basis: auto;
  }
}
```

#### Input options grid
```css
.jsonl-structure-theme .jsonl-input-options {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
@container (min-width: 640px) {
  .jsonl-structure-theme .jsonl-input-options {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
```

### Step 4 — Remove JS width flags
Remove:
- `useElementWidth` and its usage.
- `isInputNarrow`, `isOutputNarrow`, `isPathNarrow`, `isInputOptionsTwoCol`, `isContentPaddingWide`, `isContentPaddingXL`.

Only keep the existing **layout mode** logic (`visibleLayoutMode`) and its grid template classes.

### Step 5 — Remove viewport breakpoint classes from JSX
Replace all `sm:` / `lg:` / `xl:` utility classes in the JSONL viewer with plain class hooks.
The CSS container queries will now control the behavior.

### Step 6 — Validate
Manual verification should remain identical to the original plan:
1) Device preview iPhone: actions stack; layout consistent.
2) Device preview iPad: actions unstack appropriately; layout mode still honored.
3) Sidebar resize: action groups react without JS flicker.
4) Double‑click resize handles: confirm no structural changes broke the resize logic.

---

## 5) Risks & Edge Cases (Container Query Approach)

- **Browser support**: Chrome/Edge 106+, Safari/iOS Safari 16.0+, Firefox 110+. Internet Explorer not supported. Baseline: Widely available (since 2025-08-14).
- **CSS specificity**: ensure container query rules are scoped under `.jsonl-structure-theme` to avoid leaking styles.
- **Overlapping containers**: avoid nested containers unless intentional; otherwise queries may apply in unexpected places.
- **Layout mode interplay**: container queries should not override explicit `visibleLayoutMode` grid template logic.

---

## 6) Options & Alternatives

### Option A — Auto‑fit grids (no explicit layout mode)
**Idea:** let CSS determine the number of columns based on available space using:
```css
grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
```

**Pros**
- No JS flags or layout mode state.
- Naturally adapts to container width.

**Cons**
- Removes explicit “Layout 1/2/3” control, which is currently a product feature.
- Harder to guarantee 3‑column mode on large screens if the content is narrow.

**When to choose**
- If you decide the explicit layout mode is unnecessary and want a pure responsive system.

---

### Option B — Hybrid (recommended upgrade path)
**Idea:** keep the “Layout” buttons (1/2/3 columns) and use container queries only for **panel‑level** adjustments (actions, padding, input options).

**Pros**
- Keeps current UX intact.
- Removes JS width measurement and most layout thrash.
- Lowest migration cost from current plan.

**Cons**
- Layout mode still in JS and still drives grid template classes.

**When to choose**
- If you want best correctness with minimal UX change.

---

## 7) Suggested Migration Path

If you want to move safely:
1) Add class hooks and container queries for **action groups + input options** only.
2) Remove JS width flags for those areas.
3) Move padding to container queries.
4) Consider auto‑fit if you ever want to remove explicit layout mode.

---

## 8) Summary Recommendation

The container query approach is **cleaner, more robust, and easier to maintain** than JS‑based width flags. The best immediate path is **Hybrid**: keep layout mode controls but move all local responsiveness to container queries. This gives correct device preview behavior with fewer moving parts and no measurement jitter.
