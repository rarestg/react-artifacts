# Prompt Library Tag Colors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add theme-aware categorical colors to Prompt Library tags and filters, expand the shared category palette, and expose the palette in Example App.

**Architecture:** Shared color tokens live in `src/theme/artifact-theme.css`. Prompt Library owns the curated tag-to-color mapping in `prompts.ts`; the UI resolves those colors through static classes or inline CSS variables that Tailwind can see. Example App and sharp2 docs consume the expanded category token set without changing sharp2 runtime behavior.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 arbitrary value utilities, Node test runner, Biome, Vite.

---

## Scope Check

The approved spec covers one visual improvement across shared theme tokens, Example App palette previews, Prompt Library tag rendering, and a small sharp2 documentation update. It does not require backend work, database changes, user-editable tag colors, or a tag hashing algorithm.

Implementation should keep prompt content tests fixture-based. Do not add tests that pin real curated prompt titles, ids, contexts, wording, or exact prompt bodies.

## File Structure

- Modify `src/theme/artifact-theme.css`: add cyan/pink/lime category tokens, update dark danger/info values, and provide dark weak category surfaces.
- Modify `src/artifacts/example-app/App.tsx`: add category swatches for system/note/marker and update default selected category swatches.
- Modify `src/artifacts/sharp2/sharp2-migration-guide.md`: document the expanded categorical token set.
- Modify `src/components/Checkbox.tsx`: allow a caller-supplied `style` prop so Prompt Library can set CSS variables on the checkbox label.
- Modify `src/artifacts/prompt-library/prompts.ts`: add `PromptTagColorId`, assign colors to curated tags, and validate color metadata.
- Modify `src/artifacts/prompt-library/index.tsx`: style filter checkboxes and prompt tag chips using tag color metadata.
- Create `tests/prompt-library/prompts.test.ts`: structural tests for tag color metadata validation using local fixtures.

## Task 1: Add Prompt Tag Color Metadata And Validation

**Files:**
- Create: `tests/prompt-library/prompts.test.ts`
- Modify: `src/artifacts/prompt-library/prompts.ts`

- [ ] **Step 1: Write the failing validation tests**

Create `tests/prompt-library/prompts.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  type PromptEntry,
  type PromptTag,
  validatePrompts,
} from '../../src/artifacts/prompt-library/prompts';

const validTags = [
  {
    id: 'review',
    label: 'Review',
    description: 'Fixture review tag.',
    color: 'blue',
  },
  {
    id: 'implementation',
    label: 'Implementation',
    description: 'Fixture implementation tag.',
    color: 'green',
  },
] as const satisfies readonly PromptTag[];

const validEntry = {
  id: 'fixture-entry',
  title: 'Fixture Entry',
  summary: 'Fixture summary.',
  tags: ['review'],
  context: 'Fixture context.',
  prompt: 'Fixture prompt.',
} as const satisfies PromptEntry;

test('validatePrompts accepts prompt tag metadata with valid color ids', () => {
  assert.doesNotThrow(() => validatePrompts([validEntry], validTags));
});

test('validatePrompts rejects prompt tag metadata with unknown color ids', () => {
  const invalidTags = [
    {
      ...validTags[0],
      color: 'orange',
    },
    validTags[1],
  ] as unknown as readonly PromptTag[];

  assert.throws(() => validatePrompts([validEntry], invalidTags), /unknown tag color/i);
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
node --import tsx --test tests/prompt-library/prompts.test.ts
```

Expected: the second test fails because `validatePrompts` does not yet validate tag color ids.

- [ ] **Step 3: Add tag color types and curated color assignments**

In `src/artifacts/prompt-library/prompts.ts`, add `PromptTagColorId`, update `PromptTag`, add the valid color set, and add `color` to each curated tag:

```ts
export type PromptTagId = 'review' | 'implementation' | 'subagents' | 'risk' | 'architecture';

export type PromptTagColorId = 'blue' | 'green' | 'amber' | 'violet' | 'red' | 'cyan' | 'pink' | 'lime';

export type PromptTag = {
  id: PromptTagId;
  label: string;
  description: string;
  color: PromptTagColorId;
};

const promptTagColorIds = new Set<PromptTagColorId>([
  'blue',
  'green',
  'amber',
  'violet',
  'red',
  'cyan',
  'pink',
  'lime',
]);
```

