### When it applies
- A user preference is stored, but constraints force a different visible mode.
- Options are hidden/disabled when space or capability is limited.

### Recommended pattern
- Preserve the stored preference, but derive a visible mode for UI state and ARIA.
- Drive active/selected styling from the visible mode so the UI never shows "no option selected".

```tsx
const visibleLayoutMode = !canUseTwoColumns
  ? 'one-column'
  : canUseThreeColumns
    ? layoutMode
    : layoutMode === 'three-column'
      ? 'two-column'
      : layoutMode;

const isActive = visibleLayoutMode === 'two-column';
```

### Why it matters
- Prevents confusing states when a saved option disappears.
- Keeps accessibility (aria-pressed/aria-selected) consistent with what users see.

### Notes and pitfalls
- Don’t bind active states to stored preferences when options can disappear.
- Avoid mixing viewport breakpoints with container-driven constraints in the same control.

### Exceptions
- If a control truly represents a persisted preference (and not the current UI state), show it separately as a setting.

> Note: You don’t need every section for every entry; include only what’s useful.
