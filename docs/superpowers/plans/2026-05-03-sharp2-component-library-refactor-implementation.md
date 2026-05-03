# Sharp2 Component Library Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `src/artifacts/sharp2` into a smaller showcase shell backed by polished shared Sharp UI primitives and focused sharp2-local showcase/conversation modules.

**Architecture:** Promote mature generic primitives (`Button`, `Input`, `Tag`, `Panel`) to `src/components`, reuse existing shared primitives after targeted improvements, and keep `Row`, `SearchInput`, `Popover`, `CodeBlock`, fixtures, and conversation rendering local to `src/artifacts/sharp2`. Implement in layers so shared component contracts are tested before sharp2 adopts them, then split the monolith into local modules without changing visual behavior.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4 utility classes, lucide-react, Node test runner, Biome, knip.

---

## Scope Check

This plan implements `docs/superpowers/specs/2026-05-03-sharp2-component-library-refactor-design.md`.

In scope:
- Polish existing shared components used by sharp2.
- Add shared `Button`, `Input`, `Tag`, and `Panel`.
- Replace sharp2 duplicate primitives with shared imports.
- Keep `Row`, `SearchInput`, `Popover`, `CodeBlock`, and all conversation components local to sharp2.
- Split `src/artifacts/sharp2/index.tsx` into focused files.
- Update sharp2 docs and migration guide.
- Add focused static and behavior tests.

Out of scope:
- Promoting `Row` to `src/components`.
- Promoting conversation components to `src/components`.
- Turning `SearchInput` or `Popover` into shared primitives.
- Adding Storybook or external design-system tooling.

## Execution Notes

When using Codex subagents for this plan:
- Spawn workers with `fork_context: false`.
- Use `gpt-5.5` with `xhigh` reasoning effort.
- Assign disjoint write ownership per task.
- When waiting on subagents, use `timeout_ms: 3600000`.
- Do not let two workers edit the same file at the same time.

## File Structure

Create shared components:
- `src/components/Button.tsx`: shared Sharp button primitive using `mergeClassNames` for caller overrides.
- `src/components/Input.tsx`: shared Sharp text input primitive using `mergeClassNames`; requires either a visible `label`, `aria-label`, or `aria-labelledby`.
- `src/components/Tag.tsx`: shared non-interactive metadata tag using `mergeClassNames`.
- `src/components/Panel.tsx`: shared structural surface using `mergeClassNames`; no interactive affordances unless rendered through a native control outside `Panel`.

Modify shared components:
- `src/components/Checkbox.tsx`: disabled cursor behavior and unchecked active parity.
- `src/components/Toggle.tsx`: disabled cursor behavior and hover/active parity.
- `src/components/CopyButton.tsx`: disabled cursor behavior.
- `src/components/CopyableLabel.tsx`: stable accessible label and active parity.
- `src/components/StatusTag.tsx`: named export plus default export.

Create sharp2 local modules:
- `src/artifacts/sharp2/fixtures.tsx`: sample search results, sample conversation, item counts.
- `src/artifacts/sharp2/components/Section.tsx`: showcase section wrapper.
- `src/artifacts/sharp2/components/SubSection.tsx`: showcase subsection wrapper.
- `src/artifacts/sharp2/components/Row.tsx`: sharp2-local action/select row.
- `src/artifacts/sharp2/components/SearchInput.tsx`: sharp2-local combobox demo.
- `src/artifacts/sharp2/components/Popover.tsx`: sharp2-local popover demo.
- `src/artifacts/sharp2/components/CodeBlock.tsx`: sharp2-local code block demo.
- `src/artifacts/sharp2/conversation/types.ts`: conversation and render-mode types.
- `src/artifacts/sharp2/conversation/keys.ts`: `getTurnKey` and `getTurnItemKey`.
- `src/artifacts/sharp2/conversation/markdown.tsx`: markdown/code segmentation and inline rendering helpers.
- `src/artifacts/sharp2/conversation/TokenCounter.tsx`: local token counter renderer.
- `src/artifacts/sharp2/conversation/ToolCall.tsx`: local tool call renderer.
- `src/artifacts/sharp2/conversation/MessageTypeToggle.tsx`: local message type filter toggle.
- `src/artifacts/sharp2/conversation/MessageCard.tsx`: local message renderer.
- `src/artifacts/sharp2/conversation/ConversationTurn.tsx`: local turn renderer.

Modify sharp2 shell/docs:
- `src/artifacts/sharp2/index.tsx`: reduced shell and showcase composition.
- `src/artifacts/sharp2/sharp2.txt`: docs updated for `ArtifactThemeRoot` and import-and-compose usage.
- `src/artifacts/sharp2/sharp2-migration-guide.md`: checklist updated after migration.

Tests:
- `tests/components/sharedPrimitives.test.ts`: existing shared primitive regressions.
- `tests/components/corePrimitives.test.ts`: new shared primitive contracts.
- `tests/sharp2/boundary.test.ts`: duplicate primitive/import/doc boundary checks.
- `tests/sharp2/conversation.test.ts`: local conversation helper and rendering behavior.

## Task 0: Record Implementation Base

**Files:**
- No tracked file changes.

- [ ] **Step 1: Record the starting commit for final review**

Run:

```bash
git rev-parse HEAD > .git/sharp2-refactor-base
cat .git/sharp2-refactor-base
```

Expected: prints the commit SHA at the start of implementation. Do not add `.git/sharp2-refactor-base` to git; it lives under `.git`.

## Task 1: Tighten Existing Shared Primitives

**Files:**
- Create: `tests/components/sharedPrimitives.test.ts`
- Modify: `src/components/Checkbox.tsx`
- Modify: `src/components/Toggle.tsx`
- Modify: `src/components/CopyButton.tsx`
- Modify: `src/components/CopyableLabel.tsx`
- Modify: `src/components/StatusTag.tsx`

- [ ] **Step 1: Write failing shared primitive regression tests**

Create `tests/components/sharedPrimitives.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Checkbox } from '../../src/components/Checkbox';
import { CopyButton } from '../../src/components/CopyButton';
import { CopyableLabel } from '../../src/components/CopyableLabel';
import StatusTag from '../../src/components/StatusTag';
import { Toggle } from '../../src/components/Toggle';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function firstElementClass(markup: string) {
  const className = markup.match(/^<[^>]+class="([^"]+)"/)?.[1];
  assert.ok(className, `Expected first element to have class markup: ${markup}`);
  return className;
}

test('disabled shared checkbox and toggle preserve disabled cursor without pointer-events-none', () => {
  const checkbox = renderToStaticMarkup(
    createElement(Checkbox, {
      label: 'Disabled checkbox',
      checked: false,
      disabled: true,
      onCheckedChange: () => undefined,
    }),
  );
  const toggle = renderToStaticMarkup(
    createElement(Toggle, {
      label: 'Disabled toggle',
      checked: false,
      disabled: true,
      onCheckedChange: () => undefined,
    }),
  );

  const checkboxRootClass = firstElementClass(checkbox);
  const toggleRootClass = firstElementClass(toggle);

  assert.match(checkboxRootClass, /cursor-not-allowed/);
  assert.doesNotMatch(checkboxRootClass, /pointer-events-none/);
  assert.match(toggleRootClass, /cursor-not-allowed/);
  assert.doesNotMatch(toggleRootClass, /pointer-events-none/);
});

test('shared toggle and checkbox include active-state parity classes', () => {
  const checkbox = renderToStaticMarkup(
    createElement(Checkbox, {
      label: 'Checkbox',
      checked: false,
      onCheckedChange: () => undefined,
    }),
  );
  const toggleOff = renderToStaticMarkup(
    createElement(Toggle, {
      label: 'Toggle',
      checked: false,
      onCheckedChange: () => undefined,
    }),
  );
  const toggleOn = renderToStaticMarkup(
    createElement(Toggle, {
      label: 'Toggle',
      checked: true,
      onCheckedChange: () => undefined,
    }),
  );

  assert.match(checkbox, /active:bg-\[var\(--surface-pressed\)\]/);
  assert.match(toggleOff, /hover:border-\[color:var\(--border-strong\)\]/);
  assert.match(toggleOff, /active:bg-\[var\(--surface-pressed\)\]/);
  assert.match(toggleOn, /active:bg-\[var\(--primary-active\)\]/);
});

test('disabled shared copy button preserves disabled cursor without pointer-events-none', () => {
  const markup = renderToStaticMarkup(createElement(CopyButton, { text: 'value', disabled: true }));
  const rootClass = firstElementClass(markup);

  assert.match(rootClass, /cursor-not-allowed/);
  assert.doesNotMatch(rootClass, /pointer-events-none/);
});

test('copyable label keeps a stable accessible name for the copied value', () => {
  const markup = renderToStaticMarkup(createElement(CopyableLabel, { value: '~/projects/app' }));

  assert.match(markup, /aria-label="Copy: ~\/projects\/app"/);
  assert.match(markup, /active:bg-\[var\(--copy-hover-bg\)\]/);
});

test('StatusTag supports default and named imports', async () => {
  const module = await import('../../src/components/StatusTag');

  assert.equal(module.StatusTag, StatusTag);

  const markup = renderToStaticMarkup(createElement(module.StatusTag, { label: 'Connected', active: true }));
  assert.match(markup, /Connected/);
});
```

