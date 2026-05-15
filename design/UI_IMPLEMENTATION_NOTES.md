# UI Implementation Notes

## Purpose
- A living, practical checklist of UI implementation decisions and patterns.
- Focus on Tailwind, layout behavior, responsive rules, and dynamic UI pitfalls.
- Add new entries as we encounter recurring issues.

## Index

| ID | Title | When to read | Keywords | Lines |
| --- | --- | --- | --- | --- |
| 001 | Single-Source Separators for Dynamic Children | Use when segmented controls/row groups add/remove items or toggle visibility. | tailwind, border, divide-x, gap-px, separators, dynamic children | 30-57 |
| 002 | Preference vs. Visible State | Use when constraints force a different visible mode than the saved preference. | responsive state, aria-pressed, persisted settings, derived mode | 58-73 |
| 003 | Conditional Control Stability | When adding mode-specific controls or disabling options based on context. | layout stability, conditional controls, disabled state, tooltips, toggle groups | 74-86 |
| 004 | Color-Mix Token Overrides | When colors look darker/lighter than their hex or token values. | color-mix, tokens, css variables, theme, overrides | 87-124 |
| 005 | Artifact Theme Boundary | When adding artifacts or using token-dependent shared components. | artifact-theme, ArtifactThemeRoot, tokens, shared components, theme boundary, focus ring | 125-157 |
| 006 | Semantic Control Choice and Action-State Clarity | When adding binary controls that trigger reversible actions or can become no-ops. | status tag, toggle semantics, tooltip copy, disabled controls, layout stability, action state | 158-202 |
| 007 | Stable Visual State Transitions | When controls or repeated items change selected/checked/active state across icons, indicators, counts, borders, or tone. | DOM stability, transitions, flicker, selected state, checked state, indicators, counts, color fading, category tones, metadata, color-mix | 203-270 |
| 008 | Composite Expandable Rows | When a disclosure row also needs copy, metadata, timestamp, or detail actions. | disclosure rows, nested buttons, copy controls, timestamps, expandable rows, accessibility | 271-290 |

## Format for new entries
- Title
- When it applies
- Recommended pattern (with a short code hint)
- Why it matters
- Exceptions (if any)

---

## 001 — Single-Source Separators for Dynamic Children

### When it applies
- Segmented controls, button groups, table rows, or any UI where children are added/removed dynamically.
- Layouts where options appear/disappear based on width or feature flags.

### Recommended pattern
- Use exactly one separator mechanism. Either:
  A) Parent-managed gaps with a separator background
     - Pattern: container with `bg-[var(--border)] gap-px` and children on `bg-[var(--surface)]`.
     - Example (Tailwind):
       `className="inline-flex border border-[var(--border-strong)] bg-[var(--border)] gap-px"`
  OR
  B) Child-managed borders (border-right on each child, remove on last).
     - Pattern: child `border-r` + `last:border-r-0` inside an overflow-hidden parent.

### Why it matters
- Mixing parent `divide-x`/`divide-y` with child borders causes double seams when children change.
- Dynamic insertion can briefly show darker lines due to overlapping borders and sub-pixel rounding.

### Notes and pitfalls
- If using the gap-based approach, avoid `p-px` unless you want a thicker outer frame.
  - `border + p-px` effectively becomes a 2px edge.
- For tables or row lists, do not combine `divide-y` with per-row bottom borders.
  - Pick one source of separation to avoid doubled lines when rows are filtered.

---

## 002 — Preference vs. Visible State

### When it applies
- A user preference is stored, but constraints force a different visible mode.
- Options are hidden/disabled when space or capability is limited.

### Recommended pattern
- Preserve the stored preference, but derive a visible mode for UI state and ARIA.
- Drive active/selected styling from the visible mode so the UI never shows 'no option selected'.

### Why it matters
- Prevents confusing states when a saved option disappears.
- Keeps accessibility (aria-pressed/aria-selected) consistent with what users see.

---

## 003 — Conditional Control Stability

When a control *governs* another control, keep the governor visually anchored. Avoid layout jogs when dependent options appear/disappear.

Guidelines
- Prefer **stable layouts**: if a mode toggle adds/removes options, keep the toggle in a fixed position. Use reserved width, a placeholder label, or swap labels in-place (e.g., "Format" → "Options") instead of shifting the toggle.
- If controls must be hidden, ensure the trigger **does not move**; otherwise consider disabling instead of hiding.
- Disabled controls should look disabled *and* explain why. Use muted text/opacity plus a short tooltip that changes with context.
- Keep control heights/visual language consistent within a row so mode changes don’t read as a style regression.
- When display vs copy semantics diverge (e.g., JSONL displayed as an array but copied as JSONL), make the behavior discoverable via labels/tooltips.

---

## 004 — Color-Mix Token Overrides

### When it applies
- Colors look darker/lighter than their hex definitions or token values.
- Weak variants (e.g., `*-weak`) appear inconsistent across palettes.
- You see differences between browsers that support `color-mix()` and those that do not.

