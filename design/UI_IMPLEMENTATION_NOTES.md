# UI Implementation Notes

## Purpose
- A living, practical checklist of UI implementation decisions and patterns.
- Focus on Tailwind, layout behavior, responsive rules, and dynamic UI pitfalls.
- Add new entries as we encounter recurring issues.

## Index

| ID | Title | When to read | Keywords | Lines |
| --- | --- | --- | --- | --- |
| 001 | Single-Source Separators for Dynamic Children | Use when segmented controls/row groups add/remove items or toggle visibility. | tailwind, border, divide-x, gap-px, separators, dynamic children | 27-54 |
| 002 | Preference vs. Visible State | Use when constraints force a different visible mode than the saved preference. | responsive state, aria-pressed, persisted settings, derived mode | 55-70 |
| 003 | Conditional Control Stability | When adding mode-specific controls or disabling options based on context. | layout stability, conditional controls, disabled state, tooltips, toggle groups | 71-83 |
| 004 | Color-Mix Token Overrides | When colors look darker/lighter than their hex or token values. | color-mix, tokens, css variables, theme, overrides | 84-120 |
| 005 | Artifact Theme Boundary | When adding artifacts or using token-dependent shared components. | artifact-theme, ArtifactThemeRoot, tokens, shared components, theme boundary | 121-143 |

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
- Using shared components that assume Sharp UI tokens (Checkbox, Toggle, CopyableLabel, ListboxSelect, StatusTag).
- Debugging missing rings, black focus, or token-driven surfaces that look “off.”

### Recommended pattern
- Wrap the artifact root with `ArtifactThemeRoot` and pass root classes/`data-theme` there.
- Do **not** add `artifact-theme` manually inside artifacts; the root is the single boundary.
- If a shared component must render outside the boundary (shell/standalone), wrap that subtree intentionally or expect a dev warning.
- If you render UI via a portal, mount the portal container inside the artifact root so it inherits tokens.

### Why it matters
- Tokens are a contract; without the boundary, shared components silently degrade (rings, surfaces, and semantic colors).
- A single boundary keeps scope explicit and prevents theme drift across artifacts.

### Notes and pitfalls
- `data-theme` overrides only work when applied to the same element as `ArtifactThemeRoot`.
- Dev warnings are deduped per component; fix the root cause rather than suppressing logs.

### Exceptions
- The shell UI stays outside the boundary unless explicitly wrapped.
