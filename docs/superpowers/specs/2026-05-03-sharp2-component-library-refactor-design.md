# Sharp2 Component Library Refactor Design

## Goal

Refactor `src/artifacts/sharp2` from a long single-file showcase into a smaller artifact shell backed by shared Sharp UI primitives and focused local showcase/conversation modules.

The refactor should make reusable primitives available from `src/components` where they are mature enough, remove duplicated local primitive implementations from `sharp2`, and keep domain-specific conversation rendering local to `sharp2` until another artifact proves a broader reuse need.

## Current State

`src/artifacts/sharp2/index.tsx` is currently a 2,428-line artifact entry. It mixes:

- Local primitive definitions (`Button`, `Input`, `Tag`, `Panel`, `Row`, `Checkbox`, `Toggle`, `CopyButton`, `CopyableLabel`, `StatusTag`, `Modal`).
- Showcase-only wrappers (`Section`, `SubSection`, `SearchInput`, `Popover`, `CodeBlock`).
- Conversation rendering (`MessageCard`, `ToolCall`, `TokenCounter`, `ConversationTurn`, `MessageTypeToggle`).
- Markdown segmentation/rendering helpers.
- Sample search results and sample conversation data.
- Top-level artifact state and layout composition.

The artifact mostly aligns with the Sharp Minimal design direction: tokenized surfaces, square geometry, opaque backgrounds, border-driven hierarchy, role/category tokens, stable dynamic labels, and terminal-adjacent conversation rendering. Remaining issues are primarily architectural duplication, incomplete shared primitive adoption, a few focus/accessibility gaps, and stale documentation in `sharp2.txt`.

## Design Direction

Use a hybrid library boundary.

Promote mature generic primitives into `src/components`, improve existing shared primitives where needed, and keep showcase/domain components inside `src/artifacts/sharp2`.

This avoids two bad outcomes:

- A local-only split that leaves reusable primitives trapped inside `sharp2`.
- A repo-wide design-system rewrite that promotes components before their semantics are clear.

## Shared Components

### Existing Shared Components To Reuse

`sharp2` should replace local implementations with existing shared components:

- `src/components/Checkbox.tsx`
- `src/components/Toggle.tsx`
- `src/components/CopyButton.tsx`
- `src/components/CopyableLabel.tsx`
- `src/components/StatusTag.tsx`
- `src/components/ArtifactDialog.tsx`

`Checkbox` and `Toggle` are not drop-in replacements because `sharp2` currently uses `onChange(event)` while shared components use `onCheckedChange(checked)`. The implementation should update call sites rather than weakening the shared API.

`CopyButton`, `CopyableLabel`, and `StatusTag` cover current `sharp2` usage. `ArtifactDialog` should replace the local `Modal` wrapper directly at the call site, preserving the portal container inside `ArtifactThemeRoot`.

### Existing Shared Component Improvements

Before or during replacement, improve shared components where the review found clear gaps:

- `Checkbox` and `Toggle`: remove disabled `pointer-events-none` if it prevents disabled cursor or tooltip behavior. Disabled controls should keep `cursor-not-allowed` and should not look clickable.
- `Toggle`: add visual parity with the local implementation for unchecked hover border, unchecked active surface, and checked active state.
- `CopyableLabel`: add an `ariaLabel` prop or default stable accessible name such as `Copy: ${value}` so the accessible name does not change to only `Copy`, `Copied`, or `Failed`.
- `CopyableLabel`: preserve active-state background parity with local `sharp2`.
- `StatusTag`: add a named export while preserving the default export, for consistency with the other shared primitives.

## New Shared Components

Promote these `sharp2` primitives to `src/components` after improving their APIs and contracts:

- `Button`
- `Input`
- `Tag`
- `Panel`

Do not promote `Row` in this pass.

### Button

Path: `src/components/Button.tsx`

Public API:

```ts
export type ButtonVariant = 'default' | 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};
```

Requirements:

- Use `forwardRef`.
- Use `useArtifactThemeGuard`.
- Default native `type` to `button`.
- Use only shared tokens for color.
- Keep square geometry, no shadow, no radius.
- Keep stable heights for each size.
- Preserve visible `focus-visible` ring with tokenized ring and offset.
- Preserve visible hover and active states.
- Disabled state must not look clickable and should keep useful cursor/tooltip behavior.
- Icon-only button usage must provide an accessible name at the call site.

### Input

Path: `src/components/Input.tsx`

Public API:

```ts
export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
};
```

Requirements:

- Use `forwardRef`.
- Use `useArtifactThemeGuard`.
- Generate an id when none is provided.
- Keep visible labels close to fields.
- Wire `label` with `htmlFor`.
- Wire helper and error copy through `aria-describedby`.
- Set `aria-invalid` when `error` is present.
- Preserve focus ring on error.
- Let native disabled/read-only props pass through.
- Avoid ambiguous class ownership: `className` applies to the root, `inputClassName` applies to the input.

### Tag

Path: `src/components/Tag.tsx`

Public API:

```ts
export type TagVariant = 'base' | 'muted' | 'solid';

export type TagProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: TagVariant;
};
```

Requirements:

- Render a non-interactive `span`.
- Use `useArtifactThemeGuard`.
- Pass native span attributes through.
- Keep compact square metadata styling.
- Do not add pointer cursor, focus behavior, or button-like affordances.
- Use `StatusTag` for stateful status semantics and action-state patterns.

### Panel

Path: `src/components/Panel.tsx`

Public API:

```ts
export type PanelVariant = 'default' | 'muted' | 'dashed';

export type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: PanelVariant;
};
```

Requirements:

- Use `forwardRef`.
- Use `useArtifactThemeGuard`.
- Pass native div attributes through.
- Stay structural: no default padding, no radius, no shadow.
- `default` is a bordered opaque surface.
- `muted` is a muted grouping surface.
- `dashed` is reserved for empty, placeholder, or drop-zone style states.

## Row Decision

Keep `Row` local to `sharp2` for now.

The current row is not generic enough for `src/components`: it always renders a button, assumes click selection, has no disabled state, and does not choose between `aria-selected`, `aria-current`, or `aria-pressed`. Repeated-row semantics vary across artifacts: static rows, navigation rows, action rows, selected rows, listbox options, and table-like rows should not all share one vague primitive.

If a shared row is needed later, design it explicitly as something like `ActionRow` with a clear semantic contract.

## Sharp2 Local Modules

After shared primitives are in place, split `src/artifacts/sharp2` into focused modules.

Recommended file layout:

```txt
src/artifacts/sharp2/
  index.tsx
  meta.ts
  sharp2.txt
  sharp2-migration-guide.md
  fixtures.tsx
  components/
    CodeBlock.tsx
    Popover.tsx
    Row.tsx
    SearchInput.tsx
    Section.tsx
    SubSection.tsx
  conversation/
    ConversationTurn.tsx
    MessageCard.tsx
    MessageTypeToggle.tsx
    TokenCounter.tsx
    ToolCall.tsx
    markdown.tsx
    types.ts
```

`src/artifacts/sharp2/index.tsx` should become the showcase shell:

- `ArtifactThemeRoot`.
- Top-level demo state.
- Section composition.
- Dialog portal container.
- Wiring between fixtures, shared primitives, and local components.

It should not define primitive internals, sample fixtures, markdown parsing, or conversation rendering internals inline.

## Local Component Requirements

### Section And SubSection

These are showcase layout helpers, not general primitives. Keep them local.

They should use tokenized surfaces, simple borders, compact headings, and no nested-card ceremony beyond what the showcase needs.

### SearchInput

Keep local. It is a demo combobox/typeahead, not a mature shared primitive.

Before promoting it later, harden keyboard behavior and ARIA semantics. In this pass, fix obvious focus styling so options do not rely on hover-only or `focus:` states where `focus-visible`/active state would better match the design guide.

### Popover

Keep local. It demonstrates overlay behavior but is not yet a general menu/listbox abstraction.

Fix hover-only menu items by adding visible focus states and expected keyboard behavior where practical for the current demo.

### CodeBlock

Keep local unless another artifact needs the exact same code display primitive.

