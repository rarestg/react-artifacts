# Sharp2 Migration Guide (ArtifactThemeRoot + Tokenization)

This guide tracks the migration of `sharp2` to the shared Sharp UI token system and `ArtifactThemeRoot`. It is a checklist you can use to mark progress and verify outcomes.

## Goals
- Put `sharp2` behind the explicit theme boundary (`ArtifactThemeRoot`).
- Replace hardcoded Tailwind colors with shared tokens.
- Align primitives, focus behavior, and accessibility with the Sharp UI guide.
- Keep the artifact as the source of truth for patterns and behaviors.

## Scope
- Files in scope: `src/artifacts/sharp2/index.tsx`, `src/artifacts/sharp2/sharp2.txt`
- Optional helper styles: `src/artifacts/sharp2/sharp2.css` if you want local role tokens

## Decisions to Lock Before Editing
- [x] Role color strategy for conversation rendering. (Using categorical tokens aliased to semantic palette.)
- [x] Shared primitives vs local primitives. (Local primitives retained for now; TODO to compare with shared components.)
- [x] Whether to add local role tokens in a scoped CSS file. (Not needed; using category tokens.)
- [x] Whether to introduce a local `--text-subtle` token for very muted copy. (Now part of the global token contract.)

## Checklist (Ordered)

### 1) Theme Boundary
- [x] Replace the root wrapper with `<ArtifactThemeRoot>` and keep existing layout classes.
- [~] Apply `bg-[var(--surface-muted)]` and `text-[var(--text)]` at the root.
  - Note: root uses `bg-[var(--surface-strong)]` to keep the existing muted canvas feel.

### 2) Role Colors (Conversation Rendering)
Pick one strategy for `MessageCard` borders, tool call accents, and role badges.
- [ ] Option A: add local role variables in `sharp2.css` (recommended).
- [x] Option B: map roles to category tokens (aliased to semantic palette).
- [x] Ensure role colors read in light and dark.

### 3) Shared Primitive Adoption (Recommended)
Prefer shared components to avoid drift.
- [ ] Replace local `Checkbox` with `src/components/Checkbox.tsx`.
- [ ] Replace local `Toggle` with `src/components/Toggle.tsx`.
- [ ] Replace local `CopyableLabel` with `src/components/CopyableLabel.tsx`.
- [ ] Replace local `StatusTag` with `src/components/StatusTag.tsx`.
- [ ] Remove unused local implementations after replacement.
  - Note: local primitives retained for now; a TODO in `sharp2` tracks consolidation.

### 4) Tokenization (Base Palette)
Replace hardcoded Tailwind colors with tokens throughout `index.tsx`.
- [x] `bg-white` → `bg-[var(--surface)]`.
- [x] `bg-slate-50` → `bg-[var(--surface-muted)]` when used as a container background.
- [~] `bg-slate-100` → `bg-[var(--surface-strong)]` for pressed and strong hover states.
  - Note: pressed states now use `bg-[var(--surface-pressed)]`.
- [x] `text-slate-900` → `text-[var(--text)]`.
- [~] `text-slate-600` / `text-slate-500` → `text-[var(--text-muted)]`.
  - Note: `text-slate-500` now maps to `--text-subtle` for extra resolution.
- [~] `text-slate-400` → `text-[var(--text-muted)]` or a local `--text-subtle` if needed.
  - Note: `--text-subtle` is now part of the global contract.
- [x] `border-slate-200` → `border-[var(--border)]`.
- [x] `border-slate-300` → `border-[var(--border-strong)]`.
- [x] `focus-visible:ring-slate-400` → `focus-visible:ring-[var(--ring)]`.
- [x] Add `ring-offset-[color:var(--surface)]` wherever a ring is used.

### 5) Semantic Colors
Replace semantic Tailwind colors with shared tokens.
- [x] Success: `emerald-*` → `var(--success)` / `var(--success-weak)`.
- [x] Warning: `amber-*` → `var(--warning)` / `var(--warning-weak)`.
- [x] Danger: `red-*` → `var(--danger)` / `var(--danger-weak)`.
- [x] Info or Accent: `blue-*` / `violet-*` → `var(--info)` or `var(--accent)` based on meaning.

