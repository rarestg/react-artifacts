# Prompt Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `prompt-library` artifact: a board-style curated prompt reference with tag filters, Fuse-backed highlighted search, a cmdk command palette, exact prompt copying, and prompt-refinement guidance.

**Architecture:** Prompt content lives in static TypeScript data under `src/artifacts/prompt-library/`. Pure search/tag/snippet/highlight helpers live in `search.ts` with Node tests. The React artifact wraps everything in `ArtifactThemeRoot`, renders a note-board default view, and mounts both the cmdk palette and detail dialog inside the artifact theme boundary.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4 utility classes, `fuse.js`, `cmdk`, `lucide-react`, Node test runner, Biome.

---

## Scope Check

The approved spec covers one artifact and one maintainer doc. It does not require backend work, Worker changes, localStorage, D1, authentication, or user-editable prompt storage.

The untracked draft file `docs/superpowers/specs/risk-challenging-discovery.ts` was created by the user during design. Do not import, edit, delete, or commit it while executing this plan. The canonical seed prompt data is in `docs/superpowers/specs/2026-05-01-prompt-library-design.md`.

## File Structure

- Create `src/artifacts/prompt-library/meta.ts`: shell metadata.
- Create `src/artifacts/prompt-library/prompts.ts`: prompt/tag types, curated tags, seed prompts, and validation helpers.
- Create `src/artifacts/prompt-library/search.ts`: Fuse options, tag filtering, search, snippets, and highlight segment helpers.
- Create `src/artifacts/prompt-library/index.tsx`: artifact UI, board view, tag filters, detail dialog, cmdk palette.
- Create `src/artifacts/prompt-library/PROMPT_REFINEMENT.md`: maintainer checklist for adding prompts.
- Create `tests/prompt-library/search.test.ts`: pure tests for tag filtering, search ordering, snippets, and highlight segments.
- Modify `package.json` and `package-lock.json`: add `fuse.js` and `cmdk`.

## Task 1: Add Search Dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install dependencies**

Run:

```bash
npm install fuse.js cmdk
```

Expected: the command exits `0`. `package.json` includes `cmdk` and `fuse.js` in `dependencies`, and `package-lock.json` updates.

- [ ] **Step 2: Check dependency entries**

Run:

```bash
npm pkg get dependencies.fuse.js dependencies.cmdk
```

Expected: both returned values are non-empty semver strings.

- [ ] **Step 3: Commit dependencies**

Run:

```bash
git add package.json package-lock.json
git commit -m "Add prompt library search dependencies"
```

## Task 2: Add Prompt Data, Metadata, And Refinement Guide

**Files:**
- Create: `src/artifacts/prompt-library/meta.ts`
- Create: `src/artifacts/prompt-library/prompts.ts`
- Create: `src/artifacts/prompt-library/PROMPT_REFINEMENT.md`

- [ ] **Step 1: Create `meta.ts`**

Create `src/artifacts/prompt-library/meta.ts`:

```ts
const meta = {
  name: 'Prompt Library',
  subtitle: 'Curated agentic development prompts',
  kind: 'app',
} as const;

export default meta;
```

- [ ] **Step 2: Create `prompts.ts`**

Create `src/artifacts/prompt-library/prompts.ts`:

```ts
export type PromptTagId = 'review' | 'implementation' | 'subagents' | 'risk' | 'architecture';

export type PromptTag = {
  id: PromptTagId;
  label: string;
  description: string;
};

export type PromptEntry = {
  id: string;
  title: string;
  summary: string;
  tags: readonly PromptTagId[];
  context: string;
  prompt: string;
};

export const promptTags = [
  {
    id: 'review',
    label: 'Review',
    description: 'Prompts used while assessing completed work, code feedback, risks, or proposed changes.',
  },
  {
    id: 'implementation',
    label: 'Implementation',
    description: 'Prompts used while planning, executing, or changing implementation work.',
  },
  {
    id: 'subagents',
    label: 'Subagents',
    description: 'Prompts that dispatch or coordinate a fresh subagent.',
  },
  {
    id: 'risk',
    label: 'Risk',
    description: 'Prompts that examine residual risk, assumptions, constraints, and mitigation paths.',
  },
  {
    id: 'architecture',
    label: 'Architecture',
    description: 'Prompts that evaluate design cleanliness, maintainability, and larger structural alternatives.',
  },
] as const satisfies readonly PromptTag[];

const workflowTagIds = new Set<PromptTagId>(['review', 'implementation']);

export const prompts = [
  {
    id: 'risk-challenging-discovery',
    title: 'Risk-Challenging Discovery',
    summary: 'Dispatch a fresh subagent to challenge residual-risk assumptions.',
    tags: ['review', 'subagents', 'risk'],
    context:
      'Use after an implementation or review signoff identifies residual risks and you want a fresh reviewer to test whether those risks can be reduced without unnecessary churn.',
    prompt: `Please dispatch a fresh subagent to do a first-principles review of the residual risks you identified.