Update `promptTags` entries:

```ts
export const promptTags = [
  {
    id: 'review',
    label: 'Review',
    description: 'Prompts used while assessing completed work, code feedback, risks, or proposed changes.',
    color: 'blue',
  },
  {
    id: 'implementation',
    label: 'Implementation',
    description: 'Prompts used while planning, executing, or changing implementation work.',
    color: 'green',
  },
  {
    id: 'subagents',
    label: 'Subagents',
    description: 'Prompts that dispatch or coordinate a fresh subagent.',
    color: 'violet',
  },
  {
    id: 'risk',
    label: 'Risk',
    description: 'Prompts that examine residual risk, assumptions, constraints, and mitigation paths.',
    color: 'red',
  },
  {
    id: 'architecture',
    label: 'Architecture',
    description: 'Prompts that evaluate design cleanliness, maintainability, and larger structural alternatives.',
    color: 'cyan',
  },
] as const satisfies readonly PromptTag[];
```

Keep the `prompts` array content unchanged.

- [ ] **Step 4: Update `validatePrompts` to validate tag metadata**

Replace `validatePrompts` in `src/artifacts/prompt-library/prompts.ts` with:

```ts
export function validatePrompts(
  entries: readonly PromptEntry[] = prompts,
  tags: readonly PromptTag[] = promptTags,
): void {
  const ids = new Set<string>();
  const tagIds = new Set<PromptTagId>();

  for (const tag of tags) {
    if (tagIds.has(tag.id)) {
      throw new Error(`Duplicate prompt tag id: ${tag.id}`);
    }
    tagIds.add(tag.id);

    if (!promptTagColorIds.has(tag.color)) {
      throw new Error(`Prompt tag "${tag.id}" uses unknown tag color: ${tag.color}`);
    }
  }

  for (const entry of entries) {
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate prompt id: ${entry.id}`);
    }
    ids.add(entry.id);

    if (!hasWorkflowTag(entry)) {
      throw new Error(`Prompt "${entry.id}" must include at least one workflow tag`);
    }

    for (const tag of entry.tags) {
      if (!tagIds.has(tag)) {
        throw new Error(`Prompt "${entry.id}" uses unknown tag: ${tag}`);
      }
    }
  }
}
```

- [ ] **Step 5: Run the focused tests**

Run:

```bash
node --import tsx --test tests/prompt-library/prompts.test.ts tests/prompt-library/search.test.ts
```

Expected: both test files pass.

- [ ] **Step 6: Run TypeScript for the app**

Run:

```bash
npm run typecheck
```

Expected: exit `0`.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add src/artifacts/prompt-library/prompts.ts tests/prompt-library/prompts.test.ts
git commit -m "Add prompt tag color metadata"
```

## Task 2: Expand Shared Category Tokens And Example Preview

**Files:**
- Modify: `src/theme/artifact-theme.css`
- Modify: `src/artifacts/example-app/App.tsx`
- Modify: `src/artifacts/sharp2/sharp2-migration-guide.md`

- [ ] **Step 1: Update shared light-mode category tokens**

In `src/theme/artifact-theme.css`, replace the category token block in `.artifact-theme` with:

```css
  --category-blue: var(--accent);
  --category-green: var(--success);
  --category-amber: var(--warning);
  --category-violet: var(--info);
  --category-red: var(--danger);
  --category-cyan: #0891b2;
  --category-pink: #db2777;
  --category-lime: #65a30d;

  --category-blue-weak: var(--accent-weak);
  --category-green-weak: var(--success-weak);
  --category-amber-weak: var(--warning-weak);
  --category-violet-weak: var(--info-weak);
  --category-red-weak: var(--danger-weak);
  --category-cyan-weak: #cffafe;
  --category-pink-weak: #fce7f3;
  --category-lime-weak: #ecfccb;
```

- [ ] **Step 2: Update dark semantic and category token values**

In `.dark .artifact-theme`, change:

```css
  --danger: #fda4af;
  --info: #d8b4fe;
```

