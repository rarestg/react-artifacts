---
status: active
opened_at: "Wed May 06 2026 - 7:34:53 PM UTC"
closed_at:
summary: "Keep narrow repo-specific artifact styling reminders that do not belong in the core README or design docs."
captured_by: []
---

# Artifact Styling Supplemental Notes

Most styling guidance already lives in:

- `README.md` for artifact structure, device preview behavior, and shared component usage.
- `design/SHARP_MINIMAL_DESIGN.md` for visual language.
- `design/ARTIFACT_DESIGN_GUIDE.md` for practical artifact UI rules.
- `design/UI_IMPLEMENTATION_NOTES.md` for recurring implementation gotchas.

Keep this file only for narrow, repo-specific reminders that do not belong in those docs.

## Current Supplemental Notes

- Before adding artifact-specific responsive CSS, prefer stable local hooks under that artifact root class, such as
  `.jsonl-structure-theme .jsonl-input-options`, instead of styling shared component internals globally.
- Shared shell/artifact helpers may contain viewport utilities for historical reasons. For fixed-container preview work,
  check the exact shared class before reuse; for example `src/components/panelHeaderClasses.ts` currently defines
  `panelHeaderActionsClass` with `sm:basis-auto`.
- Promote a local styling helper to `src/components/` only after at least two artifacts need the same behavior and the
  token/theme contract is clear.
