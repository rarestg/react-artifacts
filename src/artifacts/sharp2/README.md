# Sharp2 Reference Showcase

`sharp2` is a reference showcase for the repo's sharp minimal artifact UI. It renders shared primitives, local example
components, and conversation-domain examples in one artifact so future changes can be inspected in the viewer.

It is not the design policy source of truth. Use it to see current implementations in context, not to override the
design docs or shared component APIs.

## Ownership

Use this ownership model when resolving conflicts:

| Area | Owner |
|------|-------|
| Repo orientation, artifact conventions, scripts | `README.md` |
| Visual philosophy | `design/SHARP_MINIMAL_DESIGN.md` |
| Practical artifact UI rules | `design/ARTIFACT_DESIGN_GUIDE.md` |
| Token values | `src/theme/artifact-theme.css` |
| Shared primitive APIs | `src/components/*` |
| Sharp2-specific structure, local inventory, demonstrated patterns, intentional exceptions | `src/artifacts/sharp2/README.md` |

## File Map

| Path | Purpose |
|------|---------|
| `index.tsx` | Artifact entry and showcase screen. Imports shared primitives, local examples, fixtures, and conversation examples. |
| `meta.ts` | Viewer metadata for the sidebar label and model/version tags. |
| `fixtures.tsx` | Static search and conversation data used by the showcase. |
| `components/*` | Sharp2-local showcase components that are not shared APIs. |
| `conversation/*` | Sharp2-local conversation rendering examples, helpers, and renderer view-model types. |

## Boundary

`index.tsx` must keep the artifact inside `ArtifactThemeRoot` so shared components resolve artifact tokens and theme
guards. Sharp2 currently uses the default artifact token set; do not add a local theme variant unless the design docs and
token contract justify it.

Portals, dialogs, popovers, and copied/rendered content should stay inside the artifact theme boundary whenever possible.
sharp2's Base UI overlays (`ArtifactDialog`, the `ListboxSelect` popup, and the local `SearchInput`/`Popover`) mount
through the shared `Artifact*Portal` wrappers in `src/ui/base-portals.tsx`, which portal into the theme root rather than
`document.body` so scoped tokens resolve in light + dark, device preview, and standalone routes.

## Shared Primitives

Sharp2 demonstrates several shared primitives from `src/components`. The shared files own their public APIs; update this
table when the showcase starts or stops demonstrating one.

| Shared item | Current sharp2 status |
|-------------|-----------------------|
| `Button` | Demonstrated in variants, sizes, icon usage, disabled state, modal actions, and focus examples. |
| `Input` | Demonstrated with accessible names, labels, and error state. |
| `Tag` | Demonstrated as metadata/status labels and used inside conversation examples. |
| `Panel` | Demonstrated as default, muted, dashed, list, and layout surfaces. |
| `Checkbox` | Demonstrated with enabled, disabled, and focus examples. |
| `FilterCheckbox` | Demonstrated in conversation filters with count badges and category tones. |
| `Toggle` | Demonstrated as a shared on/off primitive. |
| `SegmentedControl` | Demonstrated with neutral and accent tones. |
| `ListboxSelect` | Shared but not currently demonstrated here. |
| `CopyButton` | Demonstrated directly and used by code, message, tool, and token examples. |
| `CopyableLabel` | Demonstrated for session metadata and compact identifiers. |
| `StatusTag` | Demonstrated for stable-width status labels. |
| `ArtifactDialog` | Demonstrated in the modal section. |
| `panelHeaderClasses` | Shared but not currently demonstrated here. |

## Local Showcase Components

These components live in `src/artifacts/sharp2/components`. Keep them local until their semantics are stable enough to
promote to `src/components`.

| Component | Why it is local |
|-----------|-----------------|
| `SearchInput` | Base UI `Autocomplete`-backed typeahead example over this showcase's search fixture shape; parent owns filtering and the popup portals inside the artifact boundary. |
| `Popover` | Base UI `Popover`-backed dropdown example with local action styling (`popoverActionClass`); non-modal, and the popup portals inside the artifact boundary. |
| `Row` | Clickable list row example for selection and scan-friendly row anatomy. |
| `CodeBlock` | Literal code block example with copy support. |
| `Section` | Showcase section shell, not a general artifact primitive. |
| `SubSection` | Showcase subsection label wrapper, not a general artifact primitive. |