Change weak semantic values to:

```css
  --danger-weak: #881337;
  --info-weak: #4c1d95;
```

Then add explicit dark category overrides after the weak semantic values. This prevents the later `@supports color-mix` block from indirectly changing approved category weak colors through semantic aliases such as `--accent-weak`.

```css
  --category-blue: #60a5fa;
  --category-green: #34d399;
  --category-amber: #fbbf24;
  --category-violet: #c084fc;
  --category-red: #fb7185;
  --category-cyan: #22d3ee;
  --category-pink: #f472b6;
  --category-lime: #a3e635;

  --category-blue-weak: #1e3a8a;
  --category-green-weak: #064e3b;
  --category-amber-weak: #78350f;
  --category-violet-weak: #4c1d95;
  --category-red-weak: #881337;
  --category-cyan-weak: #164e63;
  --category-pink-weak: #831843;
  --category-lime-weak: #365314;
```

Dark status tokens and dark category red/violet are intentionally decoupled: `--danger` and `--info` need AA contrast when used as text on their weak semantic backgrounds, while `--category-red` and `--category-violet` keep the vivid categorical swatches used for non-text indicators and selected category surfaces.

- [ ] **Step 3: Replace Example App category swatches**

In `src/artifacts/example-app/App.tsx`, replace the `categorySwatches` array with:

```ts
const categorySwatches = [
  {
    id: 'user',
    label: 'User',
    weakBg: 'bg-[var(--category-blue-weak)]',
    strongBg: 'bg-[var(--category-blue)]',
    text: 'text-[var(--category-blue)]',
    border: 'border-[color:var(--category-blue)]',
  },
  {
    id: 'assistant',
    label: 'Assistant',
    weakBg: 'bg-[var(--category-green-weak)]',
    strongBg: 'bg-[var(--category-green)]',
    text: 'text-[var(--category-green)]',
    border: 'border-[color:var(--category-green)]',
  },
  {
    id: 'thinking',
    label: 'Thinking',
    weakBg: 'bg-[var(--category-amber-weak)]',
    strongBg: 'bg-[var(--category-amber)]',
    text: 'text-[var(--category-amber)]',
    border: 'border-[color:var(--category-amber)]',
  },
  {
    id: 'tool',
    label: 'Tool',
    weakBg: 'bg-[var(--category-violet-weak)]',
    strongBg: 'bg-[var(--category-violet)]',
    text: 'text-[var(--category-violet)]',
    border: 'border-[color:var(--category-violet)]',
  },
  {
    id: 'critical',
    label: 'Critical',
    weakBg: 'bg-[var(--category-red-weak)]',
    strongBg: 'bg-[var(--category-red)]',
    text: 'text-[var(--category-red)]',
    border: 'border-[color:var(--category-red)]',
  },
  {
    id: 'system',
    label: 'System',
    weakBg: 'bg-[var(--category-cyan-weak)]',
    strongBg: 'bg-[var(--category-cyan)]',
    text: 'text-[var(--category-cyan)]',
    border: 'border-[color:var(--category-cyan)]',
  },
  {
    id: 'note',
    label: 'Note',
    weakBg: 'bg-[var(--category-pink-weak)]',
    strongBg: 'bg-[var(--category-pink)]',
    text: 'text-[var(--category-pink)]',
    border: 'border-[color:var(--category-pink)]',
  },
  {
    id: 'marker',
    label: 'Marker',
    weakBg: 'bg-[var(--category-lime-weak)]',
    strongBg: 'bg-[var(--category-lime)]',
    text: 'text-[var(--category-lime)]',
    border: 'border-[color:var(--category-lime)]',
  },
] as const;
```

- [ ] **Step 4: Update Example App category defaults**

In `src/artifacts/example-app/App.tsx`, replace the `activeCategorySwatches` initializer with:

```ts
  const [activeCategorySwatches, setActiveCategorySwatches] = useState<Record<CategorySwatchId, boolean>>({
    user: true,
    assistant: true,
    thinking: false,
    tool: true,
    critical: false,
    system: true,
    note: false,
    marker: false,
  });
```