It should continue to use literal text, tokenized surfaces, copy behavior through shared `CopyButton`, and horizontal scroll for code.

### Conversation Components

Keep all conversation rendering local to `sharp2` in this pass:

- `MessageCard`
- `ToolCall`
- `TokenCounter`
- `ConversationTurn`
- `MessageTypeToggle`
- Markdown segmentation/rendering helper
- Conversation types

These components are promising, but they encode domain-specific assumptions about user/assistant/thinking/tool roles, render-mode defaults, token counters, and tool-call structure. They should not become repo-wide APIs until another artifact needs them or a clearer conversation package boundary emerges.

## Documentation

Update `src/artifacts/sharp2/sharp2.txt` so it matches the new component direction:

- Mention `ArtifactThemeRoot` as the required token boundary.
- Explain that token-dependent shared components must render under that boundary.
- Replace copy-paste guidance with import-and-compose guidance for shared primitives.
- Keep the Sharp UI rules, token examples, and terminal-adjacent rendering guidance.

Update `src/artifacts/sharp2/sharp2-migration-guide.md` after implementation to reflect completed shared primitive adoption and remaining local-only decisions.

## Testing Strategy

Add focused tests rather than broad snapshot churn.

### Shared Primitive Tests

Add SSR/static tests for:

- `Button`: default `type="button"`, variant/size classes, focus ring, disabled behavior, and accessible-name expectation for icon-only examples.
- `Input`: generated/custom id behavior, label association, `aria-invalid`, `aria-describedby`, helper/error rendering, and focus/error class coexistence.
- `Tag`: renders as `span`, variant class coverage, pass-through native attributes, and no button-like affordances.
- `Panel`: variant class coverage, pass-through native attributes, no radius/shadow classes, and default border/surface styling.

Add regression tests for existing shared components:

- `Checkbox` and `Toggle`: disabled classes keep `cursor-not-allowed` without blocking disabled cursor/tooltip behavior.
- `Toggle`: unchecked hover/active and checked active classes are present.
- `CopyableLabel`: accessible name remains stable and includes the copied value.
- `StatusTag`: named export works if added while default export remains valid.

### Sharp2 Tests

Add static/boundary tests for:

- `sharp2/index.tsx` imports replaced primitives from `src/components`.
- Local duplicate primitive definitions no longer exist for `Checkbox`, `Toggle`, `CopyButton`, `CopyableLabel`, `StatusTag`, `Button`, `Input`, `Tag`, or `Panel`.
- `Row` remains local and is not exported from `src/components`.
- `sharp2.txt` mentions `ArtifactThemeRoot`.
- `sharp2.txt` no longer recommends blind copy-paste of token-dependent components.

Add local behavior tests for:

- Conversation visibility filtering in `ConversationTurn`.
- Render-mode defaults by role in `MessageCard`.
- Markdown/code-block segmentation so code blocks remain literal and inline markdown does not corrupt raw text.
- Stable keys for supplied conversation ids where helpers are exported for testing.

## Review And Implementation Workflow

Implementation should use fresh subagent review at meaningful boundaries:

1. Review shared-component improvements before replacing `sharp2` call sites.
2. Review newly promoted `Button`, `Input`, `Tag`, and `Panel` APIs before broad adoption.
3. Review the final `sharp2` split for design regressions, stale duplicate code, and unnecessary promotion.

Subagents should be given disjoint scopes and should not edit the same files concurrently unless explicitly assigned non-overlapping write ownership.

## Verification

Before completion, run:

```bash
npm run lint
npm run typecheck
npm run test
```

Run `npm run check` before opening a PR.

Visual verification should include `/?artifact=sharp2` in light and dark mode, with keyboard tabbing through controls to verify focus rings, disabled states, copy states, dialog behavior, popover behavior, search options, and conversation controls.

## Out Of Scope

- Promoting conversation components to `src/components`.
- Promoting `Row` to `src/components`.
- Turning `SearchInput` or `Popover` into general shared primitives.
- Adding a Storybook setup or external design-system package.
- Redesigning the Sharp visual language beyond the current tokenized sharp-minimal direction.