### Recommended pattern
- Check `@supports (color: color-mix(...))` blocks: they override token values at runtime.
- If two token groups should match, **alias one to the other** instead of duplicating `color-mix()` formulas.
- Keep weak variants consistent: either all are derived via `color-mix()` or all are literal values.
- Use `*-text` tokens for colored text on matching `*-weak` backgrounds; do not assume the strong color has enough contrast.
- When debugging, inspect **computed** values in DevTools, not just the source hex.

```css
@supports (color: color-mix(in srgb, #000 50%, #fff 50%)) {
  .artifact-theme {
    --surface-strong: color-mix(in srgb, var(--surface) 75%, var(--border) 25%);
    /* ... */
  }
}
```

### Why it matters
- Prevents subtle palette drift (colors that are "close but off") across sections.
- Avoids cross-browser mismatches when `color-mix()` is supported.
- Keeps categorical and semantic palettes visually consistent when intended.

### Notes and pitfalls
- `color-mix()` overrides only apply in supporting browsers, so discrepancies can be environment-specific.
- If you alias categorical tokens to semantic tokens, do **not** override the aliases with separate `color-mix()` values.
- Mixing literal hex values with derived values can make two palettes look different even when the base hex codes match.

### Exceptions
- If you intentionally want a categorical palette to diverge from semantic tokens, define it explicitly and document the divergence.

---

## 005 — Artifact Theme Boundary

### When it applies
- Adding a new artifact root or refactoring an existing artifact container.
- Using shared components that assume Sharp UI tokens, such as Checkbox, Toggle, SegmentedControl, CopyButton,
  CopyableLabel, ListboxSelect, StatusTag, and ArtifactDialog.
- Debugging missing rings, black focus, or token-driven surfaces that look “off.”

### Recommended pattern
- Wrap the artifact root with `ArtifactThemeRoot` and pass root classes there; add `data-theme` on that same element
  only when the artifact declares palette overrides.
- Do **not** add `artifact-theme` manually inside artifacts; the root is the single boundary.
- If a shared component must render outside the boundary (shell/standalone), wrap that subtree intentionally or expect a dev warning.
- If you render UI via a portal, mount the portal container inside the artifact root so it inherits tokens.

### Why it matters
- Tokens are a contract; without the boundary, shared components silently degrade (rings, surfaces, and semantic colors).
- A single boundary keeps scope explicit and prevents theme drift across artifacts.

### Notes and pitfalls
- `data-theme` overrides only work when applied to the same element as `ArtifactThemeRoot`.
- Base-only artifacts can rely on the `.artifact-theme` token contract without adding `data-theme`.
- If a sharp control shows a browser-colored rounded outline, native outline or radius is leaking. Only suppress it when
  a visible token focus state replaces it.
- If a ring is black, currentColor, or otherwise unexpected, inspect computed `--ring`, confirm the subtree is inside
  `ArtifactThemeRoot`, and confirm the active theme defines `--ring`.
- Dev warnings are deduped per component; fix the root cause rather than suppressing logs.

### Exceptions
- The shell UI stays outside the boundary unless explicitly wrapped.

---

## 006 — Semantic Control Choice and Action-State Clarity

### When it applies
- A binary control toggles a reversible UI action (not a persisted setting), such as “apply transform” vs “undo transform.”
- The control can become a no-op based on current content/state (e.g., nothing eligible to act on).

### Recommended pattern
- Choose the control primitive by semantics:
  - Use **StatusTag-style clickable indicators** for action/status toggles.
  - Use **switch/toggle controls** for persisted settings/preferences.
- Keep control geometry stable across states:
  - Reserve label width (`reserveLabel`) and avoid label swapping that causes layout shift.
  - Prefer state signaling through indicator/tone first; keep wording stable when possible.
  - If icons change by state, keep icon slot size and placement fixed.
- Tooltips should describe the **next action in the current state** (for example: “Undo X” vs “Apply X”), not just the current state label.
- Disable controls when they cannot have an effect, and explain why in tooltip copy.
  - Example classes of reasons: missing input, no eligible targets.
- Drive count/highlight/enable/action from the **same eligibility predicate** so all UI signals stay consistent.

```tsx
const actionEnabled = eligibleCount > 0;
const actionTooltip = !hasInput
  ? 'Enter text to enable action'
  : !actionEnabled
    ? 'No eligible targets found'
    : isActive
      ? 'Undo action'
      : 'Apply action';
```

### Why it matters
- Prevents visual jitter and accidental mis-clicks in dense toolbars.
- Keeps reversible actions predictable and self-explanatory.
- Reduces confusion when controls are visible but currently inapplicable.

### Notes and pitfalls
- Avoid using switch-like controls for one-off reversible actions; this can imply a persisted preference.
- Avoid changing label, icon, and container size all at once between states.
- Avoid mismatched logic where counts/highlights indicate “0,” but action controls still appear enabled.

