---
status: queued
opened_at: "Wed May 06 2026 - 7:34:53 PM UTC"
closed_at:
summary: "Make JSONL Structure Viewer respond to artifact and card containers instead of browser viewport breakpoints."
captured_by: []
---

# JSONL Structure Viewer Responsive Plan

## Current Problem

The shell device preview is a fixed-size container, not a browser viewport. The JSONL Structure Viewer already measures
its root width in `src/artifacts/jsonl-structure-viewer/index.tsx`, but some layout still depends on viewport
breakpoints:

- `src/components/panelHeaderClasses.ts`: `panelHeaderActionsClass` includes `basis-full sm:basis-auto`.
- `src/artifacts/jsonl-structure-viewer/index.tsx`: input options grid uses `sm:`, help panel and panel grid use `lg:`.
- `src/artifacts/jsonl-structure-viewer/components/PathList.tsx`: path header actions inherit `panelHeaderActionsClass`.

Desired behavior: inside iPhone/iPad preview, JSONL controls respond to the artifact/card width, while the existing
stored `layoutMode` preference and derived `visibleLayoutMode` remain intact.

## Implementation Plan

1. Add JSONL-local CSS hooks in `index.tsx` and `PathList.tsx`.
   - Add classes under the existing `.jsonl-structure-theme` root.
   - Suggested hooks: `.jsonl-content`, `.jsonl-help`, `.jsonl-panels-grid`, `.jsonl-input-card`,
     `.jsonl-output-card`, `.jsonl-path-card`, `.jsonl-input-options`, `.jsonl-panel-actions`.

2. Use container queries in `src/artifacts/jsonl-structure-viewer/theme.css`.
   - Put `container-type: inline-size` on `.jsonl-content` for help/content-level rules.
   - Put `container-type: inline-size` on card hooks for local action and option-grid rules.
   - Keep rules scoped under `.jsonl-structure-theme`.

3. Replace panel action viewport behavior locally.
   - Do not change `panelHeaderActionsClass` unless you are intentionally updating all shared users.
   - For JSONL, compose a local action class that keeps `flex flex-wrap items-center gap-2 min-w-0 basis-full`.
   - Check `src/artifacts/jsonl-structure-viewer/lib/ui.ts`; it currently re-exports `panelHeaderActionsClass`, so
     either replace that export with a JSONL-local action class or stop importing the shared action class through it.
   - Use a card container query to switch JSONL panel actions to `basis-auto` when the card is wide enough.

4. Move local responsive rules out of JSX viewport utilities.
   - Replace the input options `sm:grid-cols-*` class with `.jsonl-input-options` plus a card container query.
   - Replace the help panel `lg:grid-cols-*` class with `.jsonl-help` plus a content container query.
   - Replace panel grid `lg:grid-cols-*`, `lg:items-start`, and `lg:self-start` with classes driven by
     `visibleLayoutMode`; those classes should not be viewport-prefixed because `visibleLayoutMode` already comes from
     measured artifact width.
   - Remove `lg:flex-[0.9]` from the path panel unless a current visual check proves it still has an effect.

5. Keep JS width logic only where it represents product state.
   - Keep `containerWidth`, `canUseTwoColumns`, `canUseThreeColumns`, and `visibleLayoutMode`.
   - Do not add per-panel `ResizeObserver` state unless container queries cannot express the needed behavior.

## Validation

- Run `rg "sm:|md:|lg:|xl:" -n src/artifacts/jsonl-structure-viewer src/components/panelHeaderClasses.ts`.
  Any remaining viewport utilities in JSONL should be deliberate and explained in the change.
- Check shell device preview:
  - iPhone portrait: panel actions stay readable and stack by card width.
  - iPad portrait/landscape: two/three-column layout follows `visibleLayoutMode`.
  - Sidebar resize: JSONL layout updates from artifact width, not browser viewport width.
- Recheck textarea/output double-click resize behavior because `inputCardRef`, `outputCardRef`, `contentRef`, and
  `panelsGridRef` are involved in resize expansion.
- Run `npm run check` before PR.