- [ ] **Step 5: Make Example App active swatch labels contrast-safe**

In `src/artifacts/example-app/App.tsx`, update both active swatch button renderers so selected text uses normal text color on weak colored backgrounds. Keep color visible through border and dot fill.

In the Theme Colors button class list, replace:

```tsx
                  activeSwatches[swatch.id]
                    ? `${swatch.border} ${swatch.weakBg} ${swatch.text}`
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
```

with:

```tsx
                  activeSwatches[swatch.id]
                    ? `${swatch.border} ${swatch.weakBg} text-[var(--text)]`
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
```

In the Theme Colors state chip, replace:

```tsx
                className={`inline-flex items-center gap-2 border ${swatch.border} ${swatch.weakBg} ${swatch.text} px-2 py-1 text-xs font-medium`}
```

with:

```tsx
                className={`inline-flex items-center gap-2 border ${swatch.border} ${swatch.weakBg} px-2 py-1 text-xs font-medium text-[var(--text)]`}
```

In the Message Colors button class list, replace:

```tsx
                  activeCategorySwatches[swatch.id]
                    ? `${swatch.border} ${swatch.weakBg} ${swatch.text}`
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
```

with:

```tsx
                  activeCategorySwatches[swatch.id]
                    ? `${swatch.border} ${swatch.weakBg} text-[var(--text)]`
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
```

In the Message Colors type chip, replace:

```tsx
                className={`inline-flex items-center gap-2 border ${swatch.border} ${swatch.weakBg} ${swatch.text} px-2 py-1 text-xs font-medium`}
```

with:

```tsx
                className={`inline-flex items-center gap-2 border ${swatch.border} ${swatch.weakBg} px-2 py-1 text-xs font-medium text-[var(--text)]`}
```

- [ ] **Step 6: Update sharp2 categorical token docs**

In `src/artifacts/sharp2/sharp2-migration-guide.md`, update the token list so it includes:

```markdown
- `--category-blue` / `--category-blue-weak`
- `--category-green` / `--category-green-weak`
- `--category-amber` / `--category-amber-weak`
- `--category-violet` / `--category-violet-weak`
- `--category-red` / `--category-red-weak`
- `--category-cyan` / `--category-cyan-weak`
- `--category-pink` / `--category-pink-weak`
- `--category-lime` / `--category-lime-weak`
```

Update the suggested values block so it includes the new light tokens:

```css
.artifact-theme {
  --category-blue: var(--accent);
  --category-green: var(--success);
  --category-amber: var(--warning);
  --category-violet: var(--info);
  --category-red: var(--danger);
  --category-cyan: #0891b2;
  --category-pink: #db2777;
  --category-lime: #65a30d;

  --category-blue-weak: var(--accent-weak);
  --category-green-weak: var(--success-weak);
  --category-amber-weak: var(--warning-weak);
  --category-violet-weak: var(--info-weak);
  --category-red-weak: var(--danger-weak);
  --category-cyan-weak: #cffafe;
  --category-pink-weak: #fce7f3;
  --category-lime-weak: #ecfccb;
}
```

Change the note under the block to:

```markdown
// Note: blue/green/amber/violet/red currently alias the semantic palette.
// Cyan/pink/lime are extra categorical slots for non-status classification.
```

- [ ] **Step 7: Run focused static checks**

Run:

```bash
npm run typecheck
```

Expected: exit `0`.

Run:

```bash
npm run lint
```

Expected: exit `0`.

- [ ] **Step 8: Commit Task 2**

Run:

```bash
git add src/theme/artifact-theme.css src/artifacts/example-app/App.tsx src/artifacts/sharp2/sharp2-migration-guide.md
git commit -m "Expand category color palette"
```

## Task 3: Apply Tag Colors In Prompt Library UI

**Files:**
- Modify: `src/components/Checkbox.tsx`
- Modify: `src/artifacts/prompt-library/index.tsx`

- [ ] **Step 1: Allow inline styles on shared Checkbox**

In `src/components/Checkbox.tsx`, update the import to include `CSSProperties`:

```ts
import { Check } from 'lucide-react';
import { type CSSProperties, type KeyboardEvent, type ReactNode, useRef } from 'react';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';
```