- [ ] **Step 2: Run tests and verify they fail for the current contracts**

Run:

```bash
node --import tsx --test tests/components/sharedPrimitives.test.ts
```

Expected: FAIL. Failures should mention the missing `StatusTag` named export and at least one class or `aria-label` mismatch.

- [ ] **Step 3: Update disabled and active classes**

Make these targeted class changes:

- In `src/components/Checkbox.tsx`, change the disabled root class from `opacity-50 pointer-events-none cursor-not-allowed` to `opacity-50 cursor-not-allowed`.
- In `src/components/Checkbox.tsx`, change unchecked active class from `active:bg-[var(--surface-strong)]` to `active:bg-[var(--surface-pressed)]`.
- In `src/components/Toggle.tsx`, change the disabled root class from `opacity-50 pointer-events-none cursor-not-allowed` to `opacity-50 cursor-not-allowed`.
- In `src/components/Toggle.tsx`, add unchecked `hover:border-[color:var(--border-strong)] active:bg-[var(--surface-pressed)]`.
- In `src/components/Toggle.tsx`, add checked `active:bg-[var(--primary-active)]`.
- In `src/components/CopyButton.tsx`, change disabled class from `disabled:opacity-40 disabled:pointer-events-none` to `disabled:opacity-40 disabled:cursor-not-allowed`.
- In `src/components/CopyableLabel.tsx`, include `active:bg-[var(--copy-hover-bg)]` in both idle and hover tones.
- Export the public prop types for shared primitive API consumers by changing `type CheckboxProps`, `type ToggleProps`, `type CopyButtonProps`, `type CopyableLabelProps`, and `type StatusTagProps` to `export type ...`.

The changed class snippets should look like:

```ts
// Checkbox disabled root
disabled && 'opacity-50 cursor-not-allowed'

// Checkbox unchecked tone support
checked
  ? 'active:bg-[var(--checkbox-on-bg)]'
  : 'hover:border-[color:var(--border-strong)] active:bg-[var(--surface-pressed)]'

// Toggle disabled root
disabled && 'opacity-50 cursor-not-allowed'

// Toggle checked / unchecked tone support
checked
  ? 'active:bg-[var(--primary-active)]'
  : 'hover:border-[color:var(--border-strong)] active:bg-[var(--surface-pressed)]'

// CopyButton disabled support
'disabled:opacity-40 disabled:cursor-not-allowed'
```

- [ ] **Step 4: Add stable CopyableLabel accessible name**

In `src/components/CopyableLabel.tsx`, add `ariaLabel?: string` to props and set `aria-label` on the button:

```ts
type CopyableLabelProps = {
  value: string;
  icon?: ReactNode;
  className?: string;
  reserveLabel?: string;
  copiedLabel?: string;
  failedLabel?: string;
  hoverLabel?: string;
  showHoverOnFocus?: boolean;
  ariaLabel?: string;
};
```

Add `ariaLabel` to the function destructuring:

```ts
export function CopyableLabel({
  value,
  icon,
  className,
  reserveLabel,
  copiedLabel = 'Copied ✓',
  failedLabel = 'Failed ✗',
  hoverLabel = 'Copy',
  showHoverOnFocus = true,
  ariaLabel,
}: CopyableLabelProps) {
```

Add this resolved label near the other derived values:

```ts
const resolvedAriaLabel = ariaLabel?.trim() || `Copy: ${value}`;
```

Add `aria-label` to the existing `<button>`:

```tsx
<button
  ref={rootRef}
  type="button"
  aria-label={resolvedAriaLabel}
  onClick={handleCopy}
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
  onFocus={handleFocus}
  onBlur={handleBlur}
  title={`Copy: ${value}`}
  className={[
    'inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border transition-colors motion-reduce:transition-none cursor-pointer',
    'rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
    'focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
    tone,
    className,
  ]
    .filter(Boolean)
    .join(' ')}
>
```

- [ ] **Step 5: Add named StatusTag export**

In `src/components/StatusTag.tsx`, change the component declaration and export shape:

```tsx
export function StatusTag({
  label,
  reserveLabel,
  active = true,
  icon,
  helper,
  showState = true,
  className,
}: StatusTagProps) {
  // existing body
}

export default StatusTag;
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
node --import tsx --test tests/components/sharedPrimitives.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run typecheck for shared component contracts**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit shared primitive polish**

Run:

```bash
git add tests/components/sharedPrimitives.test.ts src/components/Checkbox.tsx src/components/Toggle.tsx src/components/CopyButton.tsx src/components/CopyableLabel.tsx src/components/StatusTag.tsx
git commit -m "Polish shared sharp primitives"
```

## Task 2: Add Shared Button, Input, Tag, And Panel

**Files:**
- Create: `src/components/Button.tsx`
- Create: `src/components/Input.tsx`
- Create: `src/components/Tag.tsx`
- Create: `src/components/Panel.tsx`
- Create: `tests/components/corePrimitives.test.ts`

- [ ] **Step 1: Write failing tests for promoted primitives**

Create `tests/components/corePrimitives.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Panel } from '../../src/components/Panel';
import { Tag } from '../../src/components/Tag';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

test('Button defaults to type button and exposes sharp states', () => {
  const markup = renderToStaticMarkup(createElement(Button, { variant: 'primary' }, 'Save'));

  assert.match(markup, /type="button"/);
  assert.match(markup, /border-\[var\(--primary\)\]/);
  assert.match(markup, /focus-visible:ring-2/);
  assert.match(markup, /active:bg-\[var\(--primary-active\)\]/);
});

test('Button supports disabled cursor without pointer-events-none', () => {
  const markup = renderToStaticMarkup(createElement(Button, { disabled: true }, 'Disabled'));

  assert.match(markup, /disabled:cursor-not-allowed/);
  assert.doesNotMatch(markup, /disabled:pointer-events-none/);
});

test('Input wires generated label and error description', () => {
  const markup = renderToStaticMarkup(
    createElement(Input, {
      label: 'Email',
      error: 'Invalid email address',
      placeholder: 'email@example.com',
    }),
  );

  const labelFor = markup.match(/<label[^>]*for="([^"]+)"/)?.[1];
  const inputId = markup.match(/<input[^>]*id="([^"]+)"/)?.[1];

  assert.ok(labelFor);
  assert.equal(inputId, labelFor);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /aria-describedby="[^"]*error/);
  assert.match(markup, /Invalid email address/);
});

