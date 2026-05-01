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

export function searchPrompts(entries: readonly PromptEntry[], query: string, limit = 50): PromptSearchResult[] {
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

  const mergedIndices = mergeRanges(indices, text.length);
  const [firstStart] = mergedIndices[0] ?? [0, 0];
  const from = Math.max(0, firstStart - radius);
  const to = Math.min(text.length, firstStart + radius);

  return {
    field: 'prompt',
    text: text.slice(from, to),
    indices: mergedIndices
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

  const to = Math.min(result.prompt.context.length, radius * 2);
  return {
    field: 'context',
    text: result.prompt.context.slice(0, to),
    indices: [],
    leadingEllipsis: false,
    trailingEllipsis: to < result.prompt.context.length,
  };
}

export function getHighlightedSegments(text: string, indices: readonly MatchRange[]): HighlightSegment[] {
  if (!indices.length) return text ? [{ text, highlighted: false }] : [];

  const mergedIndices = mergeRanges(indices, text.length);
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const [start, end] of mergedIndices) {
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

function normalizeFuseResult(result: FuseResult<PromptEntry>): PromptSearchResult {
  return {
    prompt: result.item,
    matches: result.matches ?? [],
    score: result.score,
    refIndex: result.refIndex,
  };
}

function mergeRanges(indices: readonly MatchRange[], textLength: number): MatchRange[] {
  const sorted = indices
    .map(([start, end]) => [Math.max(0, start), Math.min(textLength - 1, end)] as MatchRange)
    .filter(([start, end]) => start <= end)
    .sort(([leftStart], [rightStart]) => leftStart - rightStart);

  const merged: MatchRange[] = [];

  for (const range of sorted) {
    const previous = merged.at(-1);

    if (!previous || range[0] > previous[1] + 1) {
      merged.push(range);
      continue;
    }

    merged[merged.length - 1] = [previous[0], Math.max(previous[1], range[1])];
  }

  return merged;
}
