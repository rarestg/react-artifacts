---
name: tools.rares.blog
description: Square, opaque, quiet UI for small single-purpose web tools.
---

# Design System: tools.rares.blog

## Overview

**Creative North Star: "Disciplined Legibility"**

Sharp minimal design is clear, structured, calm, and intentional. It reduces noise without becoming vague. Every line, surface, typographic shift, and state should explain structure, priority, or action.

Sharp minimal design is not plainness. It is disciplined legibility: composed, exact, low-noise, and easy to understand at a glance.

This file is the one required design doc. It sets the rules, and the code holds the values:

- `src/theme/artifact-theme.css` owns base token values. Palette overrides live in the artifact's own folder, such as `src/artifacts/example/theme.css`.
- `src/ui/recipes.ts` owns the shared skin, and `src/ui/layout.tsx` owns shared spacing and grids.
- `src/components/` owns primitive APIs.
- `design/UI_IMPLEMENTATION_NOTES.md` holds numbered detail on recurring decisions. "Note 005" below means entry 005 there.

These rules cover artifacts and shared primitives. The viewer shell (`src/App.tsx` and shell-only components such as `ArtifactListItem`) keeps its own classes, and its device frame and tooltip shadows are not a precedent for artifacts. The 11px floor covers the shell too.

**Key Characteristics:**

- Favor clarity over decoration.
- Favor structure over atmosphere.
- Favor alignment over ornament.
- Favor useful contrast over visual effects.
- Favor fewer, stronger decisions over many soft ones.
- Keep the interface quiet by default and explicit when attention is needed.
- Keep light and dark modes in the same visual language.

### Design From The Work

- Start with the user's primary task, not the component inventory.
- Put the working surface on screen immediately.
- Keep controls close to the thing they affect.
- Make the default state useful before adding customization.
- Prefer one complete workflow over several partial features.
- Remove anything that does not improve scanning, comparison, action, or confidence.

## Colors

**The Readable Text Rule.** Text people need to read reaches 4.5:1 against its background in light and dark. `--text`, `--text-muted`, and `--text-subtle` pass on every neutral surface. `tests/design/legibility.test.ts` checks them on literal and computed surfaces, including palette overrides under `src/artifacts/`. Disabled controls and invisible width-reserving labels are exempt.

- Start with strong neutrals and add accents sparingly.
- Avoid mixing unrelated gray families or competing accents.
- Accent is for focus, selection, action, and emphasis.
- Semantic color is for actual status: success, warning, danger, info.
- Category color is for grouping and recognition, not for essential meaning.
- Use surface shifts before accent fills.
- Pair color with text, icon, position, border, fill, or shape.
- Keep labels readable by using normal text tokens instead of colored text when possible.
- Use `*-text` tokens when colored text sits on a matching `*-weak` background.
- Use small square indicators for status marks unless another explicit indicator is already present.

### Tokens And Themes

- Artifact and shared UI should use CSS tokens, not raw colors.
- Wrap artifact roots in `ArtifactThemeRoot`.
- Base-only artifacts may omit `data-theme`; artifacts with palette overrides should put `data-theme` on the same
  element as `ArtifactThemeRoot`.
- Keep portals inside the artifact theme boundary (note 005).
- Shell UI stays outside the artifact theme boundary unless intentionally wrapped.
- Dark mode is controlled by the top-level `.dark` class; theme variants use data attributes.
- Partial palette overrides are allowed when the base `.artifact-theme` supplies the full contract; full replacement
  themes must define the full token contract in steady state.
- Missing-token fallbacks are temporary and must be documented.
- Required token groups: surfaces, text, borders, accent, ring, highlight, overlay, primary, semantic status, semantic text, category, category text, and shared component tokens.
- If `--accent` changes, also define `--accent-text` and `--accent-weak`. `--ring` and `--highlight` derive from it.
- If semantic or category colors change, also define the matching `*-text` and `*-weak` tokens.
- If `--surface` or `--border` changes, also define `--text-muted` and `--text-subtle` that pass on the new surfaces. Derived surface and border tokens follow on their own.
- Light and dark modes should preserve the same spacing, border weight, geometry, and state behavior.
- When colors look wrong, inspect computed values. `color-mix()` may change what source code appears to say (note 004).

## Typography

**The 11px Floor Rule.** Text people need to read never goes below 11px. Dense tools earn density from layout, not from tiny type. `tests/design/legibility.test.ts` rejects smaller `text-[Npx]` classes.

- Build hierarchy with size, weight, spacing, alignment, borders, contrast, and position.
- Important elements should be obvious without being loud.
- Secondary elements should be subdued, not illegible.
- Muted text is for metadata, helper copy, and low-priority context.
- Keep type scales compact inside tools.
- Use larger headings only for true page-level hierarchy.
- Use monospace for code, identifiers, paths, timestamps, structured data, and raw output.
- Preserve raw text where exact content matters.

## Layout

