# ClassName Join to MergeClassNames Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace CSS class composition `.join(' ')` patterns with `mergeClassNames(...)` where appropriate, while leaving non-CSS joins unchanged.

**Architecture:** This is a mechanical cleanup around the existing `src/lib/classNames.ts` helper, not a product feature. Convert fixed class-part arrays and className prop composition to `mergeClassNames(...)` in small batches, preserving non-CSS joins and reviewing any intentionally duplicated Tailwind classes before conversion.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, `tailwind-merge`, Biome, Node test runner.

---

## Context

This was deferred from PR #45 / branch `sharp2-component-library-refactor` after a review comment suggested changing `src/components/ArtifactDialog.tsx` from `array.join(' ')` to `mergeClassNames(...)` for wrapper class composition.

The suggestion is valid, but the repo sweep found the same convention issue in many unrelated files. Handling all of them inside the sharp2 component-library refactor would mix a broad formatting/convention cleanup into a behavioral/refactor PR, making review harder and increasing conflict risk. This should be a separate cleanup PR after the sharp2 refactor is settled.

## Inventory From 2026-05-04 Sweep

Line numbers below are approximate and will drift as files change. Refresh with the commands in Task 1 before editing.

Source `.join(' ')` totals:
- `129` total `.join(' ')` occurrences under `src`.
- `125` CSS class composition candidates for `mergeClassNames(...)`.
- `124` other class candidates if excluding the original reviewed `src/components/ArtifactDialog.tsx:83` wrapper.
- `4` intentional/non-CSS `.join(' ')` cases should remain.
- `26` additional template-literal `className` compositions were found; treat those as a separate, non-default follow-up task.

Strong class candidates in `src/components` (`24`):
- `src/components/CopyButton.tsx`: `73, 93`
- `src/components/CopyableLabel.tsx`: `126`
- `src/components/ArtifactDialog.tsx`: `83, 136`
- `src/components/ArtifactListItem.tsx`: `34, 72`
- `src/components/StatusTag.tsx`: `40, 47`
- `src/components/ArtifactThemeRoot.tsx`: `12`
- `src/components/Checkbox.tsx`: `58, 72, 100, 104, 111`
- `src/components/Toggle.tsx`: `52, 65, 93, 95, 100`
- `src/components/ListboxSelect.tsx`: `158, 174, 194, 221`

App shell candidates (`9`):
- `src/App.tsx`: `415, 433, 451, 476, 494, 516, 536, 571, 580`

Artifact candidates (`92`):
- `src/artifacts/palette-lab/index.tsx`: `258, 272, 349, 359, 373, 385, 396, 428, 545`
- `src/artifacts/prompt-library/index.tsx`: `139, 165, 187, 198, 213, 248, 256, 325, 377`
- `src/artifacts/focus-compare/index.tsx`: `23, 47, 73, 85, 118, 146, 186, 231, 277, 293, 313, 330, 345, 371, 383, 405, 429, 459, 470, 495, 512`
- `src/artifacts/message-unescaper/index.tsx`: `270, 276, 357, 370, 394, 407, 457, 497, 515, 537, 560`
- `src/artifacts/example-app/components/Primitives.tsx`: `53, 66, 80`
- `src/artifacts/example-app/App.tsx`: `254, 271, 303, 373, 427`
- `src/artifacts/jsonl-structure-viewer/index.tsx`: `462, 465, 473, 479, 486, 489, 648, 653, 686, 814, 818, 838, 861, 883, 916, 938, 983, 1057, 1081, 1106, 1142, 1164`
- `src/artifacts/jsonl-structure-viewer/components/Checkbox.tsx`: `47, 60`
- `src/artifacts/jsonl-structure-viewer/components/CopyButton.tsx`: `80`
- `src/artifacts/jsonl-structure-viewer/components/PathList.tsx`: `12`
- `src/artifacts/jsonl-structure-viewer/lib/ui.ts`: `6`
- `src/artifacts/sharp2/components/Row.tsx`: `24`
- `src/artifacts/sharp2/components/SearchInput.tsx`: `121, 150`
- `src/artifacts/sharp2/components/SubSection.tsx`: `11`
- `src/artifacts/sharp2/conversation/TokenCounter.tsx`: `49`
- `src/artifacts/sharp2/conversation/MessageCard.tsx`: `49`
- `src/artifacts/sharp2/conversation/MessageTypeToggle.tsx`: `24`

Intentional/non-CSS joins that should remain (`4`):
- `src/lib/classNames.ts:6`: internal implementation of `mergeClassNames(...)`.
- `src/components/Input.tsx:88`: builds an `aria-describedby` idref list, not CSS.
- `src/artifacts/prompt-library/index.tsx:478`: joins prompt tag ids into searchable text.
- `src/artifacts/prompt-library/search.ts:247`: joins prompt tag ids into searchable text.