Give them enough context to understand each risk deeply: where it lives, why it arose, what assumptions or constraints shaped the current implementation, and what fixes you currently think are plausible.
Make clear that those fixes are context, not conclusions.

Ask them to challenge the assumptions behind the risks and look for whether there is a cleaner way to eliminate or reduce them. They should distinguish real constraints from accidental ones, and consider both small targeted changes and larger design shifts.

They should not manufacture work. "No changes necessary," "the current architecture is already the right fit," or "a couple of small de-risking changes are enough" are all valid answers if the evidence supports them. The point is to weigh the opportunity honestly against complexity, churn, and risk.

After they report back, compare their findings with your own view and recommend the best path forward.`,
  },
  {
    id: 'proposal-review-subagent',
    title: 'Proposal Review Subagent',
    summary: 'Ask a fresh subagent to validate or improve a proposed solution.',
    tags: ['review', 'subagents', 'architecture'],
    context:
      'Use after an agent has assessed feedback and proposed a solution, especially when the design tradeoffs are subtle or a cleaner architecture may exist.',
    prompt: `Please dispatch a fresh subagent to review this issue and the solution you proposed.

Give them enough context to understand the original feedback or concern, the relevant code or architecture area, why the issue matters, the solution you currently recommend, and the tradeoffs, constraints, or assumptions behind that recommendation.
Make clear that your proposed solution is context, not a conclusion.

Ask them to investigate from first principles whether the proposal is sound. They should look for failure modes, hidden coupling, simpler targeted fixes, and any cleaner long-term design shift that would improve correctness, maintainability, or architecture.

They should not manufacture work. "The proposed solution is the right fit," "a smaller change is enough," and "no change is needed" are valid answers if the evidence supports them.

After they report back, compare their findings with your own view and recommend the best path forward.`,
  },
] as const satisfies readonly PromptEntry[];

export function getPromptTag(id: PromptTagId): PromptTag {
  const tag = promptTags.find((item) => item.id === id);
  if (!tag) {
    throw new Error(`Unknown prompt tag: ${id}`);
  }
  return tag;
}

export function hasWorkflowTag(prompt: PromptEntry): boolean {
  return prompt.tags.some((tag) => workflowTagIds.has(tag));
}

export function validatePrompts(entries: readonly PromptEntry[] = prompts): void {
  const ids = new Set<string>();
  const tagIds = new Set<PromptTagId>(promptTags.map((tag) => tag.id));

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

validatePrompts();
```

- [ ] **Step 3: Create `PROMPT_REFINEMENT.md`**

Create `src/artifacts/prompt-library/PROMPT_REFINEMENT.md`:

```markdown
# Prompt Refinement Checklist

Use this checklist before adding a prompt to the curated library.

## Ready To Add

- The prompt is clear about who should do what.
- The prompt is generalizable beyond one conversation.
- The usage context explains when to use the prompt and why it exists.
- The prompt gives enough context guidance without embedding stale specifics.
- The prompt distinguishes context from conclusions.
- The prompt makes room for "no change needed" when evidence supports that.
- The prompt avoids forcing an output format that may not fit the task.
- The prompt avoids unnecessary process ceremony.
- The prompt optimizes for honest assessment rather than manufactured work.

## Before Committing

- Add at least one workflow tag, such as `review` or `implementation`.
- Reuse existing curated tags before adding a new tag.
- Keep the copied `prompt` body literal and free of UI-only notes.
- Search for similar prompts and merge instead of duplicating when the workflow is the same.
```

- [ ] **Step 4: Format the new files**

Run:

```bash
npx biome check --write src/artifacts/prompt-library/meta.ts src/artifacts/prompt-library/prompts.ts
```

Expected: the command exits `0` and reports `Checked 2 files`.

- [ ] **Step 5: Typecheck prompt data**

Run:

```bash
npm run typecheck
```

Expected: the command exits `0`.

- [ ] **Step 6: Commit prompt data**

Run:

```bash
git add src/artifacts/prompt-library/meta.ts src/artifacts/prompt-library/prompts.ts src/artifacts/prompt-library/PROMPT_REFINEMENT.md
git commit -m "Add prompt library seed data"
```

## Task 3: Add Search, Snippet, And Highlight Helpers With Tests