Add `style?: CSSProperties;` to `CheckboxProps`:

```ts
type CheckboxProps = {
  label: string;
  reserveLabel?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  focusTarget?: 'box' | 'container';
  size?: 'sm' | 'md';
  className?: string;
  labelClassName?: string;
  boxClassName?: string;
  checkClassName?: string;
  style?: CSSProperties;
  suffix?: ReactNode;
};
```

Destructure `style`:

```ts
  boxClassName,
  checkClassName,
  style,
  suffix,
}: CheckboxProps) {
```

Pass it to the root label:

```tsx
      style={style}
```

The root `<label>` opening should include both `ref={rootRef}` and `style={style}`.

Then replace the checked icon rendering with an override-safe class:

```tsx
        {checked && (
          <Check
            className={[checkClassName ?? 'text-[var(--primary-contrast)]', checkSize]
              .filter(Boolean)
              .join(' ')}
          />
        )}
```

- [ ] **Step 2: Add Prompt Library tag color helper**

In `src/artifacts/prompt-library/index.tsx`, update the React import:

```ts
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
```

Update the prompts import:

```ts
import {
  getPromptTag,
  type PromptEntry,
  type PromptTagColorId,
  type PromptTagId,
  prompts,
  promptTags,
} from './prompts';
```

Add this helper after `type HighlightIndices`:

```ts
type PromptTagColorStyle = CSSProperties & {
  '--prompt-tag-color': string;
  '--prompt-tag-color-weak': string;
  '--checkbox-on-bg': string;
  '--checkbox-on-border': string;
  '--checkbox-off-border': string;
};

function getPromptTagColorStyle(color: PromptTagColorId): PromptTagColorStyle {
  const colorToken = `var(--category-${color})`;

  return {
    '--prompt-tag-color': colorToken,
    '--prompt-tag-color-weak': `var(--category-${color}-weak)`,
    '--checkbox-on-bg': colorToken,
    '--checkbox-on-border': colorToken,
    '--checkbox-off-border': colorToken,
  };
}
```

- [ ] **Step 3: Style the top tag filter checkboxes**

Inside the `promptTags.map((tag) => { ... })` callback, add:

```ts
              const tagColorStyle = getPromptTagColorStyle(tag.color);
```

Pass the style and color-aware classes to `Checkbox`:

```tsx
                <Checkbox
                  key={tag.id}
                  size="sm"
                  focusTarget="container"
                  checked={checked}
                  onCheckedChange={(nextChecked) => toggleTag(tag.id, nextChecked)}
                  label={tag.label}
                  suffix={
                    <span
                      className={[
                        'font-mono text-[10px] tabular-nums',
                        checked ? 'text-[var(--text)]' : 'text-[var(--text-muted)]',
                      ].join(' ')}
                    >
                      {count}
                    </span>
                  }
                  style={tagColorStyle}
                  className={[
                    'border px-2 text-xs',
                    checked
                      ? 'border-[color:var(--prompt-tag-color)] bg-[var(--prompt-tag-color-weak)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]',
                  ].join(' ')}
                  labelClassName="text-xs"
                  checkClassName="text-[var(--surface)]"
                />
```

- [ ] **Step 4: Style prompt tag chips as neutral chips with colored square indicators**

In `PromptTags`, add a color style for each tag and replace the chip markup with:

```tsx
        const tagColorStyle = getPromptTagColorStyle(tag.color);

        return (
          <span
            key={tag.id}
            style={tagColorStyle}
            className={[
              'inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]',
              highlighted
                ? 'border-[color:var(--prompt-tag-color)] bg-[var(--surface-muted)] text-[var(--text)]'
                : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]',
            ].join(' ')}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-none bg-[var(--prompt-tag-color)]" aria-hidden="true" />
            {tag.label}
          </span>
        );
```

- [ ] **Step 5: Run focused checks**

Run:

```bash
npm run typecheck
```

Expected: exit `0`.

Run:

```bash
npm run lint
```

Expected: exit `0`.

- [ ] **Step 6: Commit Task 3**

Run:

```bash
git add src/components/Checkbox.tsx src/artifacts/prompt-library/index.tsx
git commit -m "Color prompt library tags"
```