Most artifacts should start from this shape: artifact theme boundary, stable header or status lane, nearby controls, primary work surface, and optional secondary details.

`src/artifacts/example-app/` shows this shape in code.

### Screen Structure

- Use full-width bands, panes, rows, columns, and toolbars as the main structure.
- Use cards only for repeated objects, modals, or genuinely framed tools.
- Do not put cards inside cards.
- Give dense tools a stable frame: header or toolbar, main work area, secondary details.
- Keep destructive, secondary, and configuration actions visually subordinate to primary work.
- Put live, loading, sync, refresh, and error status in stable headers or status lanes instead of inserting large transient blocks into the work surface.
- Use a simple spacing scale consistently.
- Align edges aggressively.
- Keep related things close and separate unrelated things clearly.

### Layout Decisions

- Choose the layout by the scan pattern:
  - Use rows for logs, history, records, files, and comparable results.
  - Use tables when values must line up across records.
  - Use columns when users compare or transform side by side.
  - Use panels when separate tools or modes need persistent space.
  - Use a grid only when item position is not carrying meaning.
- For breakpoint-driven grids, define columns at every responsive state. For container-driven grids, use explicit
  `minmax`, `auto-fit`, or measured-width tracks so the layout has a clear rule at each size.
- Use `min-w-0` wherever text may truncate inside flex or grid.
- Use one spacing system in a stack: `gap-*` or `space-*`, not scattered margins (note 009).
- Keep governing controls anchored when dependent controls appear, disappear, or disable (note 003).
- Preserve tables, logs, and structured output with horizontal scroll when needed instead of collapsing away comparison.

### Repeated Items

- Repeated items should preserve comparison.
- Prefer one list container with separators over many isolated bordered boxes.
- Use one separator strategy at a time: parent `gap-px` with a border-colored background, or child borders, not both (note 001).
- Keep row anatomy consistent: indicator, primary label, metadata, status, actions.
- Put row actions in stable positions; reveal secondary actions on hover and `focus-within` (note 008).
- Use tabular numbers for aligned counts, sizes, times, prices, and metrics.

### Responsive Behavior

- Design for the artifact container, not only the browser viewport, so device preview works.
- Preserve the user's stored preference separately from the currently visible responsive state (note 002).
- ARIA and active styling should reflect the visible state.
- Avoid hiding the only control that explains the current mode.
- Do not let changing labels, counts, or breakpoints move important controls unexpectedly.

## Elevation & Depth

The system is flat.

**The Opaque Surface Rule.** Surfaces are opaque. The one translucent surface is the overlay scrim (`--overlay`). Functional opacity is fine: disabled controls, invisible label reservation, and short state fades (note 007).

- Separate regions with borders, spacing, alignment, and subtle background shifts.
- Inner groups should usually use spacing, separators, or muted backgrounds before adding another border.
- One nested border level is acceptable when it improves scanning. Deeper nesting usually means the structure needs rethinking.
- Empty and loading states are content blocks, not decorative cards.
- Overlays use one scrim token and an opaque bordered surface.
- Keep depth to a small set of levels: canvas, primary surface, inner grouping or state support, modal boundary.
- Do not create a new visual level for transient feedback.

## Shapes

- Use square geometry by default (radius `0`); document recurring or system-level rounding exceptions.
- Keep edges crisp and repetition systematic.
- Nonzero radius is acceptable for real media, maps, device frames, or third-party widgets when it reflects the object being shown.
- Treat icons as utility marks, not decoration.

## Components

### Controls

- Choose controls by meaning (note 006):
  - Buttons perform commands.
  - Checkboxes select independent options.
  - Toggles represent persistent binary preferences.
  - Status tags can represent reversible action states.
  - Segmented controls switch modes among a small fixed set.
  - Menus and listboxes handle larger option sets.
- Keep control heights consistent within a toolbar or form.
- Controls grouped together should share a common shell: height, border, background, and state behavior. Express hierarchy through placement, labels, icons, and restrained foreground emphasis, not accidental geometry or token drift.
- The same kind of action looks the same and uses the same word across a tool.
- Reserve changing labels with an invisible widest label instead of fixed pixel widths.
- Enabled controls and other click targets should use the pointer cursor. Disabled controls should use a disabled
  cursor such as `cursor-not-allowed` and should not show pointer affordance.
- Do not use `pointer-events-none` as the default disabled state for real controls. Native disabled buttons, inputs,
  and labels still need to receive pointer hit testing so the disabled cursor can appear; the `disabled` attribute
  already blocks activation.
- Reserve `pointer-events-none` for inert visual children, focus-ring overlays, hidden label-reservation spans, portal
  shells, and other layers that should never become the hover target.
- For anchors or custom controls that use `aria-disabled`, guard click and keyboard handlers explicitly because they are
  not natively disabled.