## Conversation Examples

Conversation rendering is a sharp2-local domain example. It may import shared primitives internally, but its row
primitives, markdown helpers, and event-row parts are not shared APIs. Production sharp2 code should import through
`conversation/index.ts` so the local public surface stays deliberate.

| File | Role |
|------|------|
| `conversation/index.ts` | Narrow sharp2-local public surface for the renderer: `ConversationTurn`, renderer view-model types, key helpers, and token telemetry normalization. |
| `conversation/MessageCard.tsx` | Renders one user, assistant, or thinking message row with literal/rendered modes. |
| `conversation/ToolCall.tsx` | Renders summary-first tool rows with optional literal input/output details and copy behavior. |
| `conversation/ConversationTurn.tsx` | Groups turn items with a stable header, derives visible transcript rows, and preserves original item indexes. |
| `conversation/TokenCounter.tsx` | Displays flat context-window telemetry rows with copyable raw summary text and real token telemetry normalization. |
| `conversation/markdown.tsx` | Local lightweight markdown splitting/rendering helpers and render fallback boundary. |
| `conversation/keys.ts` | Stable key helpers for turns and turn items. |
| `conversation/types.ts` | Local conversation data and visibility types. |
| `conversation/productTypes.ts` | Temporary type-only outline of the target `codexscope.product.v1` transcript/read contract. Replace with generated product DTOs when available. |
| `conversation-rendering-preferences.md` | Current sharp2 conversation renderer design contract: row anatomy, semantics, controls, copy behavior, and metadata rules. |
| `conversation-export-readiness.md` | Export-readiness notes for moving the renderer toward a product transcript pane without package extraction yet. |

## Conversation Handoff

For CodexScope UI/product handoff, start here:
- This README gives the sharp2 file map, ownership model, and local import boundary.
- `conversation-rendering-preferences.md` owns the renderer UX/design contract and the behavior not to break.
- `conversation-export-readiness.md` owns the CodexScope product/API/export boundary and remaining extraction work.
- `conversation/index.ts` is the current local public import surface for production sharp2 code.

## Patterns To Preserve

- Keep root and nested UI tokenized: use `var(--surface*)`, `var(--text*)`, `var(--border*)`, `var(--ring)`,
  semantic status tokens, and category tokens.
- Treat `src/theme/artifact-theme.css` as the token value source. Any conceptual token inventory in `index.tsx` is only
  a local reference.
- Use category tokens for message roles and filters. Keep text labels readable with text tokens so color is not the only
  cue.
- Preserve stable labels for controls whose visible text changes. Shared `CopyButton`, `CopyableLabel`, `StatusTag`,
  `Checkbox`, `Toggle`, and `SegmentedControl` already use reserve-label patterns.
- Keep the clickability contract: enabled click targets need `cursor-pointer`, a visible hover state, and a visible
  active/pressed state. Disabled controls should not look clickable.
- Use `focus-visible` for keyboard focus. Offset rings are preferred when they fit; inset rings are acceptable where an
  offset ring would clip or disrupt a compact row/control.
- Keep conversation examples aligned with `conversation-rendering-preferences.md`; detailed Conversation Rendering row
  anatomy, copy behavior, token telemetry, and subagent/event rules live there.

## Intentional Nuance

- `rounded-none` is allowed as an explicit zero-radius class. Avoid positive radius unless a core design doc exception
  applies.
- Overlays may use the `--overlay` token even when its value is rgba. Do not add ad hoc translucent surfaces elsewhere.
- The global decision-ring utility uses box-shadow-like painting for focus/annotation mechanics. Do not use shadows for
  general hierarchy.
- Popovers and dialogs should use opaque surfaces, tokenized borders, and visible focus states.
- Sharp2 can show implementation guidance in the artifact, but avoid turning the UI into a prose manual. Put durable
  editing guidance in this README or the design docs.

## Before Changing Sharp2

1. Read the root `README.md`, `design/SHARP_MINIMAL_DESIGN.md`, and `design/ARTIFACT_DESIGN_GUIDE.md`.
2. Check whether the change belongs in a shared primitive, a token, a sharp2-local example, or fixture data.
3. Keep local examples local unless there is a clear shared API need.
4. Verify light and dark mode when changing tokens, surfaces, status colors, category colors, or focus styling.
5. For code changes, run the relevant focused checks and `npm run check` before PR-level completion.