## Task 4: Verify The Full Change

**Files:**
- No planned source edits.
- Read: `src/artifacts/prompt-library/index.tsx`
- Read: `src/artifacts/example-app/App.tsx`
- Read: `src/theme/artifact-theme.css`

- [ ] **Step 1: Run the full project check**

Run:

```bash
npm run check
```

Expected: lint, typecheck, knip, and tests all exit `0`.

- [ ] **Step 2: Identify shared danger/info token consumers**

Run:

```bash
rg -n "var\\(--(danger|danger-weak|info|info-weak)\\)" src
```

Expected: output identifies visible surfaces that use the shared status tokens. Use this output to decide which routes need visual spot checks after the token change. At minimum, check any matching artifacts among `example-app`, `sharp2`, `focus-compare`, `jsonl-structure-viewer`, and `example`.

- [ ] **Step 3: Start Vite for visual verification**

In this exe.dev VM, use the documented proxy pattern. Start with port `5173` and a host derived from the VM hostname:

```bash
VM_HOST="$(hostname).exe.xyz"
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS="$VM_HOST" npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Expected: Vite reports a local server on port `5173`. If port `5173` is already in use, choose another port between `3000` and `9999`, rerun the command with that port, and use the same port in the URLs below.

Open the shell URLs, not the standalone `/artifact/...` URLs, so the shell light/dark theme toggle is available:

```text
https://$VM_HOST:5173/?artifact=prompt-library
https://$VM_HOST:5173/?artifact=example-app
```

- [ ] **Step 4: Verify Prompt Library in light mode**

In `/?artifact=prompt-library`, with the shell set to light mode:

- Confirm card tags are neutral chips with colored square indicators.
- Confirm top filters are neutral before selection, with colored checkbox outlines.
- Select `Review`, `Subagents`, and `Architecture`; confirm selected filters use colored borders and weak colored backgrounds.
- Open search with `Cmd+K` or `Ctrl+K`; search `subagents`; confirm result tags keep colored square indicators and matched tags get the subtle colored highlight.
- Open a prompt detail dialog; confirm detail tags match card tag styling.
- Tab through filters, cards, search, and detail dialog; confirm focus rings remain visible and unclipped.

- [ ] **Step 5: Verify Prompt Library in dark mode**

Switch the shell to dark mode and repeat the Prompt Library checks:

- Confirm selected filters visibly light up as colored rectangles.
- Confirm red, violet, and cyan states are readable.
- Confirm checkbox checkmarks are visible on selected filter boxes.
- Confirm prompt cards remain calm, with neutral chips and colored square indicators.

- [ ] **Step 6: Verify Example App palette previews**

In `/?artifact=example-app`:

- In light mode, confirm `Message Colors` shows `User`, `Assistant`, `Thinking`, `Tool`, `Critical`, `System`, `Note`, and `Marker`.
- Confirm default selected category swatches are `User`, `Assistant`, `Tool`, and `System`.
- In dark mode, confirm selected category swatches light up with visible weak colored backgrounds.
- Confirm `Danger state` and `Info state` remain visibly red/purple through their border and dot, and that their label text remains readable.

- [ ] **Step 7: Spot-check other shared status-token surfaces**

For each artifact route identified by the grep in Step 2, open the shell URL and inspect both light and dark mode. Use these URLs when applicable:

```text
https://$VM_HOST:5173/?artifact=sharp2
https://$VM_HOST:5173/?artifact=focus-compare
https://$VM_HOST:5173/?artifact=jsonl-structure-viewer
https://$VM_HOST:5173/?artifact=example
```

Expected: any visible danger/info/status elements remain readable, and the updated red/purple values do not create illegible text, borders, badges, or focus states.

- [ ] **Step 8: Stop the dev server**

Stop the Vite process with `Ctrl+C`. Do not leave a required dev-server session running at the end of the task.

- [ ] **Step 9: Record verification**

Run:

```bash
git status --short
```

Expected: no uncommitted source changes.

If `npm run check` and visual verification passed, report both. If any visual issue remains, capture the exact mode, route, and element before fixing it.
