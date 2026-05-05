# Artifact Design Guide

Read this with `SHARP_MINIMAL_DESIGN.md`.

The philosophy doc defines the visual standard. This guide defines how to make practical artifact design decisions without re-litigating the standard every time.

## Default Artifact Anatomy

Most artifacts should start from this shape: artifact theme boundary, stable header or status lane, nearby controls, primary work surface, and optional secondary details.

```tsx
import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';

export default function Artifact() {
  const theme = 'base';

  return (
    <ArtifactThemeRoot
      className="min-h-screen bg-[var(--surface-muted)] text-[var(--text)]"
      data-theme={theme}
    >
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-base font-semibold">Artifact Name</h1>
            <div className="text-xs text-[var(--text-muted)]">Status</div>
          </div>
        </header>
        <main className="grid flex-1 gap-3 p-4">
          <section className="border border-[var(--border)] bg-[var(--surface)] p-4">Work surface</section>
        </main>
      </div>
    </ArtifactThemeRoot>
  );
}
```

## Design From The Work

- Start with the user's primary task, not the component inventory.
- Put the working surface on screen immediately.
- Keep controls close to the thing they affect.
- Make the default state useful before adding customization.
- Prefer one complete workflow over several partial features.
- Remove anything that does not improve scanning, comparison, action, or confidence.

## Screen Structure

- Use full-width bands, panes, rows, columns, and toolbars as the main structure.
- Use cards only for repeated objects, modals, or genuinely framed tools.
- Do not put cards inside cards.
- Keep page regions visually distinct through spacing, borders, and background shifts.
- Give dense tools a stable frame: header or toolbar, main work area, secondary details.
- Keep destructive, secondary, and configuration actions visually subordinate to primary work.
- Put live, loading, sync, refresh, and error status in stable headers or status lanes instead of inserting large transient blocks into the work surface.

## Layout Decisions

- Choose the layout by the scan pattern:
  - Use rows for logs, history, records, files, and comparable results.
  - Use tables when values must line up across records.
  - Use columns when users compare or transform side by side.
  - Use panels when separate tools or modes need persistent space.
  - Use a grid only when item position is not carrying meaning.
- Define grid columns at every responsive breakpoint.
- Use `min-w-0` wherever text may truncate inside flex or grid.
- Use one spacing system in a stack: `gap-*` or `space-*`, not scattered margins.
- Keep governing controls anchored when dependent controls appear, disappear, or disable.
- Preserve tables, logs, and structured output with horizontal scroll when needed instead of collapsing away comparison.

## Repeated Items

- Repeated items should preserve comparison.
- Prefer one list container with separators over many isolated bordered boxes.
- Use one separator strategy at a time: parent `gap-px` with a border-colored background, or child borders, not both.
- Keep row anatomy consistent: indicator, primary label, metadata, status, actions.
- Use a left bar, square marker, checkbox, or explicit label for selection.
- Do not rely on background color alone for selected or active state.
- Put row actions in stable positions; reveal secondary actions on hover and `focus-within`.
- Use tabular numbers for aligned counts, sizes, times, prices, and metrics.

## Surfaces

- Default radius is `0`.
- Nonzero radius is acceptable for real media, maps, device frames, or third-party widgets when it reflects the object being shown.
- Document recurring or system-level radius exceptions; do not add ceremony for isolated domain objects.
- Outer containers may use borders.
- Inner groups should usually use spacing, separators, or muted backgrounds before adding another border.
- One nested border level is acceptable when it improves scanning.
- Three or more visible border depths require a documented exception.
- Empty and loading states are content blocks, not decorative cards.
- Overlays use one scrim token and an opaque bordered surface.
- Keep depth to a small set of levels: canvas, primary surface, inner grouping or state support, modal boundary.
- Do not create a new visual level for transient feedback.

## Controls

- Choose controls by meaning:
  - Buttons perform commands.
  - Checkboxes select independent options.
  - Toggles represent persistent binary preferences.
  - Status tags can represent reversible action states.
  - Segmented controls switch modes among a small fixed set.
  - Menus and listboxes handle larger option sets.
- Keep control heights consistent within a toolbar or form.
- Enabled controls and other click targets should use the pointer cursor. Disabled controls should use a disabled
  cursor such as `cursor-not-allowed` and should not show pointer affordance.
- Use icon buttons for common tool actions when the icon is familiar.
- Give unfamiliar icon buttons a tooltip or accessible label.
- Passive icons should stay neutral.
- Disabled controls must show why they are disabled through adjacent context or tooltip copy.
- Tooltip copy should describe the next action when state can change.
- Selects and listboxes must support expected keyboard behavior: Escape closes, Enter or Space selects.
- Hidden `sr-only` inputs need visible focus styling on their wrapper.
- Prefer checkbox-style toggles over rounded switch styling.
- Copy buttons should reserve label width, announce success or failure with `aria-live`, and avoid layout shift.

## Forms And Inputs

- Labels should be close to their fields and remain visible unless the pattern is intentionally compact.
- Required fields need a text or symbol cue, not color alone.
- Helper text and error text should sit near the field they explain.
- Validation errors use border plus copy; focus styling must remain visible on error.
- Disabled fields should explain why they are disabled when the reason is not obvious.
- Group related fields in one stack or panel instead of scattering them across separate cards.

## State Model

