# Artifact Theme Boundary + Guard Plan

## 1) Problem & Motivation
- We now rely on shared tokens without fallbacks in shared components (`Checkbox`, `Toggle`, `CopyableLabel`).
- Tokens are only guaranteed when `.artifact-theme` is applied, but this is currently an implicit convention.
- This can lead to silent visual regressions if shared components are used outside the token scope (shell UI, tests, future artifacts).

**Why now**
- We removed token fallbacks to enforce the contract. The boundary should be explicit and enforceable.
- A clear “theme root” API reduces future drift and guesswork for new artifacts.

**Success criteria**
- There is a single, explicit way to apply the token scope (`ArtifactThemeRoot`).
- Shared components warn in dev if used outside a theme boundary.
- All artifacts in scope are wrapped in the theme root (no manual `artifact-theme` usage in artifacts).
- No changes to shell visuals; shell remains independent unless intentionally wrapped.

## 2) System Context
**Relevant files/modules**
- Tokens:
  - `src/theme/artifact-theme.css`
  - `design/VISUAL_STYLE_GUIDE.txt`
- Shared components that require tokens:
  - `src/components/Checkbox.tsx`
  - `src/components/Toggle.tsx`
  - `src/components/CopyableLabel.tsx`
  - `src/components/ListboxSelect.tsx`
  - `src/components/StatusTag.tsx`
- Artifact roots:
  - `src/artifacts/example/index.tsx`
  - `src/artifacts/example-app/App.tsx`
  - `src/artifacts/jsonl-structure-viewer/index.tsx`
  - `src/artifacts/focus-compare/index.tsx`
- Shell/standalone roots (should remain independent unless explicitly wrapped):
  - `src/App.tsx`
  - `src/StandaloneRoot.tsx`
  - `src/StandaloneFallback.tsx`

**How it connects**
- The token scope is applied via the `artifact-theme` CSS class.
- Artifacts must opt into that class to get tokens.
- Shared components assume tokens exist; without a boundary, focus rings/surfaces degrade silently.

## 3) Implementation Plan (ordered)

### Step 1: Add explicit theme boundary component
**What**
- Create `src/components/ArtifactThemeRoot.tsx` exporting:
  - `ArtifactThemeRoot` component that wraps children in a `div` with `artifact-theme` class.
  - `useArtifactThemeGuard(componentName?: string, ref?: RefObject<HTMLElement>)` hook that warns in dev if used outside the boundary.

**How**
- `ArtifactThemeRoot` should extend `HTMLAttributes<HTMLDivElement>` so native props (e.g. `data-theme`) pass through cleanly.
- Use a React context (boolean) to signal “inside artifact theme”.
- `ArtifactThemeRoot` provides the context and renders the wrapper.
- `useArtifactThemeGuard` behavior (dev-only):
  - If context is true, do nothing.
  - If context is false but a `ref` is provided, check `ref.current?.closest('.artifact-theme')` to tolerate manual usage.
  - If still not found, `console.warn` once per component name with a hint: `Wrap in <ArtifactThemeRoot>`.
- Keep this module “leafy”: only React + types, no imports from other shared components.

**Why**
- Enforces a single API for token scoping.
- Provides immediate feedback if shared components are used outside the boundary.

**Dependencies**
- Requires React context; no other modules.

---

### Step 2: Wire shared components to the guard
**What**
- Update shared components to call `useArtifactThemeGuard` at render time:
  - `src/components/Checkbox.tsx`
  - `src/components/Toggle.tsx`
  - `src/components/CopyableLabel.tsx`
  - `src/components/ListboxSelect.tsx`
  - `src/components/StatusTag.tsx`

**How**
- Import `useArtifactThemeGuard` from `src/components/ArtifactThemeRoot.tsx`.
- Add a `useRef` to each component’s root element (label/button/div).
- Pass the ref to the hook: `useArtifactThemeGuard('Checkbox', rootRef)`.
- This allows DOM ancestry checks to silence warnings if someone manually applies `.artifact-theme`.

**Why**
- Ensures missing-theme usage is visible during development.

**Dependencies**
- Step 1 must be complete before this step.

---

### Step 3: Replace manual `artifact-theme` usage in artifacts
**What**
- Update artifact roots to use `ArtifactThemeRoot` instead of string classes:
  - `src/artifacts/example/index.tsx`
  - `src/artifacts/example-app/App.tsx`
  - `src/artifacts/jsonl-structure-viewer/index.tsx`
  - `src/artifacts/focus-compare/index.tsx`

**How**
- Import `ArtifactThemeRoot`.
- Replace root `<div className="artifact-theme ...">` with:
  - `<ArtifactThemeRoot className="...">` and include existing additional classes (e.g., `example-theme`, `jsonl-structure-theme`).
- For example artifact, pass `data-theme`:
  - Use `data-theme={theme}` directly (native prop support via `HTMLAttributes`).

**Why**
- Centralizes the token boundary and ensures consistency across artifacts.

**Dependencies**
- Step 1 must be complete before this step.

---

### Step 4: Document the boundary in the style guide
**What**
- Update `design/VISUAL_STYLE_GUIDE.txt` to state:
  - “All artifacts must wrap their root in `ArtifactThemeRoot`.”
  - “Shared components require the artifact theme boundary; usage elsewhere will warn in dev.”

**Why**
- Makes the enforcement rule explicit for future contributors.

---

### Step 5: (Optional) Add quick audit note
**What**
- Add a short note in `design/UI_IMPLEMENTATION_NOTES.md` index (if desired) pointing to the new boundary requirement.

**Why**
- Keeps the rule in the living guide if this policy is expected to be referenced often.

## 4) Key Decisions & Tradeoffs
- **Decision:** Enforce the boundary via a React context + dev warning.
  - **Alternative:** Add `artifact-theme` to shell roots (least invasive) or reintroduce fallbacks.
  - **Why:** We want explicit ownership of the boundary and faster feedback without weakening the token contract.
- **Decision:** Require all artifact roots to use `ArtifactThemeRoot`.
  - **Tradeoff:** Slightly more boilerplate per artifact, but stronger consistency.
- **Decision:** Allow DOM ancestry checks to tolerate manual `.artifact-theme`.
  - **Tradeoff:** Slightly more code (refs in shared components), but fewer false-positive warnings.

## 5) Risks & Landmines
- If an artifact root is not updated, shared components will warn and may render incorrectly.
- If any shared components are used in shell UI, they will now warn; this is intentional but could surprise.
- DOM ancestry checks require a ref; if a shared component forgets to wire it, manual `.artifact-theme` usage may still warn.

## 6) Verification & Validation
**Manual checks**
- Open each artifact and confirm no warnings in the console:
  - `/?artifact=example` (switch palettes)
  - `/?artifact=example-app`
  - `/?artifact=jsonl-structure-viewer`
  - `/?artifact=focus-compare`

**Behavioral checks**
- Use a shared component outside `ArtifactThemeRoot` temporarily to confirm the dev warning fires once.

**Tests**
- `npm run lint`
- `npm run typecheck`

**Rollback plan**
- Revert `ArtifactThemeRoot` and guard usage.
- Restore direct `artifact-theme` class usage in artifacts.
- (If necessary) restore token fallbacks in shared components.

## 7) Open Questions / Follow-ups
- Do we want the guard to throw (fail fast) instead of warn in dev?
- Should the shell ever be wrapped with `ArtifactThemeRoot` for future UI that uses shared components?
