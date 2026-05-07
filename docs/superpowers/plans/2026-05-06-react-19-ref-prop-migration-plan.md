# React 19 Ref Prop Migration Plan

> **For agentic workers:** This is a focused follow-up to the React Doctor triage plan. Do not mix this migration into small lint/accessibility cleanup work. Implement in batches, update checkboxes as work completes, and run tests after each batch.

**Goal:** Migrate shared and artifact-local React components from `forwardRef` to React 19 regular `ref` props where it improves long-term alignment, while preserving existing component contracts.

**Architecture:** This touches shared primitives and public component APIs. Treat refs as part of the contract: DOM-ref components should keep exposing the same DOM node; imperative-handle components should keep exposing the same handle; theme guards should keep receiving the correct DOM element.

**Tech Stack:** React 19.2, TypeScript, Vite, Tailwind CSS v4, Biome, Node test runner, React Doctor.

---

## Why This Is Deferred From React Doctor Triage

React Doctor reports:

- Rule: `react-doctor/no-react19-deprecated-apis`
- Message: `forwardRef is no longer needed on React 19+`

Current flagged files:

- `src/components/CopyButton.tsx`
- `src/components/Input.tsx`
- `src/components/Button.tsx`
- `src/components/ArtifactThemeRoot.tsx`
- `src/components/Panel.tsx`
- `src/artifacts/jsonl-structure-viewer/components/CopyButton.tsx`

This is real long-term cleanup, but it should be a separate PR. These components are shared primitives or imperative helpers. A rushed mechanical migration can break focus management, copy actions, theme-boundary warnings, or caller refs without obvious visual changes.

React 19 allows `ref` as a regular prop on function components. `forwardRef` remains supported, but it is no longer required for new code. This plan moves the repo toward the React 19 shape deliberately.

## Inventory

Refresh the inventory before editing:

```bash
rg -n "forwardRef|useContext\\(" src
```

Expected current hits:

- `src/components/CopyButton.tsx`
- `src/components/Input.tsx`
- `src/components/Button.tsx`
- `src/components/ArtifactThemeRoot.tsx`
- `src/components/Panel.tsx`
- `src/artifacts/jsonl-structure-viewer/components/CopyButton.tsx`
- `src/components/ArtifactThemeRoot.tsx` also uses `useContext`

Also inspect:

- `src/lib/refs.ts`: current helper for assigning callback refs and object refs.
- `tests/components/corePrimitives.test.ts`
- `tests/components/sharedPrimitives.test.ts`
- `tests/sharp2/boundary.test.ts`
- `tests/jsonl-structure-viewer/ui.test.ts`

## Migration Rules

- Destructure `ref` out of component props so it is not spread into DOM props accidentally.
- Keep `assignRef` when a component has both an internal DOM ref and a caller ref.
- Keep internal refs needed by `useArtifactThemeGuard`.
- Preserve `type="button"` defaults on button primitives.
- Preserve imperative handle types. A `CopyButtonHandle` ref is not a DOM `HTMLButtonElement` ref.
- Do not switch default/named exports in the same PR unless the migration requires it.
- Treat `useContext` to React 19 `use(...)` as a separate substep. Do not force it if it introduces toolchain friction.

## Type Pattern For DOM Ref Components

For a button primitive, prefer this shape:

```tsx
import { type ButtonHTMLAttributes, type ReactNode, useCallback, useRef } from 'react';
import { assignRef } from '../lib/refs';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
};

export function Button({
  ref,
  children,
  variant = 'default',
  size = 'md',
  disabled,
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  const rootRef = useRef<HTMLButtonElement>(null);
  useArtifactThemeGuard('Button', rootRef);

  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <button ref={setRef} type={type} disabled={disabled} className={mergeClassNames(...)} {...props}>
      {children}
    </button>
  );
}
```

Important details:

- The `ref` prop type should match the exposed element.
- `setRef` keeps the internal guard ref and caller ref in sync.
- Do not use `ComponentPropsWithoutRef<'button'>` if it removes the React 19 ref prop you need. If you use React helper types, verify the resulting type accepts `ref`.

For a simple structural component:

```tsx
export type PanelProps = HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>;
};

export function Panel({ ref, className, ...props }: PanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useArtifactThemeGuard('Panel', rootRef);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  return <div ref={setRef} className={mergeClassNames(...)} {...props} />;
}
```

Do not use that exact pattern for `Input`. Current `Input` has two refs with different targets:

- `rootRef` points at the wrapper `<div>` so `useArtifactThemeGuard` can check the artifact theme boundary.
- The public ref points at the actual `<input>`.

Preserve that split:

```tsx
export function Input({
  ref,
  id,
  label,
  helperText,
  error,
  className,
  inputClassName,
  labelClassName,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: InputProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useArtifactThemeGuard('Input', rootRef);

  return (
    <div ref={rootRef} className={mergeClassNames('space-y-1', className)}>
      ...
      <input ref={ref} aria-label={ariaLabel} aria-labelledby={ariaLabelledBy} {...props} />
      ...
    </div>
  );
}
```

Also preserve the existing accessible-name prop union for `InputProps`; it prevents rendering the primitive without a visible label, `aria-label`, or `aria-labelledby`.

## ArtifactThemeRoot

Current shape:

```tsx
export const ArtifactThemeRoot = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ArtifactThemeRoot(
  { className, ...props },
  ref,
) {
  return (
    <ArtifactThemeContext.Provider value={true}>
      <div ref={ref} className={mergeClassNames('artifact-theme', className)} {...props} />
    </ArtifactThemeContext.Provider>
  );
});
```

Desired React 19 shape:

```tsx
export type ArtifactThemeRootProps = HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>;
};

export function ArtifactThemeRoot({ ref, className, ...props }: ArtifactThemeRootProps) {
  return (
    <ArtifactThemeContext.Provider value={true}>
      <div ref={ref} className={mergeClassNames('artifact-theme', className)} {...props} />
    </ArtifactThemeContext.Provider>
  );
}
```

Then evaluate the context read separately:

```tsx
import { createContext, type HTMLAttributes, use, useEffect } from 'react';

export function useArtifactThemeGuard(componentName = 'Component', ref?: ThemeRootRef) {
  const inTheme = use(ArtifactThemeContext);
  ...
}
```

Why this is a separate decision:

- `useContext(ArtifactThemeContext)` is stable and currently correct.
- React 19 `use(...)` is newer and may have different lint/tooling assumptions.
- If `use(...)` creates TypeScript or lint friction, keep `useContext` and only remove `forwardRef`.

## CopyButton With Imperative Handle

The shared `CopyButton` exposes an imperative API:

```ts
export type CopyButtonHandle = {
  copy: () => void;
};
```

Current shape:

```tsx
export const CopyButton = forwardRef<CopyButtonHandle, CopyButtonProps>(function CopyButton(..., ref) {
  ...
  useImperativeHandle(ref, () => ({ copy: handleCopy }), [handleCopy]);
  ...
});
```

React 19 shape:

```tsx
export type CopyButtonProps = {
  ref?: React.Ref<CopyButtonHandle>;
  text: string;
  ...
};

export function CopyButton({ ref, text, ...props }: CopyButtonProps) {
  ...
  useImperativeHandle(ref, () => ({ copy: handleCopy }), [handleCopy]);
  ...
}
```

Important details:

- The public ref type is `CopyButtonHandle`, not `HTMLButtonElement`.
- Keep a separate `rootRef` for `useArtifactThemeGuard`.
- Do not expose a DOM button ref unless the component contract is intentionally changed.
- Add or confirm tests for the imperative `copy()` method before migration.

The JSONL artifact-local `CopyButton` should be migrated separately after the shared primitive migration because it has artifact-local behavior and tests.

## Tests To Add Or Confirm

Before starting the migration, decide how runtime ref behavior will be verified. Most existing tests in this repo use `renderToStaticMarkup`, source assertions, or typecheck; SSR/static markup does not prove refs are assigned or imperative handles work.

Use one of these strategies:

- Add a deliberate DOM-capable test harness for runtime ref assertions.
- Add type-level compile assertions for accepted ref prop types, then do browser/manual smoke checks for runtime assignment.
- If neither is practical for a component, document the gap and keep the migration batch smaller.

Make sure the validation strategy covers:

- `Button` accepts callback refs and object refs.
- `Input` accepts callback refs and object refs.
- `Panel` accepts callback refs and object refs.
- `ArtifactThemeRoot` forwards a DOM ref and still applies `artifact-theme`.
- Shared `CopyButton` imperative ref exposes `copy()`.
- JSONL artifact `CopyButton` imperative ref exposes its current handle.
- `useArtifactThemeGuard` still warns outside the theme boundary and stays quiet inside it.
- Existing shared primitive static markup tests still pass.

Suggested test locations:

- `tests/components/corePrimitives.test.ts`
- `tests/components/sharedPrimitives.test.ts`
- `tests/sharp2/boundary.test.ts`
- `tests/jsonl-structure-viewer/ui.test.ts`

Treat the existing static markup tests as regression coverage for rendered attributes and classes only. Do not rely on them alone for ref behavior.

## Rollout Order

- [ ] Refresh inventory with `rg -n "forwardRef|useContext\\(" src`.
- [ ] Choose and document the ref validation strategy: DOM-capable tests, type-level assertions plus smoke checks, or a smaller migration batch with explicit gaps.
- [ ] Migrate `Panel`.
- [ ] Run targeted component tests and typecheck.
- [ ] Migrate `Input`.
- [ ] Run targeted component tests and typecheck.
- [ ] Migrate `Button`.
- [ ] Run targeted component tests and typecheck.
- [ ] Migrate `ArtifactThemeRoot`.
- [ ] Run theme-boundary and component tests.
- [ ] Evaluate `useContext` to `use` separately.
- [ ] Migrate shared `CopyButton`.
- [ ] Run shared primitive tests and typecheck.
- [ ] Migrate JSONL artifact-local `CopyButton`.
- [ ] Run JSONL tests and typecheck.
- [ ] Run full validation.

## Validation

Run after each batch:

```bash
node --import tsx --test tests/components/corePrimitives.test.ts
node --import tsx --test tests/components/sharedPrimitives.test.ts
npm run typecheck
```

Run before PR:

```bash
node --import tsx --test tests/sharp2/boundary.test.ts
node --import tsx --test tests/jsonl-structure-viewer/ui.test.ts
npm run check
npx -y react-doctor@latest . --verbose --diff
npx -y react-doctor@latest . --verbose
```

Expected result:

- React Doctor `forwardRef` warnings should decrease or disappear.
- No shared primitive ref tests should regress.
- No theme-boundary guard behavior should change.
- No copy imperative-handle behavior should change.

## Stop Conditions

Stop and reassess if:

- TypeScript does not accept regular `ref` props cleanly with the current React type version.
- A component's public ref contract is unclear.
- Tests cannot verify the existing ref behavior.
- `use(...)` context reads introduce lint or runtime friction.
- Migration requires changing imports/exports unrelated to refs.

In those cases, keep `forwardRef` for that component and document the reason in the PR rather than forcing the migration.