Optional template-literal follow-up (`26`, not part of the default cleanup):
- `src/components/StatusTag.tsx:42`
- `src/artifacts/focus-compare/index.tsx:61, 190`
- `src/artifacts/example/index.tsx:174, 188, 190`
- `src/artifacts/sharp2/index.tsx:651, 654, 657`
- `src/artifacts/sharp2/components/Section.tsx:23`
- `src/artifacts/sharp2/conversation/ToolCall.tsx:45, 55`
- `src/artifacts/example-app/App.tsx:375, 385, 387, 429, 439, 441`
- `src/artifacts/jsonl-structure-viewer/index.tsx:696, 995, 999, 1221`
- `src/artifacts/jsonl-structure-viewer/components/PathList.tsx:153, 176, 190, 198`

## Convention

Use `mergeClassNames(...)` when composing CSS classes from fixed parts, conditionals, variants, or caller-provided `className` / `*ClassName` props.

Keep `.join(' ')` or another join when the result is not CSS classes: ARIA idrefs, searchable text, file paths, report text, snapshots, and the implementation of `mergeClassNames(...)` itself.

Default conversion pattern:

```tsx
className={[
  'base classes',
  active ? 'active classes' : 'inactive classes',
  className,
]
  .filter(Boolean)
  .join(' ')}
```

becomes:

```tsx
className={mergeClassNames('base classes', active ? 'active classes' : 'inactive classes', className)}
```

For class constants:

```ts
const headerActionClass = ['base', condition && 'conditional'].filter(Boolean).join(' ');
```

becomes:

```ts
const headerActionClass = mergeClassNames('base', condition && 'conditional');
```

## Risk Notes

`mergeClassNames(...)` calls `tailwind-merge`, so it can remove earlier conflicting Tailwind utilities when a later utility wins. That is usually desirable for caller overrides, but each batch should review intentional duplicates or order-sensitive examples before conversion.

Be especially careful in demo artifacts such as `focus-compare`, where class strings may be illustrating design differences, and in rows that intentionally manage `border-l-*` state. Non-CSS joins must stay unchanged.

## Task 1: Tests and Guardrails

**Files:**
- No tracked file changes.

- [ ] **Step 1: Confirm branch and working tree**

Run:

```bash
git status --short --branch
```

Expected: branch is `sharp2-component-library-refactor`. Existing dirty files, if any, are noted before editing and not reverted unless they belong to this cleanup.

- [ ] **Step 2: Confirm the helper behavior**

Run:

```bash
node --import tsx --test tests/lib/classNames.test.ts
```

Expected: `mergeClassNames` tests pass, including Tailwind conflict resolution and empty conditional values.

- [ ] **Step 3: Refresh the source inventory**

Run:

```bash
rg -n "\\.join\\(' '\\)" src
rg -n 'className=\{`|className=\{[^\n]*\$\{|const [A-Za-z0-9_]+Class\s*=\s*`' src/components src/artifacts src/App.tsx
```

Expected: counts may differ from this plan, but non-CSS joins are still limited to the intentional cases listed above unless new code was added.

- [ ] **Step 4: Record the baseline check**

Run:

```bash
npm run check
```

Expected: baseline passes before mechanical cleanup. If it fails, record the failure and decide whether it is pre-existing before continuing.

Commit suggestion: no commit for this guardrail task unless a dedicated baseline note is required by the maintainer.

## Task 2: Shared Components Batch

**Files:**
- Modify: `src/components/ArtifactDialog.tsx`
- Modify: `src/components/ArtifactListItem.tsx`
- Modify: `src/components/ArtifactThemeRoot.tsx`
- Modify: `src/components/Checkbox.tsx`
- Modify: `src/components/CopyButton.tsx`
- Modify: `src/components/CopyableLabel.tsx`
- Modify: `src/components/ListboxSelect.tsx`
- Modify: `src/components/StatusTag.tsx`
- Modify: `src/components/Toggle.tsx`

- [ ] **Step 1: Add imports where missing**

Use `import { mergeClassNames } from '../lib/classNames';` in shared component files that do not already import it. `ArtifactDialog.tsx` already imports the helper.

- [ ] **Step 2: Convert only CSS class joins in `src/components`**

Convert the `24` strong candidates listed for `src/components`. Leave `src/components/Input.tsx:88` unchanged because it builds `aria-describedby`.

- [ ] **Step 3: Verify shared component joins**

Run:

```bash
rg -n "\\.join\\(' '\\)" src/components
node --import tsx --test tests/lib/classNames.test.ts
```

Expected: the only `src/components` match is `src/components/Input.tsx:88`. Tests pass.

- [ ] **Step 4: Commit shared component cleanup**

Run:

```bash
git add src/components
git commit -m "refactor: use mergeClassNames in shared components"
```

## Task 3: App Shell Batch

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import the helper**

Add `import { mergeClassNames } from './lib/classNames';` and let Biome organize imports.

- [ ] **Step 2: Convert shell class joins**

Convert `src/App.tsx` lines `415, 433, 451, 476, 494, 516, 536, 571, 580`.

- [ ] **Step 3: Verify app shell joins**

Run:

```bash
rg -n "\\.join\\(' '\\)" src/App.tsx
npm run lint
```

Expected: no `.join(' ')` matches in `src/App.tsx`. Lint passes.

- [ ] **Step 4: Commit app shell cleanup**

Run:

```bash
git add src/App.tsx
git commit -m "refactor: use mergeClassNames in app shell"
```

## Task 4: Artifact Component and Utility Batch

**Files:**
- Modify: `src/artifacts/example-app/components/Primitives.tsx`
- Modify: `src/artifacts/jsonl-structure-viewer/components/Checkbox.tsx`
- Modify: `src/artifacts/jsonl-structure-viewer/components/CopyButton.tsx`
- Modify: `src/artifacts/jsonl-structure-viewer/components/PathList.tsx`
- Modify: `src/artifacts/jsonl-structure-viewer/lib/ui.ts`
- Modify: `src/artifacts/sharp2/components/Row.tsx`
- Modify: `src/artifacts/sharp2/components/SearchInput.tsx`
- Modify: `src/artifacts/sharp2/components/SubSection.tsx`
- Modify: `src/artifacts/sharp2/conversation/TokenCounter.tsx`
- Modify: `src/artifacts/sharp2/conversation/MessageCard.tsx`
- Modify: `src/artifacts/sharp2/conversation/MessageTypeToggle.tsx`

- [ ] **Step 1: Add imports with the correct relative path**

Use `../../../lib/classNames` from artifact subdirectories under `src/artifacts/<id>/components`, `src/artifacts/<id>/conversation`, and `src/artifacts/<id>/lib`.

- [ ] **Step 2: Convert component-like artifact joins**

Convert the candidate lines listed for the files in this task. These are the highest-leverage artifact conversions because they are local primitives or shared constants within an artifact.

- [ ] **Step 3: Verify this batch**

Run:

```bash
rg -n "\\.join\\(' '\\)" \
  src/artifacts/example-app/components/Primitives.tsx \
  src/artifacts/jsonl-structure-viewer/components \
  src/artifacts/jsonl-structure-viewer/lib/ui.ts \
  src/artifacts/sharp2/components \
  src/artifacts/sharp2/conversation
npm run lint
```

Expected: no `.join(' ')` matches in these paths. Lint passes.

- [ ] **Step 4: Commit artifact component cleanup**

Run:

```bash
git add \
  src/artifacts/example-app/components/Primitives.tsx \
  src/artifacts/jsonl-structure-viewer/components \
  src/artifacts/jsonl-structure-viewer/lib/ui.ts \
  src/artifacts/sharp2/components \
  src/artifacts/sharp2/conversation
git commit -m "refactor: use mergeClassNames in artifact components"
```

## Task 5: Artifact Screen Batch A

**Files:**
- Modify: `src/artifacts/example-app/App.tsx`
- Modify: `src/artifacts/message-unescaper/index.tsx`
- Modify: `src/artifacts/palette-lab/index.tsx`
- Modify: `src/artifacts/prompt-library/index.tsx`

- [ ] **Step 1: Add imports with the correct relative path**

Use `../../lib/classNames` from top-level artifact `index.tsx` and artifact `App.tsx` files.

- [ ] **Step 2: Convert class joins**

Convert the candidate lines listed for these four files. In `prompt-library/index.tsx`, leave the searchable tag text join at line `478` unchanged.

- [ ] **Step 3: Verify this batch**

Run:

```bash
rg -n "\\.join\\(' '\\)" \
  src/artifacts/example-app/App.tsx \
  src/artifacts/message-unescaper/index.tsx \
  src/artifacts/palette-lab/index.tsx \
  src/artifacts/prompt-library/index.tsx \
  src/artifacts/prompt-library/search.ts
npm run lint
```

Expected: only the prompt-library searchable tag joins remain in `src/artifacts/prompt-library/index.tsx` and `src/artifacts/prompt-library/search.ts`. Lint passes.

- [ ] **Step 4: Commit artifact screen batch A**

Run:

```bash
git add \
  src/artifacts/example-app/App.tsx \
  src/artifacts/message-unescaper/index.tsx \
  src/artifacts/palette-lab/index.tsx \
  src/artifacts/prompt-library/index.tsx
git commit -m "refactor: use mergeClassNames in artifact screens"
```

## Task 6: Artifact Screen Batch B

**Files:**
- Modify: `src/artifacts/focus-compare/index.tsx`
- Modify: `src/artifacts/jsonl-structure-viewer/index.tsx`

- [ ] **Step 1: Add imports with the correct relative path**

Use `../../lib/classNames` in both top-level artifact files.

- [ ] **Step 2: Convert class joins with extra review**

Convert the candidate lines listed for `focus-compare` and `jsonl-structure-viewer/index.tsx`. Review each converted string for intentional duplicate Tailwind utilities before saving, because these files contain demos and dense state controls.

- [ ] **Step 3: Verify this batch**

Run:

```bash
rg -n "\\.join\\(' '\\)" \
  src/artifacts/focus-compare/index.tsx \
  src/artifacts/jsonl-structure-viewer/index.tsx
npm run lint
```

Expected: no `.join(' ')` matches in these two files. Lint passes.

- [ ] **Step 4: Commit artifact screen batch B**

Run:

```bash
git add src/artifacts/focus-compare/index.tsx src/artifacts/jsonl-structure-viewer/index.tsx
git commit -m "refactor: use mergeClassNames in remaining artifact screens"
```

## Task 7: Final Verification

**Files:**
- No planned source changes unless verification exposes a missed candidate or mistaken conversion.

- [ ] **Step 1: Verify only intentional source joins remain**

Run:

```bash
rg -n "\\.join\\(' '\\)" src
```

Expected matches:

```text
src/components/Input.tsx:... [ariaDescribedBy, helperId, errorId].filter(Boolean).join(' ') || undefined
src/lib/classNames.ts:... twMerge(classNames.filter(Boolean).join(' '))
src/artifacts/prompt-library/index.tsx:... prompt.tags.join(' ')
src/artifacts/prompt-library/search.ts:... result.prompt.tags.join(' ')
```

- [ ] **Step 2: Run full repo check**

Run:

```bash
npm run check
```

Expected: all checks pass.

- [ ] **Step 3: Visual smoke shared components and impacted artifacts**

Run the app:

```bash
npm run dev -- --host 0.0.0.0 --port 5174
```

In an exe.dev VM, allow the documented proxy host at runtime:

```bash
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<vm-host>.exe.xyz npm run dev -- --host 0.0.0.0 --port 5174
```

Smoke these screens in light and dark themes:
- Shared component examples in `sharp2`.
- `prompt-library`, especially tags/search/dialog.
- `palette-lab`, especially selected cards and dialog.
- `message-unescaper`, especially segmented controls and output toggles.
- `focus-compare`, because it intentionally demonstrates class/state differences.
- `jsonl-structure-viewer`, especially header controls, layout controls, and output controls.

- [ ] **Step 4: Commit final fixes if verification required changes**

If Task 7 required source changes, run:

```bash
git add src
git commit -m "fix: preserve intentional class cleanup behavior"
```

If no source changes were needed, do not create a verification-only commit.

## Task 8: Optional Non-Default Template-Literal Follow-Up

**Files:**
- Modify only if explicitly requested after the `.join(' ')` cleanup:
  - `src/components/StatusTag.tsx`
  - `src/artifacts/focus-compare/index.tsx`
  - `src/artifacts/example/index.tsx`
  - `src/artifacts/sharp2/index.tsx`
  - `src/artifacts/sharp2/components/Section.tsx`
  - `src/artifacts/sharp2/conversation/ToolCall.tsx`
  - `src/artifacts/example-app/App.tsx`
  - `src/artifacts/jsonl-structure-viewer/index.tsx`
  - `src/artifacts/jsonl-structure-viewer/components/PathList.tsx`

- [ ] **Step 1: Refresh template-literal inventory**

Run:

```bash
rg -n 'className=\{`|className=\{[^\n]*\$\{|const [A-Za-z0-9_]+Class\s*=\s*`' src/components src/artifacts src/App.tsx
```

Expected: list may differ from the 2026-05-04 inventory. Do not include this task in the default cleanup unless the maintainer asks for all class composition forms to use `mergeClassNames(...)`.

- [ ] **Step 2: Convert template-literal class composition only when it improves consistency**

Use `mergeClassNames(...)` for fixed class parts plus dynamic whole-class strings. Leave template literals alone when they are clearer and do not involve conditional class composition.

- [ ] **Step 3: Verify optional follow-up**

Run:

```bash
npm run check
```

Expected: all checks pass. Perform the same visual smoke from Task 7.

- [ ] **Step 4: Commit optional follow-up separately**

Run:

```bash
git add src
git commit -m "refactor: normalize template literal class composition"
```
