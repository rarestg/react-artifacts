# JSONL Header Dedupe Notes

## Context
While reviewing the JSONL Structure Viewer header area, there are repeated class strings and patterns that could be lightly deduped without a big refactor.

## Findings (current repeats)
- Toggle group wrapper class (`inline-flex border border-[var(--border-strong)] bg-[var(--border)] gap-px`) appears 4 times.
- Toggle button base class (`h-8 px-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none`) appears 9 times.
- Section label class (`text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]`) appears 8 times.
- Reserve-label pattern (`relative inline-grid` with an invisible span to reserve width) is repeated across every toggle button.

## Recommendations (low-risk)
- Add a few constants in `src/artifacts/jsonl-structure-viewer/lib/ui.ts`:
  - `toggleGroupClass`
  - `toggleButtonBaseClass`
  - `toggleButtonActiveClass`
  - `toggleButtonInactiveClass`
  - `sectionLabelClass`
- Swap occurrences in `src/artifacts/jsonl-structure-viewer/index.tsx` to use these constants.

## Optional (slightly more refactor)
- A tiny `ToggleGroup` / `ToggleButton` component could eliminate the repeated reserve-label markup and active/inactive boilerplate, but this is more opinionated and not necessary right now.

## Estimated Impact
- Reduces ~21 repeated class literals down to a handful of constants.
- Modest line-count reduction (~10–15 lines) but improves scanability in the header area.