test('Input preserves custom id and helper text description', () => {
  const markup = renderToStaticMarkup(
    createElement(Input, {
      id: 'workspace-name',
      label: 'Workspace',
      helperText: 'Use a short readable name.',
    }),
  );

  assert.match(markup, /for="workspace-name"/);
  assert.match(markup, /id="workspace-name"/);
  assert.match(markup, /aria-describedby="workspace-name-helper"/);
  assert.match(markup, /Use a short readable name\./);
});

test('Input supports compact accessible names without relying on placeholder text', () => {
  const markup = renderToStaticMarkup(
    createElement(Input, {
      'aria-label': 'Filter projects',
      placeholder: 'Search',
    }),
  );

  assert.match(markup, /aria-label="Filter projects"/);
  assert.doesNotMatch(markup, /<label/);
});

test('Tag renders non-interactive metadata span variants', () => {
  const base = renderToStaticMarkup(createElement(Tag, { variant: 'base', title: 'Branch' }, 'main'));
  const muted = renderToStaticMarkup(createElement(Tag, { variant: 'muted' }, 'v2.4.1'));
  const solid = renderToStaticMarkup(createElement(Tag, { variant: 'solid' }, 'Active'));

  assert.match(base, /^<span/);
  assert.match(base, /title="Branch"/);
  assert.match(base, /border-\[var\(--border\)\]/);
  assert.match(muted, /bg-\[var\(--surface-strong\)\]/);
  assert.match(solid, /bg-\[var\(--primary\)\]/);
  assert.doesNotMatch(`${base}${muted}${solid}`, /cursor-pointer|focus-visible/);
});