- Design these states before polishing visuals: default, hover, active, focus-visible, selected, disabled, loading, success, error, empty.
- Focus is not selection. Selection is not hover. Active is not success.
- The focus ring is reserved for keyboard focus.
- Use `focus-visible` for keyboard focus; do not clip focus rings.
- Selection should use its own channel: bar, marker, explicit label, or checked state.
- A background shift may support selection, but must not be the only selected-state cue.
- Feedback states may override hover and focus styling, but must not hide focus.
- Counts, highlights, enabled state, and actions should come from the same eligibility predicate.

## Tokens And Themes

- Artifact and shared UI should use CSS tokens, not raw colors.
- Wrap artifact roots in `ArtifactThemeRoot`.
- Put `data-theme` on the same element as `ArtifactThemeRoot`.
- Keep portals inside the artifact theme boundary.
- Shared token-based components require the artifact theme boundary.
- Shell UI stays outside the artifact theme boundary unless intentionally wrapped.
- Dark mode is controlled by the top-level `.dark` class; theme variants use data attributes.
- Every theme must define the full token contract in steady state.
- Missing-token fallbacks are temporary and must be documented.
- Required token groups: surfaces, text, borders, accent, ring, highlight, overlay, primary, semantic status, category, and shared component tokens.
- If `--accent` changes, also define `--accent-weak` and `--ring`.
- If `--surface` or `--border` changes, also define derived surface and border tokens.
- Verify themes in light and dark mode.
- Light and dark modes should preserve the same spacing, border weight, geometry, and state behavior.
- When colors look wrong, inspect computed values. `color-mix()` may change what source code appears to say.

## Class Composition

- Use plain `className="..."` strings for static class lists.
- Use `mergeClassNames(...)` only when composing fixed classes with conditionals, variants, or caller-provided class overrides.
- Do not wrap a single static class string in `mergeClassNames(...)`; `tailwind-merge` is for resolving real composition conflicts.

## Color And Status

- Accent is for focus, selection, action, and emphasis.
- Semantic color is for actual status: success, warning, danger, info.
- Category color is for grouping and recognition, not for essential meaning.
- Use surface shifts before accent fills.
- Pair color with text, icon, position, border, fill, or shape.
- Keep labels readable by using normal text tokens instead of colored text when possible.
- Use small square indicators for status marks unless another explicit indicator is already present.

## Typography And Data

- Keep type scales compact inside tools.
- Use larger headings only for true page-level hierarchy.
- Metadata should be muted but still readable.
- Use monospace for code, identifiers, paths, timestamps, structured data, and raw output.
- Preserve raw text where exact content matters.
- Sanitize rendered markdown and fall back to literal text if rendering fails.
- Never render untrusted HTML.

## Charts And Visualizations

- Charts should preserve comparison before decoration.
- Use clear axes, labels, legends, and units.
- Pair color with labels, markers, line style, shape, position, or annotation.
- Keep chart palettes restrained; reserve semantic colors for semantic meaning.
- Tooltips should be available through hover and keyboard focus when chart marks are interactive.
- Use stable dimensions, aspect ratios, or container queries so resizing does not distort the data story.
- Prefer tabular numbers for metric cards, axis-adjacent values, and chart summaries.
- Avoid decorative gradients, glow, and animated chart effects unless they clarify change.

## Terminal-Adjacent Rendering

Use these rules for artifacts that render conversations, logs, commands, code, model output, tool output, or telemetry.

- User-authored or source text should preserve whitespace and remain copyable as raw source.
- Assistant or narrative markdown may render as sanitized markdown.
- Tool, command, and metadata output should render as literal preformatted text.
- Token counts, timings, statuses, and telemetry should use structured UI, not markdown.
- Copy actions should preserve the underlying source, not only the rendered view.
- Search highlighting must not corrupt code blocks, inline code, or raw output.
- Markdown render failures should fall back to literal text.

## Responsive Behavior

- Design for the artifact container, not only the browser viewport.
- Prefer container-aware layout decisions for device preview compatibility.
- Preserve the user's stored preference separately from the currently visible responsive state.
- ARIA and active styling should reflect the visible state.
- Avoid hiding the only control that explains the current mode.
- Do not let changing labels, counts, or breakpoints move important controls unexpectedly.

## Motion

- Use motion only to clarify cause and effect.
- Avoid repeated, decorative, bouncy, or attention-seeking animation.
- Respect `prefers-reduced-motion`.
- Layout stability matters more than animation.

## Content And Copy

- Use direct labels.
- Prefer specific verbs: copy, filter, reset, export, compare, expand.
- Empty states should say what happened and the next useful action.
- Error states should say what failed and how to recover.
- Do not explain obvious UI mechanics in the UI.
- Keep developer-facing output literal when formatting could change meaning.
- Links in app chrome should stay low-noise; links in prose need a non-color affordance.

## Before Calling A Design Done

- The primary task is usable on the first screen.
- Repeated items scan and compare cleanly.
- Interactive states are visible and distinct.
- Keyboard focus is obvious and not clipped.
- Color is never the only state cue.
- Controls do not jump when state changes.
- Transient status has a stable home.
- Light and dark themes both work.
- Structured data still lines up or scrolls horizontally.
- Long labels, long values, and empty states fit.
- The implementation uses tokens and the artifact theme boundary.
- Any exception to the sharp minimal standard is documented.