**Files:**
- Create: `src/artifacts/prompt-library/search.ts`
- Create: `tests/prompt-library/search.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/prompt-library/search.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { prompts } from '../../src/artifacts/prompt-library/prompts';
import {
  filterPromptsByTags,
  getHighlightedSegments,
  makeSnippet,
  pickResultSnippet,
  searchPrompts,
} from '../../src/artifacts/prompt-library/search';

test('filterPromptsByTags uses AND semantics', () => {
  const reviewSubagentPrompts = filterPromptsByTags(prompts, ['review', 'subagents']);
  assert.deepEqual(
    reviewSubagentPrompts.map((prompt) => prompt.id),
    ['risk-challenging-discovery', 'proposal-review-subagent'],
  );

  const riskArchitecturePrompts = filterPromptsByTags(prompts, ['risk', 'architecture']);
  assert.deepEqual(
    riskArchitecturePrompts.map((prompt) => prompt.id),
    [],
  );
});

test('searchPrompts searches title, tags, context, and prompt body with highlights', () => {
  const results = searchPrompts(prompts, 'residual risks');

  assert.equal(results[0]?.prompt.id, 'risk-challenging-discovery');
  assert.ok(results[0]?.matches.some((match) => match.key === 'summary' || match.key === 'context' || match.key === 'prompt'));
});

test('searchPrompts supports title-only matches', () => {
  const results = searchPrompts(prompts, 'proposal review');

  assert.equal(results[0]?.prompt.id, 'proposal-review-subagent');
  assert.ok(results[0]?.matches.some((match) => match.key === 'title'));
});

test('searchPrompts returns an empty list when nothing matches', () => {
  const results = searchPrompts(prompts, 'zzzzzz-no-prompt');

  assert.deepEqual(results, []);
});

test('searchPrompts returns source order for an empty query', () => {
  const results = searchPrompts(prompts, '   ');

  assert.deepEqual(
    results.map((result) => result.prompt.id),
    ['risk-challenging-discovery', 'proposal-review-subagent'],
  );
  assert.deepEqual(results[0]?.matches, []);
});

test('makeSnippet adjusts inclusive match ranges', () => {
  const snippet = makeSnippet('0123456789abcdefghij', [[10, 12]], 4);

  assert.equal(snippet.text, '6789abcd');
  assert.equal(snippet.leadingEllipsis, true);
  assert.equal(snippet.trailingEllipsis, true);
  assert.deepEqual(snippet.indices, [[4, 6]]);
});

test('getHighlightedSegments merges overlapping inclusive ranges', () => {
  const segments = getHighlightedSegments('abcdefghi', [
    [1, 3],
    [3, 5],
  ]);

  assert.deepEqual(segments, [
    { text: 'a', highlighted: false },
    { text: 'bcdef', highlighted: true },
    { text: 'ghi', highlighted: false },
  ]);
});

test('pickResultSnippet prefers summary, then context, then prompt', () => {
  const [result] = searchPrompts(prompts, 'validate proposed solution');
  assert.equal(result?.prompt.id, 'proposal-review-subagent');

  const snippet = pickResultSnippet(result);
  assert.equal(snippet.field, 'summary');
  assert.match(snippet.text, /validate/i);
});

test('tag filtering composes with search input', () => {
  const filtered = filterPromptsByTags(prompts, ['architecture']);
  const results = searchPrompts(filtered, 'subagent');

  assert.deepEqual(
    results.map((result) => result.prompt.id),
    ['proposal-review-subagent'],
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --import tsx --test tests/prompt-library/search.test.ts
```

Expected:

```text
Could not resolve "../../src/artifacts/prompt-library/search"
```

- [ ] **Step 3: Implement `search.ts`**

Create `src/artifacts/prompt-library/search.ts`:

```ts
import Fuse, { type FuseResult, type FuseResultMatch, type IFuseOptions } from 'fuse.js';

import type { PromptEntry, PromptTagId } from './prompts';

type MatchRange = readonly [number, number];

export type HighlightSegment = {
  text: string;
  highlighted: boolean;
};

export type PromptSearchResult = {
  prompt: PromptEntry;
  matches: readonly FuseResultMatch[];
  score?: number;
  refIndex: number;
};

export type PromptSnippet = {
  field: 'summary' | 'context' | 'prompt';
  text: string;
  indices: MatchRange[];
  leadingEllipsis: boolean;
  trailingEllipsis: boolean;
};

export const promptFuseOptions = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'tags', weight: 1.75 },
    { name: 'summary', weight: 1.5 },
    { name: 'context', weight: 1 },
    { name: 'prompt', weight: 1 },
  ],
  includeMatches: true,
  includeScore: true,
  ignoreLocation: true,
  findAllMatches: true,
  threshold: 0.35,
  minMatchCharLength: 2,
} satisfies IFuseOptions<PromptEntry>;

export function filterPromptsByTags(
  entries: readonly PromptEntry[],
  selectedTags: readonly PromptTagId[],
): PromptEntry[] {
  if (!selectedTags.length) return [...entries];
  return entries.filter((entry) => selectedTags.every((tag) => entry.tags.includes(tag)));
}

export function searchPrompts(
  entries: readonly PromptEntry[],
  query: string,
  limit = 50,
): PromptSearchResult[] {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return entries.slice(0, limit).map((prompt, refIndex) => ({
      prompt,
      matches: [],
      refIndex,
    }));
  }

  const fuse = new Fuse(entries, promptFuseOptions);
  return fuse.search(trimmedQuery, { limit }).map((result) => normalizeFuseResult(result));
}

function normalizeFuseResult(result: FuseResult<PromptEntry>): PromptSearchResult {
  return {
    prompt: result.item,
    matches: result.matches ?? [],
    score: result.score,
    refIndex: result.refIndex,
  };
}

export function getMatchForKey(result: PromptSearchResult, key: string): FuseResultMatch | undefined {
  return result.matches.find((match) => match.key === key);
}

export function makeSnippet(text: string, indices: readonly MatchRange[], radius = 80): PromptSnippet {
  if (!indices.length) {
    const to = Math.min(text.length, radius * 2);
    return {
      field: 'prompt',
      text: text.slice(0, to),
      indices: [],
      leadingEllipsis: false,
      trailingEllipsis: to < text.length,
    };
  }

  const firstStart = indices[0][0];
  const from = Math.max(0, firstStart - radius);
  const to = Math.min(text.length, firstStart + radius);

  return {
    field: 'prompt',
    text: text.slice(from, to),
    indices: indices
      .filter(([start, end]) => end >= from && start < to)
      .map(([start, end]) => [Math.max(0, start - from), Math.min(to - from - 1, end - from)] as MatchRange),
    leadingEllipsis: from > 0,
    trailingEllipsis: to < text.length,
  };
}

export function pickResultSnippet(result: PromptSearchResult | undefined, radius = 80): PromptSnippet {
  if (!result) {
    return { field: 'context', text: '', indices: [], leadingEllipsis: false, trailingEllipsis: false };
  }

  for (const field of ['summary', 'context', 'prompt'] as const) {
    const match = getMatchForKey(result, field);
    if (!match?.indices.length) continue;
    const snippet = makeSnippet(result.prompt[field], match.indices, radius);
    return { ...snippet, field };
  }

  const context = result.prompt.context;
  const to = Math.min(context.length, radius * 2);
  return {
    field: 'context',
    text: context.slice(0, to),
    indices: [],
    leadingEllipsis: false,
    trailingEllipsis: to < context.length,
  };
}

export function getHighlightedSegments(text: string, indices: readonly MatchRange[]): HighlightSegment[] {
  if (!indices.length) return [{ text, highlighted: false }];

  const merged = mergeRanges(indices, text.length);
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const [start, end] of merged) {
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), highlighted: false });
    }
    segments.push({ text: text.slice(start, end + 1), highlighted: true });
    cursor = end + 1;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false });
  }

  return segments.filter((segment) => segment.text.length > 0);
}

function mergeRanges(indices: readonly MatchRange[], textLength: number): MatchRange[] {
  const sorted = indices
    .map(([start, end]) => [Math.max(0, start), Math.min(textLength - 1, end)] as MatchRange)
    .filter(([start, end]) => start <= end)
    .sort(([leftStart], [rightStart]) => leftStart - rightStart);

  const merged: MatchRange[] = [];

  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || range[0] > previous[1] + 1) {
      merged.push(range);
      continue;
    }
    merged[merged.length - 1] = [previous[0], Math.max(previous[1], range[1])];
  }

  return merged;
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
node --import tsx --test tests/prompt-library/search.test.ts
```

Expected:

```text
# pass 9
# fail 0
```

- [ ] **Step 5: Format search files**

Run:

```bash
npx biome check --write src/artifacts/prompt-library/search.ts tests/prompt-library/search.test.ts
```

Expected: the command exits `0` and reports `Checked 2 files`.

- [ ] **Step 6: Commit search helpers**

Run:

```bash
git add src/artifacts/prompt-library/search.ts tests/prompt-library/search.test.ts
git commit -m "Add prompt library search helpers"
```

## Task 4: Build Board, Tag Filters, And Detail Dialog

**Files:**
- Create: `src/artifacts/prompt-library/index.tsx`

- [ ] **Step 1: Create the artifact UI without cmdk**

Create `src/artifacts/prompt-library/index.tsx`:

```tsx
import { Search, X } from 'lucide-react';
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';

import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { Checkbox } from '../../components/Checkbox';
import { CopyButton } from '../../components/CopyButton';
import { getPromptTag, prompts, promptTags, type PromptEntry, type PromptTagId } from './prompts';
import { filterPromptsByTags } from './search';

const rootClass = 'relative min-h-screen overflow-hidden bg-[var(--surface-muted)] text-[var(--text)]';
const panelClass = 'border border-[var(--border)] bg-[var(--surface)]';
const focusClass =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]';

export default function PromptLibrary() {
  const [selectedTags, setSelectedTags] = useState<PromptTagId[]>([]);
  const [activePrompt, setActivePrompt] = useState<PromptEntry | null>(null);
  const detailReturnFocusRef = useRef<HTMLElement | null>(null);

  const visiblePrompts = useMemo(() => filterPromptsByTags(prompts, selectedTags), [selectedTags]);

  const openPromptDetail = (prompt: PromptEntry, opener: HTMLElement | null) => {
    detailReturnFocusRef.current = opener;
    setActivePrompt(prompt);
  };

  const toggleTag = (tag: PromptTagId, checked: boolean) => {
    setSelectedTags((current) =>
      checked ? [...current, tag] : current.filter((selected) => selected !== tag),
    );
  };

  return (
    <ArtifactThemeRoot className={rootClass}>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-semibold">Prompt Library</h1>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {visiblePrompts.length} of {prompts.length} prompts
              </p>
            </div>
            <button
              type="button"
              disabled
              title="Command search is added in the next task"
              className={[
                'inline-flex h-9 items-center gap-2 border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3 text-sm font-medium text-[var(--text)]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                focusClass,
              ].join(' ')}
            >
              <Search className="h-4 w-4" aria-hidden />
              Search
              <span className="border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                Ctrl K
              </span>
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4">
          <section className={['flex flex-wrap items-center gap-2 p-3', panelClass].join(' ')} aria-label="Prompt tags">
            {promptTags.map((tag) => {
              const checked = selectedTags.includes(tag.id);
              const count = filterPromptsByTags(prompts, [
                ...selectedTags.filter((selected) => selected !== tag.id),
                tag.id,
              ]).length;
              return (
                <Checkbox
                  key={tag.id}
                  size="sm"
                  focusTarget="container"
                  checked={checked}
                  onCheckedChange={(nextChecked) => toggleTag(tag.id, nextChecked)}
                  label={tag.label}
                  suffix={
                    <span className="font-mono text-[10px] text-[var(--text-muted)] tabular-nums">{count}</span>
                  }
                  className={[
                    'border px-2 text-xs',
                    checked
                      ? 'border-[var(--accent)] bg-[var(--accent-weak)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]',
                  ].join(' ')}
                  labelClassName="text-xs"
                />
              );
            })}
          </section>

          {visiblePrompts.length ? (
            <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3">
              {visiblePrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} onOpen={(opener) => openPromptDetail(prompt, opener)} />
              ))}
            </section>
          ) : (
            <section className={['p-6 text-sm text-[var(--text-muted)]', panelClass].join(' ')}>
              No prompts match the selected tags.
            </section>
          )}
        </main>
      </div>

      {activePrompt && (
        <PromptDetailDialog
          prompt={activePrompt}
          returnFocusTo={detailReturnFocusRef.current}
          onClose={() => setActivePrompt(null)}
        />
      )}
    </ArtifactThemeRoot>
  );
}

function PromptCard({ prompt, onOpen }: { prompt: PromptEntry; onOpen: (opener: HTMLElement) => void }) {
  return (
    <article className={['flex min-h-56 flex-col gap-4 p-4', panelClass].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={(event) => onOpen(event.currentTarget)}
          className={['min-w-0 text-left text-sm font-semibold text-[var(--text)] hover:underline', focusClass].join(
            ' ',
          )}
        >
          {prompt.title}
        </button>
        <CopyButton text={prompt.prompt} ariaLabel={`Copy ${prompt.title}`} idleLabel="Copy" />
      </div>
      <p className="text-sm text-[var(--text)]">{prompt.summary}</p>
      <p className="line-clamp-4 text-xs leading-5 text-[var(--text-muted)]">{prompt.context}</p>
      <div className="mt-auto">
        <PromptTags prompt={prompt} />
      </div>
    </article>
  );
}

function PromptTags({
  prompt,
  highlightedTagIds = [],
}: {
  prompt: PromptEntry;
  highlightedTagIds?: readonly PromptTagId[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {prompt.tags.map((tagId) => {
        const tag = getPromptTag(tagId);
        const highlighted = highlightedTagIds.includes(tagId);
        return (
          <span
            key={tag.id}
            className={[
              'border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]',
              highlighted
                ? 'border-[var(--accent)] bg-[var(--accent-weak)] text-[var(--text)]'
                : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]',
            ].join(' ')}
          >
            {tag.label}
          </span>
        );
      })}
    </div>
  );
}

function PromptDetailDialog({
  prompt,
  returnFocusTo,
  fallbackFocusTo = null,
  onClose,
}: {
  prompt: PromptEntry;
  returnFocusTo: HTMLElement | null;
  fallbackFocusTo?: HTMLElement | null;
  onClose: () => void;
}) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    return () => {
      if (returnFocusTo?.isConnected) {
        returnFocusTo.focus();
        return;
      }

      if (fallbackFocusTo?.isConnected) {
        fallbackFocusTo.focus();
      }
    };
  }, [fallbackFocusTo, returnFocusTo]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[var(--overlay)] p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onKeyDown={handleKeyDown}
        className="flex max-h-full w-full max-w-[46rem] flex-col border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <div className="min-w-0">
            <h2 ref={headingRef} id={headingId} tabIndex={-1} className={['text-base font-semibold', focusClass].join(' ')}>
              {prompt.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{prompt.summary}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close prompt details"
            className={['p-1 text-[var(--text-muted)] hover:text-[var(--text)]', focusClass].join(' ')}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <PromptTags prompt={prompt} />
          <section className="text-sm text-[var(--text-muted)]">
            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Usage Context
            </h3>
            <p>{prompt.context}</p>
          </section>
          <section className="min-h-0">
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Prompt
            </h3>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap border border-[var(--border)] bg-[var(--surface-muted)] p-3 font-mono text-xs leading-5 text-[var(--text)]">
              {prompt.prompt}
            </pre>
          </section>
        </div>
        <div className="flex justify-end border-t border-[var(--border)] px-4 py-3">
          <CopyButton text={prompt.prompt} ariaLabel={`Copy ${prompt.title}`} idleLabel="Copy Prompt" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck the UI skeleton**

Run:

```bash
npm run typecheck
```

Expected: the command exits `0`.

- [ ] **Step 3: Format the artifact UI**

Run:

```bash
npx biome check --write src/artifacts/prompt-library/index.tsx
```

Expected: the command exits `0` and reports `Checked 1 file`.

- [ ] **Step 4: Build**

Run:

```bash
npm run build
```

Expected: the command exits `0` and Vite reports a successful production build.

- [ ] **Step 5: Commit board UI**

Run:

```bash
git add src/artifacts/prompt-library/index.tsx
git commit -m "Add prompt library board UI"
```

## Task 5: Add cmdk Palette And Search Highlighting

**Files:**
- Modify: `src/artifacts/prompt-library/index.tsx`
- Modify: `src/artifacts/prompt-library/search.ts`
- Modify: `tests/prompt-library/search.test.ts`

- [ ] **Step 1: Extend tests for tag-only snippets**

Add this test to `tests/prompt-library/search.test.ts`:

```ts
test('pickResultSnippet falls back to context for tag-only matches', () => {
  const [result] = searchPrompts(
    [
      {
        id: 'tag-only',
        title: 'Alpha',
        summary: 'Beta',
        tags: ['subagents'],
        context: 'Use after a workflow calls for delegated investigation.',
        prompt: 'Delegate the investigation.',
      },
    ],
    'subagents',
  );
  const snippet = pickResultSnippet(result);

  assert.equal(snippet.field, 'context');
  assert.match(snippet.text, /Use after/i);
});
```

- [ ] **Step 2: Run the search test**

Run:

```bash
node --import tsx --test tests/prompt-library/search.test.ts
```

Expected:

```text
# pass 10
# fail 0
```

- [ ] **Step 3: Wire cmdk into `index.tsx`**

Modify imports in `src/artifacts/prompt-library/index.tsx`:

```tsx
import { Command } from 'cmdk';
import { Search, X } from 'lucide-react';
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  filterPromptsByTags,
  getHighlightedSegments,
  getMatchForKey,
  pickResultSnippet,
  searchPrompts,
  type PromptSearchResult,
} from './search';
```

Add state:

```tsx
const [searchOpen, setSearchOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [activeSearchResult, setActiveSearchResult] = useState<PromptSearchResult | null>(null);
const themePortalRef = useRef<HTMLDivElement>(null);
const searchButtonRef = useRef<HTMLButtonElement>(null);
const searchResults = useMemo(() => searchPrompts(visiblePrompts, searchQuery), [visiblePrompts, searchQuery]);
```

Add a keyboard shortcut effect:

```tsx
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      setSearchOpen((open) => !open);
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

Replace the disabled search button with:

```tsx
<button
  ref={searchButtonRef}
  type="button"
  onClick={() => setSearchOpen(true)}
  className={[
    'inline-flex h-9 items-center gap-2 border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3 text-sm font-medium text-[var(--text)]',
    'hover:bg-[var(--surface-strong)] active:bg-[var(--surface-muted)]',
    focusClass,
  ].join(' ')}
>
  <Search className="h-4 w-4" aria-hidden />
  Search
  <span className="border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
    Ctrl K
  </span>
</button>
```

Render the palette and portal container before the closing `</ArtifactThemeRoot>`:

```tsx
{activePrompt && (
  <PromptDetailDialog
    prompt={activePrompt}
    searchResult={activeSearchResult}
    returnFocusTo={detailReturnFocusRef.current}
    fallbackFocusTo={searchButtonRef.current}
    onClose={() => {
      setActivePrompt(null);
      setActiveSearchResult(null);
    }}
  />
)}
<PromptCommandPalette
  container={themePortalRef.current}
  open={searchOpen}
  query={searchQuery}
  results={searchResults}
  onOpenChange={setSearchOpen}
  onQueryChange={setSearchQuery}
  onSelectPrompt={(prompt, result, opener) => {
    detailReturnFocusRef.current = opener;
    setActivePrompt(prompt);
    setActiveSearchResult(result);
    setSearchOpen(false);
  }}
/>
<div ref={themePortalRef} className="pointer-events-none absolute inset-0" />
```

Update the board card `onOpen` handler so direct card opens clear stale search highlights:

```tsx
<PromptCard
  key={prompt.id}
  prompt={prompt}
  onOpen={(opener) => {
    detailReturnFocusRef.current = opener;
    setActivePrompt(prompt);
    setActiveSearchResult(null);
  }}
/>
```

Remove the Task 4 `activePrompt` dialog render so the dialog is rendered only once with the new `searchResult` prop.

- [ ] **Step 4: Implement `PromptCommandPalette`**

Add this component below the detail dialog:

```tsx
function PromptCommandPalette({
  container,
  open,
  query,
  results,
  onOpenChange,
  onQueryChange,
  onSelectPrompt,
}: {
  container: HTMLDivElement | null;
  open: boolean;
  query: string;
  results: readonly PromptSearchResult[];
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSelectPrompt: (prompt: PromptEntry, result: PromptSearchResult, opener: HTMLElement | null) => void;
}) {
  return (
    <Command.Dialog
      container={container ?? undefined}
      open={open}
      onOpenChange={onOpenChange}
      shouldFilter={false}
      label="Search prompts"
      overlayClassName="pointer-events-auto absolute inset-0 z-40 bg-[var(--overlay)]"
      contentClassName="pointer-events-auto absolute left-1/2 top-4 z-50 flex max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-[42rem] -translate-x-1/2 flex-col border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]"
    >
      <div className="border-b border-[var(--border)] px-3 py-3">
        <Command.Input
          value={query}
          onValueChange={onQueryChange}
          placeholder="Search prompts..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>
      <Command.List className="max-h-[24rem] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-6 text-sm text-[var(--text-muted)]">No prompts found.</Command.Empty>
        {results.map((result) => (
          <Command.Item
            key={result.prompt.id}
            value={result.prompt.id}
            onSelect={() => {
              const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
              onSelectPrompt(result.prompt, result, opener);
            }}
            className="cursor-pointer border border-transparent px-3 py-2 text-left data-[selected=true]:border-[var(--accent)] data-[selected=true]:bg-[var(--accent-weak)]"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div className="font-medium">
                <HighlightedText text={result.prompt.title} indices={getMatchForKey(result, 'title')?.indices ?? []} />
              </div>
              <div className="text-xs text-[var(--text)]">
                <HighlightedText text={result.prompt.summary} indices={getMatchForKey(result, 'summary')?.indices ?? []} />
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                <ResultSnippet result={result} />
              </div>
              <PromptTags prompt={result.prompt} highlightedTagIds={getMatchedTagIds(result)} />
            </div>
          </Command.Item>
        ))}
      </Command.List>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]">
        <span>Up/Down Navigate</span>
        <span>Enter Open</span>
        <span>Esc Close</span>
      </div>
    </Command.Dialog>
  );
}
```

Add these helpers below `PromptCommandPalette`:

```tsx
function ResultSnippet({ result }: { result: PromptSearchResult }) {
  const snippet = pickResultSnippet(result);
  return (
    <>
      {snippet.leadingEllipsis && <span aria-hidden>...</span>}
      <HighlightedText text={snippet.text} indices={snippet.indices} />
      {snippet.trailingEllipsis && <span aria-hidden>...</span>}
    </>
  );
}

function getMatchedTagIds(result: PromptSearchResult): PromptTagId[] {
  const tagMatches = result.matches.filter((match) => match.key === 'tags');
  const matchedValues = new Set(tagMatches.map((match) => String(match.value ?? '')));
  return result.prompt.tags.filter((tag) => matchedValues.has(tag));
}
```

Update `PromptDetailDialog` to accept `searchResult`:

```tsx
function PromptDetailDialog({
  prompt,
  searchResult,
  returnFocusTo,
  fallbackFocusTo = null,
  onClose,
}: {
  prompt: PromptEntry;
  searchResult?: PromptSearchResult | null;
  returnFocusTo: HTMLElement | null;
  fallbackFocusTo?: HTMLElement | null;
  onClose: () => void;
}) {
```

Add these constants after `headingRef`:

```tsx
  const titleMatch = searchResult ? getMatchForKey(searchResult, 'title') : undefined;
  const summaryMatch = searchResult ? getMatchForKey(searchResult, 'summary') : undefined;
  const contextMatch = searchResult ? getMatchForKey(searchResult, 'context') : undefined;
  const promptMatch = searchResult ? getMatchForKey(searchResult, 'prompt') : undefined;
```

Replace the plain title, summary, context, and prompt-body render sites with:

```tsx
<h2 ref={headingRef} id={headingId} tabIndex={-1} className={['text-base font-semibold', focusClass].join(' ')}>
  <HighlightedText text={prompt.title} indices={titleMatch?.indices ?? []} />
</h2>
<p className="mt-1 text-sm text-[var(--text-muted)]">
  <HighlightedText text={prompt.summary} indices={summaryMatch?.indices ?? []} />
</p>
```

```tsx
<p>
  <HighlightedText text={prompt.context} indices={contextMatch?.indices ?? []} />
</p>
```

```tsx
<pre className="max-h-80 overflow-auto whitespace-pre-wrap border border-[var(--border)] bg-[var(--surface-muted)] p-3 font-mono text-xs leading-5 text-[var(--text)]">
  <HighlightedText text={prompt.prompt} indices={promptMatch?.indices ?? []} />
</pre>
```

- [ ] **Step 5: Implement highlighted text rendering**

Implement `HighlightedText` in `index.tsx`:

```tsx
function HighlightedText({ text, indices }: { text: string; indices: readonly [number, number][] }) {
  return (
    <>
      {getHighlightedSegments(text, indices).map((segment, index) =>
        segment.highlighted ? (
          <mark key={`${index}-${segment.text}`} className="bg-[var(--highlight)] px-0 text-[var(--text)]">
            {segment.text}
          </mark>
        ) : (
          <span key={`${index}-${segment.text}`}>{segment.text}</span>
        ),
      )}
    </>
  );
}
```

- [ ] **Step 6: Typecheck, test, and build**

Run:

```bash
node --import tsx --test tests/prompt-library/search.test.ts
npm run typecheck
npm run build
```

Expected: all three commands exit `0`; the test output reports `# fail 0`, and Vite reports a successful production build.

- [ ] **Step 7: Format changed files**

Run:

```bash
npx biome check --write src/artifacts/prompt-library/index.tsx src/artifacts/prompt-library/search.ts tests/prompt-library/search.test.ts
```

Expected: the command exits `0` and reports `Checked 3 files`.

- [ ] **Step 8: Commit search UI**

Run:

```bash
git add src/artifacts/prompt-library/index.tsx src/artifacts/prompt-library/search.ts tests/prompt-library/search.test.ts
git commit -m "Add prompt library command search"
```

## Task 6: Final Validation And Cleanup

**Files:**
- No planned file changes.

- [ ] **Step 1: Run full checks**

Run:

```bash
npm run check
```

Expected: the command exits `0`.

- [ ] **Step 2: Start the dev server**

Run:

```bash
npm run dev -- --host 0.0.0.0
```

Expected: Vite prints a local URL and a network URL.

Keep this process running for manual validation.

- [ ] **Step 3: Manually validate the artifact**

Open the app and select the `Prompt Library` artifact. Validate:

- The board shows two prompt cards.
- `Review` and `Subagents` together still show both prompts.
- `Risk` and `Architecture` together show the empty state.
- Card copy and detail-dialog copy copy only the prompt body.
- The detail dialog closes with Escape and with the close button.
- `Ctrl+K` or `Cmd+K` opens the command palette.
- Searching `residual risks` highlights a result and opens `Risk-Challenging Discovery`.
- Searching `subagents` shows highlighted tag chips and context snippets.
- Searching `zzzzzz-no-prompt` shows the command palette empty state without changing selected tags.
- Light and dark shell themes keep board, dialog, and palette readable.
- iPhone/iPad preview sizes do not break board layout or command palette.

- [ ] **Step 4: Stop the dev server**

Press `Ctrl+C` in the dev server terminal.

- [ ] **Step 5: Check git status**

Run:

```bash
git status --short
```

Expected: only intentional changes are present. The user-owned untracked `docs/superpowers/specs/risk-challenging-discovery.ts` may still appear; do not add it unless the user explicitly asks.

- [ ] **Step 6: Return to the relevant task for validation failures**

If validation fails, return to the task that introduced the failing behavior, make the focused fix there, rerun that task's checks, rerun `npm run check`, and commit with the task's existing commit pattern.
