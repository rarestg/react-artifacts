# UI Implementation Notes

## Purpose
- A living, practical checklist of UI implementation decisions and patterns.
- Focus on Tailwind, layout behavior, responsive rules, and dynamic UI pitfalls.
- Add new entries as we encounter recurring issues.

## Index

| ID | Title | When to read | Keywords | Lines |
| --- | --- | --- | --- | --- |
| 001 | Single-Source Separators for Dynamic Children | Use when segmented controls/row groups add/remove items or toggle visibility. | tailwind, border, divide-x, gap-px, separators, dynamic children | 25-52 |
| 002 | Preference vs. Visible State | Use when constraints force a different visible mode than the saved preference. | responsive state, aria-pressed, persisted settings, derived mode | 53-68 |
| 003 | Conditional Control Stability | When adding mode-specific controls or disabling options based on context. | layout stability, conditional controls, disabled state, tooltips, toggle groups | 69-78 |

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