- Use icon buttons for common tool actions when the icon is familiar.
- Give unfamiliar icon buttons a tooltip or accessible label.
- Icon-only buttons should keep a stable square hit target, center the icon, use a native `<button>` when possible, and
  provide one accessible-name method such as `aria-label` or `sr-only` text.
- In compact desktop toolbars, `size-7` can be acceptable and `size-8` is preferred when space allows; use larger
  targets for touch-first surfaces.
- Add `aria-pressed` for toggle buttons and `aria-expanded` for disclosure buttons.
- Passive icons should stay neutral.
- Disabled controls must show why they are disabled through adjacent context or tooltip copy.
- Tooltip copy should describe the next action when state can change.
- Selects and listboxes must support expected keyboard behavior: Escape closes, Enter or Space selects.
- Hidden `sr-only` inputs need visible focus styling on their wrapper.
- Prefer checkbox-style toggles over rounded switch styling.
- Copy buttons should reserve label width, announce success or failure with `aria-live`, and avoid layout shift.

### Forms And Inputs

- Labels should be close to their fields and remain visible unless the pattern is intentionally compact.
- Required fields need a text or symbol cue, not color alone.
- Helper text and error text should sit near the field they explain.
- Validation errors use border plus copy; focus styling must remain visible on error.
- Group related fields in one stack or panel instead of scattering them across separate cards.

### State Model

- Design these states before polishing visuals: default, hover, active, focus-visible, selected, disabled, loading, success, error, empty.
- Focus is not selection. Selection is not hover. Active is not success.
- The focus ring is reserved for keyboard focus.
- Standard artifact controls should default to tokenized keyboard focus:
  `focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1`, with the
  offset color matching the surrounding surface. Use another visible focus treatment only when a ring would be clipped
  or visually wrong for that surface.
- Use `focus-visible` for keyboard focus; do not clip focus rings.
- Selection should use its own channel: bar, marker, explicit label, or checked state (note 007).
- A background shift may support selection, but must not be the only selected-state cue.
- Feedback states may override hover and focus styling, but must not hide focus.
- For composite rows and menu items, define hover, focus-visible, active, and selected separately. Hover should stay
  quiet, focus-visible must remain visible when the item is also hovered, active is pressed feedback only, and selected
  is persistent. Compose hover+focus rules intentionally so hover does not weaken keyboard focus.
- Counts, highlights, enabled state, and actions should come from the same eligibility predicate.

### Motion

- Use motion only to clarify cause and effect.
- Avoid repeated, decorative, bouncy, or attention-seeking animation.
- Respect `prefers-reduced-motion`.
- Layout stability matters more than animation.

### Charts And Visualizations

- Charts should preserve comparison before decoration.
- Use clear axes, labels, legends, and units.
- Keep chart palettes restrained; reserve semantic colors for semantic meaning.
- Tooltips should be available through hover and keyboard focus when chart marks are interactive.
- Use stable dimensions, aspect ratios, or container queries so resizing does not distort the data story.

### Literal Output

Use these rules for artifacts that render conversations, logs, commands, code, model output, tool output, or telemetry.

- User-authored or source text should preserve whitespace and remain copyable as raw source.
- Assistant or narrative markdown may render as sanitized markdown.
- Tool, command, and metadata output should render as literal preformatted text.
- Token counts, timings, statuses, and telemetry should use structured UI, not markdown.
- Copy actions should preserve the underlying source, not only the rendered view.
- Search highlighting must not corrupt code blocks, inline code, or raw output.
- Markdown render failures should fall back to literal text.

### Copy

- Keep copy concise and precise.
- Use direct labels.
- Prefer specific verbs: copy, filter, reset, export, compare, expand.
- Empty states should say what happened and the next useful action.
- Error states should say what failed and how to recover.
- Do not explain obvious UI mechanics in the UI.
- Keep developer-facing output literal when formatting could change meaning.
- Copied or exported developer-facing output should be pasteable for the primary use case, complete enough to avoid reconstruction, and explicit about assumptions such as selectors, theme surfaces, required tokens, or browser features.
- Links in app chrome should stay low-noise; links in prose need a non-color affordance.

### Class Composition

- Use plain `className="..."` strings for static class lists.
- Use `mergeClassNames(...)` only when composing fixed classes with conditionals, variants, or caller-provided class overrides.
- Do not wrap a single static class string in `mergeClassNames(...)`; `tailwind-merge` is for resolving real composition conflicts.

## Do's and Don'ts

### Do:

- **Do** check light and dark themes, long labels, long values, and empty states before calling a design done.
- **Do** record a recurring exception or gotcha as a numbered note in `design/UI_IMPLEMENTATION_NOTES.md`. Isolated domain objects need no ceremony.

### Don't:

- **Don't** use glass, blur, glow, shadows, decorative gradients, or floating card clutter.
- **Don't** render untrusted HTML. Sanitize rendered markdown, and fall back to literal text if rendering fails.
- **Don't** add another required design doc. Extend this file or add a numbered note.