### 6) Focus and Accessibility
Ensure focus-visible and a11y conventions match the style guide.
- [~] Add `focus-visible` ring to icon-only buttons and toggles.
  - Note: render toggle has a ring; remaining icon-only controls still need focus-visible.
- [~] Provide `aria-label` for icon-only controls.
  - Note: add labels for tool-call expand button, modal close button, and icon-only ghost button.
- [~] Replace `focus:` background styles with `focus-visible:` on row-like controls.
  - Note: search result rows still use `focus:` and need `focus-visible`.
- [~] Ensure hover affordances also appear on focus-visible.
  - Note: CopyableLabel now shows hover on focus; popover items still hover-only.
- [x] Ensure `focus-within` rings on checkbox/toggle containers use tokenized ring and offset.

### 7) Overlay, Modal, and Popover
- [x] Replace modal scrim `bg-slate-900/50` with `bg-[var(--overlay)]`.
- [x] Ensure modal surface uses tokenized border and surface colors.
- [ ] Ensure popover items have focus-visible states, not hover-only.

### 8) Remove Legacy Token Block
- [~] Delete the conceptual `tokens` object or replace it with a short comment pointing to shared tokens.
  - Note: `tokens` object retained as a tokenized reference block.

### 9) Documentation Update
Update the design narrative to match tokenized usage.
- [x] Replace hardcoded Slate examples in `sharp2.txt` with token examples.
- [ ] Mention `ArtifactThemeRoot` as the boundary requirement.
- [x] Update “forbidden” examples to show token-friendly equivalents.

### 10) Layout and Spacing Hygiene
- [ ] Use one spacing system per stack (`space-y-*` or `gap-*`).
- [ ] Remove mixed `mt-*`/`mb-*` when a parent already defines spacing.

## Verification
- [ ] Open `/?artifact=sharp2` in light mode.
- [ ] Toggle to dark mode and confirm parity.
- [ ] Tab through controls and confirm focus-visible rings are visible and unclipped.
- [ ] Verify no UA outlines, rounded corners, or shadows appear.
- [ ] Check that copy/hover/active states are still readable.
- [ ] Run `rg -n "slate-|emerald-|amber-|red-|blue-|violet-" src/artifacts/sharp2/index.tsx` to confirm no legacy colors remain.

## Notes
- If you add `sharp2.css`, keep it minimal and scoped to role tokens.
- Prefer semantic tokens; use `--accent` only for intentional emphasis.
- If you see a black ring, it usually indicates a missing `--ring` token or a stray `focus:outline` leak.
- `--surface-pressed` is now used for active states; keep `--surface-strong` for hover/strong grouping.

## Categorical Palette (Message Type Colors)
These are **categorical** colors for color-coding message types. They are not semantic status colors.
Already added to `src/theme/artifact-theme.css`; use them for message type filters, role borders, and badges.

Token set:
- `--category-blue` / `--category-blue-weak`
- `--category-green` / `--category-green-weak`
- `--category-amber` / `--category-amber-weak`
- `--category-violet` / `--category-violet-weak`
- `--category-red` / `--category-red-weak`

Suggested values:
```css
.artifact-theme {
  --category-blue: var(--accent);
  --category-green: var(--success);
  --category-amber: var(--warning);
  --category-violet: var(--info);
  --category-red: var(--danger);

  --category-blue-weak: var(--accent-weak);
  --category-green-weak: var(--success-weak);
  --category-amber-weak: var(--warning-weak);
  --category-violet-weak: var(--info-weak);
  --category-red-weak: var(--danger-weak);
}

// Note: categorical tokens currently alias the semantic palette.
```

Usage guidelines:
- Use `--category-*-weak` for selected row backgrounds or filter chips.
- Use `--category-*` for dots, left bars, or badges.
- Keep text labels in `--text` or `--text-muted` so color is not the only cue.