### Exceptions
- If the control truly represents a persisted preference, a switch/toggle is appropriate.

---

## 007 — Stable Visual State Transitions

### When it applies
- Controls, rows, chips, badges, or repeated items whose selected, checked, active, or expanded state changes multiple visual parts at once.
- UI where icons, indicators, counts, backgrounds, borders, or label tones transition between states.
- Compact controls that use category colors, metadata tones, weak selected backgrounds, or animated state feedback.

### Recommended pattern
- Treat the state change as one coordinated visual transition: container, indicator, icon, label, badge, and border should derive from the same semantic state or eligibility predicate.
- Keep stateful visual children mounted while colors transition. Hide an inactive icon by fading it or using
  visibility/opacity; avoid unmounting it mid-transition.
- Preserve layout slots for labels, icons, badges, and counts. Use reserved labels, fixed icon slots, `tabular-nums`, and minimum count widths where values change.
- Prefer surface or weak background shifts for selected state support, plus an explicit selected cue such as a checkbox, marker, bar, or icon. Do not rely on color alone.
- Use the quietest sufficient color channel:
  - strong tone for small indicators, checkbox fills, or outlines
  - weak tone for selected row or chip backgrounds
  - neutral or transparent outer borders when colored borders become too loud
- Keep tone APIs typed and token-backed. Prefer CSS variables over arbitrary caller-provided color class strings.
- Inspect computed colors in light and dark mode. `color-mix()` can make source-token intent misleading.
- Treat metadata as a neutral tone distinct from category or semantic colors.

### Code hint

```tsx
<Check
  aria-hidden="true"
  className={mergeClassNames(
    checkClassName ?? 'text-[var(--primary-contrast)]',
    checked ? 'opacity-100' : 'opacity-0',
    'transition-opacity motion-reduce:transition-none',
    'h-2.5 w-2.5',
  )}
/>
```

```tsx
<FilterCheckbox
  label="Token Counters"
  count={tokenCounterCount}
  checked={visibleTypes.tokenCounters}
  onCheckedChange={setTokenCountersVisible}
  tone="metadata"
  borderStyle="neutral"
/>
```

### Why it matters
- Conditional icon rendering can flicker when the icon unmounts before the square background finishes transitioning.
- Color-matching an icon to the unchecked background can also flash when the parent background is still transitioning
  from a checked tone back to the unchecked surface. Use opacity when the parent background color transitions.
- Layout movement during state changes makes dense tools harder to scan and easier to mis-click.
- Bright borders can overpower compact controls; a weak selected background plus a small colored indicator is often enough.
- Metadata needs visible affordance without reading as category, warning, success, or primary action.
- Stable count and icon areas preserve scanability across controls with different labels and changing values.

### Notes and pitfalls
- Inspect computed colors in light and dark mode. A neutral weak tone such as `--surface-strong` may be almost indistinguishable from the canvas after `color-mix()` overrides.
- If a neutral selected background needs more presence, mix from text over surface, for example `color-mix(in srgb, var(--text-muted) 22%, var(--surface) 78%)`.
- Align transition properties and timing across the parts that change together; avoid transitioning layout dimensions for state feedback.
- Always include `motion-reduce:transition-none` where animated transitions are used.
- For checkbox-style multi-select filters, keep checkbox semantics. Do not rename or rebuild them as toggles unless they represent a persisted binary preference.

### Exceptions
- If the checked mark represents expensive DOM or animation work, a stable placeholder with hidden visibility can still preserve layout and timing.
- If a filter has no count, omit the badge area rather than rendering an empty decorative box.

---

## 008 — Composite Expandable Rows

### When it applies
- Expandable rows, log rows, transcript events, or disclosure headers that also need copy, metadata, timestamp, or detail actions.
- Any composite row where the collapsed header is intended to be one large click target.

### Recommended pattern
- Keep the collapsed summary as a native button with `aria-expanded` and `aria-controls`.
- If the collapsed row needs timestamp, copy, status, or chevron controls, render those controls as siblings outside the summary button in a stable action cluster.
- Keep metadata inside the collapsed summary inert: badges, labels, preview text, and tags may display there, but copyable source metadata should move into the expanded details or into sibling controls outside the summary button.
- Reuse shared copy, timestamp, and icon-button control families for sibling row actions and expanded detail actions instead of creating row-specific controls.

### Why it matters
- Buttons inside buttons are invalid and produce confusing pointer, focus, and screen-reader behavior.
- `stopPropagation` patches hide the structural problem while leaving keyboard and accessibility edge cases behind.
- Splitting the summary button from sibling actions preserves a predictable expansion target while allowing legitimate row-level controls.

### Notes and pitfalls
- Do not add bespoke collapsed-row copy buttons to work around the disclosure structure.
- If a collapsed row needs one-click copying more than disclosure, it should not be modeled as a row-level disclosure.
- Do not use `stopPropagation` to make nested interactive controls appear to work; fix the structure by making controls siblings.