test('Panel renders structural surfaces without padding radius or shadow', () => {
  const markup = renderToStaticMarkup(createElement(Panel, { variant: 'dashed', 'data-testid': 'panel' }, 'Empty'));

  assert.match(markup, /^<div/);
  assert.match(markup, /data-testid="panel"/);
  assert.match(markup, /border-dashed/);
  assert.doesNotMatch(markup, /rounded|shadow|p-[0-9]|cursor-pointer|hover:bg|active:bg/);
});
```

- [ ] **Step 2: Run tests and verify missing modules fail**

Run:

```bash
node --import tsx --test tests/components/corePrimitives.test.ts
```

Expected: FAIL with module resolution errors for `src/components/Button`, `Input`, `Tag`, and `Panel`.

- [ ] **Step 3: Create `Button.tsx`**

Create `src/components/Button.tsx`:

```tsx
import {
  type ButtonHTMLAttributes,
  type ForwardedRef,
  forwardRef,
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useRef,
} from 'react';
import { mergeClassNames } from '../lib/classNames';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type ButtonVariant = 'default' | 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
};

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  if (ref) {
    (ref as MutableRefObject<T | null>).current = value;
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant = 'default', size = 'md', disabled, type = 'button', className, ...props },
  ref,
) {
  const rootRef = useRef<HTMLButtonElement>(null);
  useArtifactThemeGuard('Button', rootRef);

  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const variants: Record<ButtonVariant, string> = {
    default:
      'border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] active:border-[var(--border-strong)]',
    primary:
      'border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-contrast)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]',
    ghost:
      'border border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-strong)] active:bg-[var(--surface-pressed)]',
    danger:
      'border border-[color:var(--danger)] bg-[var(--surface)] text-[var(--danger)] hover:bg-[var(--danger-weak)] active:bg-[var(--danger-weak)]',
  };
  const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-sm',
  };

  return (
    <button
      ref={setRef}
      type={type}
      disabled={disabled}
      className={mergeClassNames(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors motion-reduce:transition-none cursor-pointer rounded-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
```

- [ ] **Step 4: Create `Input.tsx`**

Create `src/components/Input.tsx`:

```tsx
import {
  type ForwardedRef,
  forwardRef,
  type InputHTMLAttributes,
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useId,
  useMemo,
  useRef,
} from 'react';
import { mergeClassNames } from '../lib/classNames';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

type InputAccessibleName =
  | { label: ReactNode; 'aria-label'?: string; 'aria-labelledby'?: string }
  | { label?: undefined; 'aria-label': string; 'aria-labelledby'?: string }
  | { label?: undefined; 'aria-label'?: string; 'aria-labelledby': string };

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'aria-label' | 'aria-labelledby'> & {
  helperText?: ReactNode;
  error?: ReactNode;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
} & InputAccessibleName;

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  if (ref) {
    (ref as MutableRefObject<T | null>).current = value;
  }
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    helperText,
    error,
    className,
    inputClassName,
    labelClassName,
    'aria-describedby': ariaDescribedBy,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useArtifactThemeGuard('Input', rootRef);

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = useMemo(
    () => [ariaDescribedBy, helperId, errorId].filter(Boolean).join(' ') || undefined,
    [ariaDescribedBy, helperId, errorId],
  );

  return (
    <div ref={rootRef} className={mergeClassNames('space-y-1', className)}>
      {label && (
        <label htmlFor={inputId} className={mergeClassNames('block text-xs font-medium text-[var(--text-muted)]', labelClassName)}>
          {label}
        </label>
      )}
      <input
        ref={setInputRef}
        id={inputId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={mergeClassNames(
          'h-9 w-full border bg-[var(--surface)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)]',
          'focus:outline-none focus-visible:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
          error ? 'border-[color:var(--danger)]' : 'border-[var(--border)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          inputClassName,
        )}
        {...props}
      />
      {helperText && (
        <p id={helperId} className="text-xs text-[var(--text-muted)]">
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
});
```

- [ ] **Step 5: Create `Tag.tsx`**

Create `src/components/Tag.tsx`:

```tsx
import { type HTMLAttributes, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type TagVariant = 'base' | 'muted' | 'solid';

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: TagVariant;
};

export function Tag({ children, variant = 'base', className, ...props }: TagProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  useArtifactThemeGuard('Tag', rootRef);

  const variants: Record<TagVariant, string> = {
    base: 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
    muted: 'border border-transparent bg-[var(--surface-strong)] text-[var(--text-muted)]',
    solid: 'border border-transparent bg-[var(--primary)] text-[var(--primary-contrast)]',
  };

  return (
    <span
      ref={rootRef}
      className={mergeClassNames('inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-none', variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 6: Create `Panel.tsx`**

Create `src/components/Panel.tsx`:

```tsx
import { type ForwardedRef, forwardRef, type HTMLAttributes, type MutableRefObject, useCallback, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type PanelVariant = 'default' | 'muted' | 'dashed';

export type PanelProps = HTMLAttributes<HTMLDivElement> & {
  variant?: PanelVariant;
};

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  if (ref) {
    (ref as MutableRefObject<T | null>).current = value;
  }
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { children, variant = 'default', className, ...props },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  useArtifactThemeGuard('Panel', rootRef);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const variants: Record<PanelVariant, string> = {
    default: 'border border-[var(--border)] bg-[var(--surface)]',
    muted: 'bg-[var(--surface-muted)]',
    dashed: 'border border-dashed border-[var(--border-strong)] bg-[var(--surface)]',
  };

  return (
    <div ref={setRef} className={mergeClassNames(variants[variant], className)} {...props}>
      {children}
    </div>
  );
});
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
node --import tsx --test tests/components/corePrimitives.test.ts
```

Expected: PASS.

- [ ] **Step 8: Run component test group**

Run:

```bash
node --import tsx --test tests/components/*.test.ts tests/app/artifactListItem.test.ts
```

Expected: PASS.

- [ ] **Step 9: Run formatter on new shared components**

Run:

```bash
npx biome check --write src/components/Button.tsx src/components/Input.tsx src/components/Tag.tsx src/components/Panel.tsx tests/components/corePrimitives.test.ts
```

Expected: command exits `0` and only the listed files are formatted.

- [ ] **Step 10: Run typecheck for exported component APIs**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 11: Commit promoted primitives**

Run:

```bash
git add src/components/Button.tsx src/components/Input.tsx src/components/Tag.tsx src/components/Panel.tsx tests/components/corePrimitives.test.ts
git commit -m "Add shared sharp core primitives"
```

## Task 3: Replace Duplicate Primitives In Sharp2

**Files:**
- Modify: `src/artifacts/sharp2/index.tsx`
- Create: `tests/sharp2/boundary.test.ts`

- [ ] **Step 1: Write failing sharp2 boundary tests**

Create `tests/sharp2/boundary.test.ts`:

```ts
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

const sharp2Dir = 'src/artifacts/sharp2';
const sharedPrimitiveNames = ['Checkbox', 'Toggle', 'CopyButton', 'CopyableLabel', 'StatusTag', 'Button', 'Input', 'Tag', 'Panel'];

async function readSharp2SourceFiles(dir = sharp2Dir): Promise<Array<{ file: string; source: string }>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: Array<{ file: string; source: string }> = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await readSharp2SourceFiles(entryPath)));
      continue;
    }
    if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue;
    files.push({ file: entryPath, source: await readFile(entryPath, 'utf8') });
  }

  return files;
}

test('sharp2 no longer defines primitives that belong to src/components', async () => {
  const files = await readSharp2SourceFiles();
  const joined = files.map(({ file, source }) => `\n// ${file}\n${source}`).join('\n');

  for (const name of sharedPrimitiveNames) {
    assert.doesNotMatch(joined, new RegExp(`function ${name}\\\\b`), `${name} should not be defined under sharp2`);
    assert.doesNotMatch(joined, new RegExp(`const ${name}\\\\b`), `${name} should not be defined under sharp2`);
  }
});

test('sharp2 imports shared primitives from src/components at usage sites', async () => {
  const files = await readSharp2SourceFiles();
  const joined = files.map(({ source }) => source).join('\n');

  for (const name of ['Button', 'Input', 'Tag', 'Panel', 'Checkbox', 'Toggle', 'CopyButton', 'CopyableLabel']) {
    assert.match(joined, new RegExp(`import \\\\{[^}]*${name}[^}]*\\\\} from ['\\"](?:\\\\.\\\\.\\\\/)+components\\\\/${name}['\\"]`));
  }
  assert.match(joined, /import \{ StatusTag \} from ['"](?:\.\.\/)+components\/StatusTag['"]/);
});

test('Row remains sharp2-local and is not exported from src/components', async () => {
  const files = await readSharp2SourceFiles();
  const joined = files.map(({ source }) => source).join('\n');

  assert.match(joined, /function Row\b|export function Row\b/);

  await assert.rejects(readFile('src/components/Row.tsx', 'utf8'), /ENOENT/);
});

test('sharp2 keeps Panel structural instead of adding interactive affordances to it', async () => {
  const source = await readFile('src/artifacts/sharp2/index.tsx', 'utf8');

  assert.doesNotMatch(source, /<Panel\b[^>]*className="[^"]*(?:cursor-pointer|hover:bg|active:bg)/s);
});
```

- [ ] **Step 2: Run boundary test and verify it fails**

Run:

```bash
node --import tsx --test tests/sharp2/boundary.test.ts
```

Expected: FAIL because `src/artifacts/sharp2/index.tsx` still defines local duplicate primitives.

- [ ] **Step 3: Import shared primitives in `sharp2/index.tsx`**

Add imports near the existing shared imports:

```tsx
import { ArtifactDialog } from '../../components/ArtifactDialog';
import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { Button } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { CopyButton } from '../../components/CopyButton';
import { CopyableLabel } from '../../components/CopyableLabel';
import { Input } from '../../components/Input';
import { Panel } from '../../components/Panel';
import { StatusTag } from '../../components/StatusTag';
import { Tag } from '../../components/Tag';
import { Toggle } from '../../components/Toggle';
```

- [ ] **Step 4: Remove local duplicate types and functions**

In `src/artifacts/sharp2/index.tsx`, remove the complete local declarations named:

- `TagVariant`
- `ButtonVariant`
- `ButtonSize`
- `PanelVariant`
- `CopyButtonStatus`
- `CopyableLabelStatus`
- `StatusTagProps`
- `TagProps`
- `ButtonProps`
- `InputProps`
- `CheckboxProps`
- `ToggleProps`
- `PanelProps`
- `CopyButtonProps`
- `CopyableLabelProps`
- `ModalProps`

Also remove the complete local function declarations named:

- `StatusTag`
- `Tag`
- `Button`
- `Input`
- `Checkbox`
- `Toggle`
- `Panel`
- `CopyButton`
- `CopyableLabel`
- `Modal`

Keep local `Row`, `SearchInput`, `Popover`, `CodeBlock`, and conversation functions in this task.

- [ ] **Step 5: Update Checkbox and Toggle call sites**

Change each sharp2 `Checkbox` call from event handlers to boolean handlers:

```tsx
<Checkbox
  label="Show hidden files"
  reserveLabel="Show hidden files"
  checked={checkboxes.a}
  onCheckedChange={(checked) => setCheckboxes((s) => ({ ...s, a: checked }))}
/>
```

```tsx
<Checkbox
  label="Enable auto-save"
  reserveLabel="Enable auto-save"
  checked={checkboxes.b}
  onCheckedChange={(checked) => setCheckboxes((s) => ({ ...s, b: checked }))}
/>
```

```tsx
<Checkbox
  label="Disabled option"
  reserveLabel="Disabled option"
  checked={checkboxes.c}
  onCheckedChange={(checked) => setCheckboxes((s) => ({ ...s, c: checked }))}
  disabled
/>
```

```tsx
<Toggle
  label="Dark mode"
  reserveLabel="Notifications"
  checked={toggles.a}
  onCheckedChange={(checked) => setToggles((s) => ({ ...s, a: checked }))}
/>
```

```tsx
<Toggle
  label="Notifications"
  reserveLabel="Notifications"
  checked={toggles.b}
  onCheckedChange={(checked) => setToggles((s) => ({ ...s, b: checked }))}
/>
```

```tsx
<Checkbox label="Checkbox" checked={demoCheckbox} onCheckedChange={setDemoCheckbox} />
```

- [ ] **Step 6: Replace local Modal usage with ArtifactDialog**

Replace the modal demo block with direct `ArtifactDialog` usage:

```tsx
<ArtifactDialog
  open={modalOpen}
  onOpenChange={(nextOpen) => {
    if (!nextOpen) setModalOpen(false);
  }}
  title="Confirm Action"
  closeLabel="Close modal"
  container={dialogPortalRef.current}
  placement="viewport"
  align="center"
  contentClassName="max-w-md shadow-none"
  bodyClassName="p-4"
>
  <p className="mb-4 text-sm text-[var(--text-muted)]">
    Are you sure you want to proceed? This action cannot be undone.
  </p>
  <div className="flex justify-end gap-2">
    <Button variant="ghost" onClick={() => setModalOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={() => setModalOpen(false)}>
      Confirm
    </Button>
  </div>
</ArtifactDialog>
```

- [ ] **Step 7: Fix Button, Input, and structural Panel call sites**

Change `size="default"` to omitted `size` or `size="md"`.

For the icon-only ghost button in the Buttons section, add an accessible name:

```tsx
<Button variant="ghost" size="sm" aria-label="Copy example">
  <CopyIcon className="h-3.5 w-3.5" aria-hidden="true" />
</Button>
```

For compact inputs without a visible label, add an accessible name instead of relying on placeholder text:

```tsx
<Input aria-label="Example text input" placeholder="Enter text..." />
```

```tsx
<Input aria-label="Keyboard focus example input" placeholder="Input" className="w-40" />
```

Do not pass interactive classes to shared `Panel`. In the sidebar example, use native buttons for navigation rows:

```tsx
<div className="space-y-1">
  <button type="button" className="w-full cursor-pointer px-2 py-1.5 text-left text-sm text-[var(--text)] bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]">
    Sessions
  </button>
  <button type="button" className="w-full cursor-pointer px-2 py-1.5 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]">
    Workspaces
  </button>
  <button type="button" className="w-full cursor-pointer px-2 py-1.5 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]">
    Settings
  </button>
</div>
```

In the "Stacked panels (interactive rows)" example, replace interactive `Panel` elements with the sharp2-local `Row`:

```tsx
<Row className="justify-between border-l-transparent">
  <span className="text-sm text-[var(--text)]">First item</span>
  <Tag variant="muted">Active</Tag>
</Row>
```

Repeat the same `Row` shape for "Second item" and "Third item".

- [ ] **Step 8: Run focused tests and typecheck**

Run:

```bash
node --import tsx --test tests/components/sharedPrimitives.test.ts tests/components/corePrimitives.test.ts tests/sharp2/boundary.test.ts
npm run typecheck
```

Expected: both commands PASS.

- [ ] **Step 9: Commit sharp2 primitive replacement**

Run:

```bash
git add src/artifacts/sharp2/index.tsx tests/sharp2/boundary.test.ts
git commit -m "Use shared primitives in sharp2"
```

## Task 4: Extract Sharp2 Showcase Components

**Files:**
- Create: `src/artifacts/sharp2/components/Section.tsx`
- Create: `src/artifacts/sharp2/components/SubSection.tsx`
- Create: `src/artifacts/sharp2/components/Row.tsx`
- Create: `src/artifacts/sharp2/components/SearchInput.tsx`
- Create: `src/artifacts/sharp2/components/Popover.tsx`
- Create: `src/artifacts/sharp2/components/CodeBlock.tsx`
- Modify: `src/artifacts/sharp2/index.tsx`
- Modify: `tests/sharp2/boundary.test.ts`

**Current source map at plan commit `19a1e45`:**
- `Section`: `SectionCols` at `src/artifacts/sharp2/index.tsx:24`, `SectionProps` at `:87-91`, `colsClass` and `Section` at `:287-302`.
- `SubSection`: `SubSectionProps` at `src/artifacts/sharp2/index.tsx:93-97`, `SubSection` at `:304-310`.
- `Row`: `RowProps` at `src/artifacts/sharp2/index.tsx:152-157`, `Row` at `:666-693`.
- `SearchInput`: `SearchResult` at `src/artifacts/sharp2/index.tsx:35-40`, `SearchInputProps` at `:99-109`, `getSearchResultKey` at `:266-269`, `SearchInput` at `:466-664`.
- `CodeBlock`: `CodeBlockProps` at `src/artifacts/sharp2/index.tsx:178-181`, `CodeBlock` at `:862-876`.
- `Popover`: `PopoverTriggerProps` and `PopoverProps` at `src/artifacts/sharp2/index.tsx:191-204`, `Popover` at `:902-960`.

Task 3 changes will shift line numbers; before editing, re-run this source-map query if a range no longer lines up. Move the named declarations only and leave unrelated showcase JSX in `index.tsx`.

```bash
rg -n "^type Section|^const colsClass|^function Section|^type SubSection|^function SubSection|^type RowProps|^function Row|^type SearchResult|^const getSearchResultKey|^function SearchInput|^type Popover|^function Popover|^type CodeBlockProps|^function CodeBlock" src/artifacts/sharp2/index.tsx
```

- [ ] **Step 1: Move `Section` to its own file**

Create `src/artifacts/sharp2/components/Section.tsx` by moving the existing `SectionCols`, `SectionProps`, `colsClass`, and `Section` code from `index.tsx`.

The file should export:

```tsx
import type { ReactNode } from 'react';

type SectionCols = 1 | 2 | 3;

type SectionProps = {
  title: string;
  children: ReactNode;
  cols?: SectionCols;
};

const colsClass: Record<SectionCols, string> = {
  1: '',
  2: 'grid grid-cols-2 gap-6',
  3: 'grid grid-cols-3 gap-6',
};

export function Section({ title, children, cols = 1 }: SectionProps) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</h2>
      </div>
      <div className={`p-6 ${colsClass[cols] ?? ''}`}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Move `SubSection` to its own file**

Create `src/artifacts/sharp2/components/SubSection.tsx`:

```tsx
import type { ReactNode } from 'react';

type SubSectionProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function SubSection({ label, children, className }: SubSectionProps) {
  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-subtle)]">{label}</div>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Move `Row` to its own file**

Create `src/artifacts/sharp2/components/Row.tsx` by moving the local `RowProps` and `Row` implementation. Keep it sharp2-local and do not export it from `src/components`.

The exported shape should be:

```tsx
import type { MouseEventHandler, ReactNode } from 'react';

type RowProps = {
  children: ReactNode;
  selected?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

export function Row({ children, selected, onClick, className }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'flex w-full cursor-pointer items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-[background-color] motion-reduce:transition-none',
        'focus:outline-none focus-visible:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
        'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)]',
        selected ? 'border-l-[var(--accent)] bg-[var(--surface-muted)]' : 'border-l-transparent',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Move `SearchInput` to its own file and tighten combobox semantics**

Create `src/artifacts/sharp2/components/SearchInput.tsx` by moving `SearchResult`, `SearchInputProps`, `getSearchResultKey`, and `SearchInput`.

Add the imports needed by the moved component:

```tsx
import { Search as SearchIcon } from 'lucide-react';
import { type ChangeEventHandler, type FocusEventHandler, type KeyboardEventHandler, type ReactNode, useEffect, useId, useState } from 'react';
```

Keep the input as the only keyboard focus target for the combobox. The input should retain `role="combobox"`, `aria-expanded`, `aria-controls`, and `aria-activedescendant`; result options should be non-focusable elements with `role="option"` and `aria-selected`, not focusable `<button role="option">` controls.

Use this option shape inside the listbox:

```tsx
<div
  key={getSearchResultKey(result)}
  id={`${listboxId}-option-${index}`}
  role="option"
  aria-selected={activeIndex === index}
  onMouseDown={(event) => {
    event.preventDefault();
    onSelect?.(result);
  }}
  className={[
    'flex w-full cursor-pointer items-center gap-3 border-b border-[color:var(--border)] px-3 py-2 text-left last:border-b-0',
    'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)]',
    activeIndex === index ? 'bg-[var(--surface-muted)]' : '',
  ]
    .filter(Boolean)
    .join(' ')}
>
  {/* keep the existing title/subtitle/meta/icon contents */}
</div>
```

Remove the old focus-target option class:

```ts
'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] focus:bg-[var(--surface-muted)] focus:outline-none'
```

Do not replace it with `focus-visible:*` on the options; the input owns keyboard focus and `activeIndex` owns the highlighted option state.

- [ ] **Step 5: Move `Popover` to its own file and add menu semantics**

Create `src/artifacts/sharp2/components/Popover.tsx` by moving `PopoverTriggerProps`, `PopoverProps`, and `Popover`.

Keep the trigger's `aria-haspopup="menu"` and add `aria-controls` that points at the popup id when open. Render the popup wrapper with `role="menu"` and `aria-orientation="vertical"`:

```tsx
{open && (
  <div
    id={menuId}
    role="menu"
    aria-orientation="vertical"
    className="absolute top-full left-0 z-10 mt-1 min-w-[200px] border border-[var(--border)] bg-[var(--surface)]"
  >
    {children}
  </div>
)}
```

When `open` becomes true, focus the first descendant with `[role="menuitem"]`. When Escape closes the popover, return focus to the trigger if the trigger is still mounted.

Add this local helper export for menu item classes:

```ts
export const popoverMenuItemClass =
  'w-full cursor-pointer px-2 py-1.5 text-left text-sm hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] focus:outline-none focus-visible:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]';
```

Use `popoverMenuItemClass` for the three menu item buttons in `index.tsx`, append `text-[var(--text)]` or `text-[var(--danger)]`, and add `role="menuitem"` to each button.

- [ ] **Step 6: Move `CodeBlock` to its own file**

Create `src/artifacts/sharp2/components/CodeBlock.tsx` by moving `CodeBlockProps` and `CodeBlock`. Import shared `CopyButton`:

```tsx
import { CopyButton } from '../../../components/CopyButton';
```

- [ ] **Step 7: Update `index.tsx` imports and remove moved definitions**

In `src/artifacts/sharp2/index.tsx`, add:

```tsx
import { CodeBlock } from './components/CodeBlock';
import { Popover, popoverMenuItemClass } from './components/Popover';
import { Row } from './components/Row';
import { SearchInput, type SearchResult } from './components/SearchInput';
import { Section } from './components/Section';
import { SubSection } from './components/SubSection';
```

Remove the moved local definitions from `index.tsx`.

- [ ] **Step 8: Extend boundary tests for local SearchInput and Popover contracts**

In `tests/sharp2/boundary.test.ts`, add:

```ts
test('sharp2 SearchInput uses managed combobox focus instead of focusable option buttons', async () => {
  const source = await readFile('src/artifacts/sharp2/components/SearchInput.tsx', 'utf8');

  assert.match(source, /role="combobox"/);
  assert.match(source, /aria-expanded=/);
  assert.match(source, /aria-controls=/);
  assert.match(source, /aria-activedescendant=/);
  assert.match(source, /role="option"/);
  assert.match(source, /aria-selected=/);
  assert.doesNotMatch(source, /<button[^>]*role="option"/s);
  assert.doesNotMatch(source, /focus:bg-\[var\(--surface-muted\)\]/);
});

test('sharp2 Popover uses menu semantics and visible item focus styling', async () => {
  const source = await readFile('src/artifacts/sharp2/components/Popover.tsx', 'utf8');
  const indexSource = await readFile('src/artifacts/sharp2/index.tsx', 'utf8');

  assert.match(source, /aria-haspopup="menu"/);
  assert.match(source, /aria-expanded/);
  assert.match(source, /aria-controls/);
  assert.match(source, /role="menu"/);
  assert.match(source, /aria-orientation="vertical"/);
  assert.match(source, /Escape/);
  assert.match(source, /focus-visible:bg-\[var\(--surface-muted\)\]/);
  assert.match(source, /focus-visible:ring-2/);
  assert.match(indexSource, /role="menuitem"/);
});
```

- [ ] **Step 9: Run focused tests and typecheck**

Run:

```bash
node --import tsx --test tests/sharp2/boundary.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 10: Commit showcase component extraction**

Run:

```bash
git add src/artifacts/sharp2/index.tsx src/artifacts/sharp2/components tests/sharp2/boundary.test.ts
git commit -m "Extract sharp2 showcase components"
```

## Task 5: Extract Sharp2 Conversation Modules And Fixtures

**Files:**
- Create: `src/artifacts/sharp2/fixtures.tsx`
- Create: `src/artifacts/sharp2/conversation/types.ts`
- Create: `src/artifacts/sharp2/conversation/keys.ts`
- Create: `src/artifacts/sharp2/conversation/markdown.tsx`
- Create: `src/artifacts/sharp2/conversation/TokenCounter.tsx`
- Create: `src/artifacts/sharp2/conversation/ToolCall.tsx`
- Create: `src/artifacts/sharp2/conversation/MessageTypeToggle.tsx`
- Create: `src/artifacts/sharp2/conversation/MessageCard.tsx`
- Create: `src/artifacts/sharp2/conversation/ConversationTurn.tsx`
- Create: `tests/sharp2/conversation.test.ts`
- Modify: `src/artifacts/sharp2/index.tsx`

**Current source map at plan commit `19a1e45`:**
- Conversation types: `src/artifacts/sharp2/index.tsx:29-76`.
- Key helpers: `getTurnKey` and `getTurnItemKey` at `src/artifacts/sharp2/index.tsx:271-282`.
- Markdown helpers: `RenderErrorBoundary` at `src/artifacts/sharp2/index.tsx:1121-1132`, `renderInlineMarkdown` at `:1134-1177`, and fenced-code segmentation currently inside `MessageCard` at `:1261-1296`.
- Conversation components: `TokenCounter` at `src/artifacts/sharp2/index.tsx:964-1018`, `ToolCall` at `:1020-1092`, `MessageTypeToggle` at `:1094-1178`, `MessageCard` at `:1180-1378`, and `ConversationTurn` at `:1380-1455`.
- Fixtures: `allSearchResults` at `src/artifacts/sharp2/index.tsx:1479-1515` and `sampleConversation` at `:1546-1729`.
- Derived counts stay in `index.tsx`: `itemCounts` at `src/artifacts/sharp2/index.tsx:1737-1750` depends on component-local state and imported fixtures.

Task 3 and Task 4 changes will shift line numbers; before editing, re-run this source-map query if a range no longer lines up. Move the named declarations only and keep the main `DesignSystem` composition in `index.tsx`.

```bash
rg -n "allSearchResults|sampleConversation|getTurn(Key|ItemKey)|getDefaultRenderMode|renderInlineMarkdown|codeBlockRegex|RenderErrorBoundary|^type ToolCallStatus|^type MessageRole|^function TokenCounter|^function ToolCall|^function MessageTypeToggle|^function MessageCard|^function ConversationTurn" src/artifacts/sharp2/index.tsx
```

- [ ] **Step 1: Write failing conversation helper tests**

Create `tests/sharp2/conversation.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ConversationTurn } from '../../src/artifacts/sharp2/conversation/ConversationTurn';
import { getTurnItemKey, getTurnKey } from '../../src/artifacts/sharp2/conversation/keys';
import { getDefaultRenderMode, splitMessageContent } from '../../src/artifacts/sharp2/conversation/markdown';
import type { ConversationTurnData } from '../../src/artifacts/sharp2/conversation/types';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

test('splitMessageContent keeps fenced code blocks literal', () => {
  const parts = splitMessageContent('Intro\\n\\n```ts\\nconst value = `raw`;\\n```\\n\\nOutro');

  assert.deepEqual(
    parts.map((part) => part.type),
    ['text', 'code', 'text'],
  );
  assert.equal(parts[1]?.type, 'code');
  assert.equal(parts[1]?.content, 'const value = `raw`;\\n');
});

test('getDefaultRenderMode follows role defaults', () => {
  assert.equal(getDefaultRenderMode('user'), 'literal');
  assert.equal(getDefaultRenderMode('assistant'), 'rendered');
  assert.equal(getDefaultRenderMode('thinking'), 'rendered');
  assert.equal(getDefaultRenderMode('tool'), 'literal');
});

test('conversation key helpers prefer supplied ids', () => {
  const turn: ConversationTurnData = { id: 'turn-id', turnNumber: 1, items: [] };

  assert.equal(getTurnKey(turn), 'turn-id');
  assert.equal(getTurnItemKey({ id: 'message-id', role: 'user', content: 'Hi' }), 'message-id');
});

test('ConversationTurn filters hidden item types', () => {
  const turn: ConversationTurnData = {
    id: 'turn-1',
    turnNumber: 1,
    items: [
      { id: 'user', role: 'user', content: 'Question' },
      { id: 'thinking', role: 'thinking', content: 'Reasoning' },
      { id: 'tool', type: 'tool_call', tool: 'bash', input: 'npm test', output: 'PASS' },
      { id: 'assistant', role: 'assistant', content: 'Answer' },
    ],
  };

  const markup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: turn.turnNumber,
      items: turn.items,
      visibleTypes: {
        user: true,
        assistant: true,
        thinking: false,
        toolCalls: false,
        tokenCounters: true,
      },
    }),
  );

  assert.match(markup, /Question/);
  assert.match(markup, /Answer/);
  assert.doesNotMatch(markup, /Reasoning/);
  assert.doesNotMatch(markup, /npm test/);
});
```

- [ ] **Step 2: Run tests and verify missing modules fail**

Run:

```bash
node --import tsx --test tests/sharp2/conversation.test.ts
```

Expected: FAIL with module resolution errors for `src/artifacts/sharp2/conversation/*`.

- [ ] **Step 3: Create conversation types**

Create `src/artifacts/sharp2/conversation/types.ts`:

```ts
export type ToolCallStatus = 'success' | 'error' | 'pending';
export type MessageRole = 'user' | 'assistant' | 'thinking' | 'tool';
export type RenderMode = 'default' | 'literal' | 'rendered';

export type VisibleTypes = {
  user: boolean;
  assistant: boolean;
  thinking: boolean;
  toolCalls: boolean;
  tokenCounters: boolean;
};

export type MessageItem = {
  id?: string;
  role: MessageRole;
  content: string;
  timestamp?: string;
  type?: undefined;
};

export type TokenCounterItem = {
  id?: string;
  type: 'token_counter';
  used: number;
  limit: number;
  label?: string;
};

export type ToolCallItem = {
  id?: string;
  type: 'tool_call';
  tool: string;
  input: string;
  output: string;
  timestamp?: string;
  status?: ToolCallStatus;
};

export type TurnItem = MessageItem | TokenCounterItem | ToolCallItem;

export type ConversationTurnData = {
  id?: string;
  turnNumber: number;
  timestamp?: string;
  duration?: string;
  items: TurnItem[];
};
```

- [ ] **Step 4: Create key helpers**

Create `src/artifacts/sharp2/conversation/keys.ts`:

```ts
import type { ConversationTurnData, TurnItem } from './types';

export const getTurnKey = (turn: ConversationTurnData) => turn.id ?? `turn-${turn.turnNumber}-${turn.timestamp ?? ''}`;

export const getTurnItemKey = (item: TurnItem) => {
  if (item.id) return item.id;
  if (item.type === 'token_counter') {
    return `token-${item.label ?? 'context'}-${item.used}-${item.limit}`;
  }
  if (item.type === 'tool_call') {
    return `tool-${item.tool}-${item.timestamp ?? ''}-${item.input.length}-${item.output.length}`;
  }
  return `msg-${item.role}-${item.timestamp ?? ''}-${item.content.length}`;
};
```

- [ ] **Step 5: Create markdown helper**

Create `src/artifacts/sharp2/conversation/markdown.tsx` by extracting `RenderErrorBoundary`, `renderInlineMarkdown`, and message content segmentation from `MessageCard`.

Start with this file:

```tsx
import { Component, Fragment, type ReactNode } from 'react';
import type { MessageRole } from './types';

export type MessageContentPart =
  | { type: 'text'; content: string; start: number; end: number }
  | { type: 'code'; lang: string; content: string; start: number; end: number };

export function splitMessageContent(content: string): MessageContentPart[] {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts: MessageContentPart[] = [];
  let lastIndex = 0;
  let match = codeBlockRegex.exec(content);

  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
        start: lastIndex,
        end: match.index,
      });
    }

    parts.push({
      type: 'code',
      lang: match[1],
      content: match[2],
      start: match.index,
      end: match.index + match[0].length,
    });

    lastIndex = match.index + match[0].length;
    match = codeBlockRegex.exec(content);
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex),
      start: lastIndex,
      end: content.length,
    });
  }

  return parts;
}

export function getDefaultRenderMode(role: MessageRole): 'literal' | 'rendered' {
  return role === 'user' || role === 'tool' ? 'literal' : 'rendered';
}

export function renderInlineMarkdown(text: string, keyBase: string): ReactNode[] {
  const tokenRegex = /`[^`]+`|\*\*[^*]+\*\*/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(tokenRegex)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      nodes.push(<Fragment key={`${keyBase}-t-${cursor}`}>{text.slice(cursor, start)}</Fragment>);
    }

    const token = match[0];
    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={`${keyBase}-c-${start}`}
          className="bg-[var(--surface-strong)] border border-[var(--border)] px-1 py-0.5 text-[13px] text-[var(--text)]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(
        <strong key={`${keyBase}-b-${start}`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    }

    cursor = start + token.length;
  }

  if (cursor < text.length || nodes.length === 0) {
    nodes.push(<Fragment key={`${keyBase}-t-${cursor}`}>{text.slice(cursor)}</Fragment>);
  }

  return nodes;
}

export class RenderErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```

When creating `MessageCard.tsx`, keep the existing paragraph/list/heading rendering behavior from `src/artifacts/sharp2/index.tsx` and call `splitMessageContent(content)` instead of keeping code-block segmentation inline.

- [ ] **Step 6: Move conversation components**

Move existing implementations from `index.tsx` into these files, updating imports to shared/local modules:

- `TokenCounter.tsx`: import `CopyButton` from `../../../components/CopyButton`.
- `ToolCall.tsx`: import `ChevronRight` from `lucide-react`, `CopyButton`, shared `Tag`, and type `ToolCallStatus`.
- `MessageTypeToggle.tsx`: import `Check` from `lucide-react`.
- `MessageCard.tsx`: import `CopyButton`, `RenderErrorBoundary`, `renderInlineMarkdown`, `splitMessageContent`, and conversation types.
- `ConversationTurn.tsx`: import shared `Tag`, `TokenCounter`, `ToolCall`, `MessageCard`, `getTurnItemKey`, and conversation types.

Keep existing role colors, render defaults, and terminal-adjacent typography.

- [ ] **Step 7: Move fixtures**

Create `src/artifacts/sharp2/fixtures.tsx` and move:

- `allSearchResults`
- `sampleConversation`
- any static list data that does not depend on component state

Export `allSearchResults` and `sampleConversation` from `fixtures.tsx` with `satisfies SearchResult[]` and `satisfies ConversationTurnData[]`. Move the current entries from `index.tsx` without changing ids, titles, subtitles, meta values, icons, timestamps, roles, content, tool calls, or token counters.

Keep the demo list arrays local in JSX if extracting them would make the showcase harder to scan.

- [ ] **Step 8: Update `index.tsx` to import conversation modules and fixtures**

Add imports:

```tsx
import { ConversationTurn } from './conversation/ConversationTurn';
import { getTurnKey } from './conversation/keys';
import type { RenderMode, VisibleTypes } from './conversation/types';
import { allSearchResults, sampleConversation } from './fixtures';
```

Remove moved conversation types, key helpers, markdown helpers, conversation components, and fixture arrays from `index.tsx`.

- [ ] **Step 9: Run focused tests and typecheck**

Run:

```bash
node --import tsx --test tests/sharp2/conversation.test.ts tests/sharp2/boundary.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 10: Commit conversation extraction**

Run:

```bash
git add src/artifacts/sharp2/index.tsx src/artifacts/sharp2/fixtures.tsx src/artifacts/sharp2/conversation tests/sharp2/conversation.test.ts
git commit -m "Extract sharp2 conversation modules"
```

## Task 6: Update Sharp2 Documentation And Final Boundaries

**Files:**
- Modify: `src/artifacts/sharp2/sharp2.txt`
- Modify: `src/artifacts/sharp2/sharp2-migration-guide.md`
- Modify: `tests/sharp2/boundary.test.ts`

- [ ] **Step 1: Add documentation boundary tests**

In `tests/sharp2/boundary.test.ts`, add:

```ts
test('sharp2 documentation describes ArtifactThemeRoot and import-based shared components', async () => {
  const guide = await readFile('src/artifacts/sharp2/sharp2.txt', 'utf8');

  assert.match(guide, /ArtifactThemeRoot/);
  assert.match(guide, /import/i);
  assert.doesNotMatch(guide, /copy any component directly/i);
  assert.doesNotMatch(guide, /Copy Components Directly/i);
});
```

- [ ] **Step 2: Run boundary test and verify docs fail**

Run:

```bash
node --import tsx --test tests/sharp2/boundary.test.ts
```

Expected: FAIL because `sharp2.txt` still recommends direct copy-paste and does not mention `ArtifactThemeRoot`.

- [ ] **Step 3: Update `sharp2.txt` component usage guidance**

In `src/artifacts/sharp2/sharp2.txt`, remove every recommendation to "copy any component directly", including the intro paragraph near the top of the file, and replace it with import-and-compose language. Then replace the "Workflow 1: Copy Components Directly" section with import-based guidance:

```markdown
### Workflow 1: Import Shared Primitives

When you need a shared Sharp UI primitive in an artifact:

1. Wrap the artifact root with `ArtifactThemeRoot`.
2. Import the primitive from `src/components`.
3. Keep the primitive under the artifact theme boundary so tokens, focus rings, and shared component guards work.

Example:

```tsx
import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { Button } from '../../components/Button';

export default function Artifact() {
  return (
    <ArtifactThemeRoot className="min-h-screen bg-[var(--surface-muted)] text-[var(--text)]">
      <Button variant="primary">Save</Button>
    </ArtifactThemeRoot>
  );
}
```
```

Also update the component inventory so `Button`, `Input`, `Tag`, `Panel`, `Checkbox`, `Toggle`, `CopyButton`, `CopyableLabel`, and `StatusTag` are described as shared primitives, while `SearchInput`, `Popover`, `Row`, `CodeBlock`, and conversation components are described as sharp2-local showcase/domain examples.

- [ ] **Step 4: Update migration guide checklist**

In `src/artifacts/sharp2/sharp2-migration-guide.md`, mark shared primitive adoption items complete after the implementation:

```markdown
- [x] Replace local `Checkbox` with `src/components/Checkbox.tsx`.
- [x] Replace local `Toggle` with `src/components/Toggle.tsx`.
- [x] Replace local `CopyableLabel` with `src/components/CopyableLabel.tsx`.
- [x] Replace local `StatusTag` with `src/components/StatusTag.tsx`.
- [x] Remove unused local implementations after replacement.
```

Add a short note under the checklist:

```markdown
`Row`, `SearchInput`, `Popover`, `CodeBlock`, and conversation rendering remain sharp2-local because their semantics are not yet proven as shared APIs.
```

- [ ] **Step 5: Run documentation tests**

Run:

```bash
node --import tsx --test tests/sharp2/boundary.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit documentation updates**

Run:

```bash
git add src/artifacts/sharp2/sharp2.txt src/artifacts/sharp2/sharp2-migration-guide.md tests/sharp2/boundary.test.ts
git commit -m "Update sharp2 component library docs"
```

## Task 7: Final Verification And Visual Review

**Files:**
- Modify only if verification finds issues in files owned by earlier tasks.

- [ ] **Step 1: Run formatter and lint checks**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run knip**

Run:

```bash
npm run knip
```

Expected: PASS. If it reports unused files or exports from the refactor, either remove the unused export or add real usage/tests.

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 5: Run full check**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 6: Start Vite for visual review**

Run:

```bash
npm run dev -- --host 0.0.0.0 --port 5174
```

Expected: Vite starts and prints a local URL. If port `5174` is busy, use the next free port.

If opening through the exe.dev HTTPS proxy, follow `AGENTS.md` and set the documented runtime allow-host environment variable instead of committing VM-specific hosts:

```bash
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<vm-host>.exe.xyz npm run dev -- --host 0.0.0.0 --port 5174
```

- [ ] **Step 7: Review sharp2 visually**

Open:

```txt
http://localhost:5174/?artifact=sharp2
```

Verify:
- Light mode renders the showcase with tokenized surfaces.
- Dark mode preserves the same geometry and hierarchy.
- The shell's device controls still show usable tablet/mobile previews; mobile landscape should approximate desktop enough to scan the full showcase without text collisions.
- The fixed-size artifact preview constraint described in `README.md` does not hide clipped focus rings, popovers, or dialogs at the tested preview sizes.
- Keyboard tabbing shows visible unclipped focus rings.
- Disabled controls do not look clickable.
- Copy controls keep stable width and announce status.
- Modal opens/closes and stays inside the artifact theme boundary.
- Search options and popover menu items have visible focus states.
- Conversation filters, render toggles, tool call collapse, and copy controls still work.

- [ ] **Step 8: Stop Vite**

Stop the Vite dev server with `Ctrl-C`.

- [ ] **Step 9: Commit any verification fixes**

If Steps 1-7 required fixes, commit only those fixes:

```bash
git add src/components src/artifacts/sharp2 tests/components tests/sharp2
git commit -m "Fix sharp2 refactor verification issues"
```

If no files changed, do not create an empty commit.

## Task 8: Request Final Review

**Files:**
- No planned file changes.

- [ ] **Step 1: Capture review range**

Run:

```bash
BASE_SHA=$(cat .git/sharp2-refactor-base)
HEAD_SHA=$(git rev-parse HEAD)
printf 'Base: %s\nHead: %s\n' "$BASE_SHA" "$HEAD_SHA"
```

Expected: prints the implementation base commit recorded in Task 0 and the current head commit.

- [ ] **Step 2: Request fresh subagent review**

Dispatch a fresh reviewer with:
- `fork_context: false`
- model `gpt-5.5`
- reasoning effort `xhigh`

Review prompt:

```markdown
Review the completed sharp2 component library refactor in /home/exedev/src/github.com/rarestg/react-artifacts.

Compare the implementation against docs/superpowers/specs/2026-05-03-sharp2-component-library-refactor-design.md and docs/superpowers/plans/2026-05-03-sharp2-component-library-refactor-implementation.md.

Focus on:
1. Shared component APIs and design-doc compliance.
2. No duplicated primitive definitions under src/artifacts/sharp2/** for promoted/replaced primitives.
3. Row, SearchInput, Popover, CodeBlock, and conversation components remain sharp2-local.
4. Accessibility criteria: icon-only buttons, disabled cursor/tooltip behavior, focus-visible states, SearchInput/Popover ARIA.
5. Test coverage and verification commands.

Return Critical, Important, and Minor issues with exact file/line references. Do not edit files.
```

- [ ] **Step 3: Wait for review**

Wait with:

```txt
timeout_ms: 3600000
```

Expected: reviewer completes or reports no issues.

- [ ] **Step 4: Address review feedback**

If the reviewer reports Critical or Important issues, fix them before completion. Run the focused tests for the touched area and then `npm run check`.

- [ ] **Step 5: Final status**

Run:

```bash
git status --short
```

Expected: clean working tree, or only explicitly acknowledged user-owned changes.
