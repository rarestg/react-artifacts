import Fuse, { type Expression, type FuseResult, type FuseResultMatch, type IFuseOptions } from 'fuse.js';

import { type PromptEntry, type PromptTagId, renderPromptText } from './prompts';

export type MatchRange = readonly [number, number];
type DisplayMatchSource = 'phrase' | 'token' | 'fuse' | 'none';

export type HighlightSegment = {
  text: string;
  highlighted: boolean;
};

export type DisplayMatch<Field extends string = string> = {
  field: Field;
  indices: MatchRange[];
  source: DisplayMatchSource;
};

export type DisplayMatchField<Field extends string = string> = {
  field: Field;
  text: string;
  fuseIndices?: readonly MatchRange[];
};

export type PromptHeaderDisplayMatches = {
  titleIndices: MatchRange[];
  summaryIndices: MatchRange[];
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

export type RenderedPromptSearchVariant = {
  optionId?: string;
  text: string;
};

export type MatchedPromptSearchVariant = RenderedPromptSearchVariant & {
  fuseIndices: readonly MatchRange[];
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
  getFn: (entry, path) => {
    const key = Array.isArray(path) ? path[0] : path;

    if (key === 'prompt') {
      return getRenderedPromptSearchVariants(entry).map((variant) => variant.text);
    }

    const value = entry[key as keyof PromptEntry];
    return typeof value === 'string' || Array.isArray(value) ? value : '';
  },
} satisfies IFuseOptions<PromptEntry>;

const promptLiteralSearchFields = ['title', 'tags', 'summary', 'context', 'prompt'] as const;

const promptLiteralSearchFuseOptions = {
  ...promptFuseOptions,
  useExtendedSearch: true,
} satisfies IFuseOptions<PromptEntry>;

export function filterPromptsByTags(
  entries: readonly PromptEntry[],
  selectedTags: readonly PromptTagId[],
): PromptEntry[] {
  if (!selectedTags.length) return [...entries];
  return entries.filter((entry) => selectedTags.every((tag) => entry.tags.includes(tag)));
}

export function searchPrompts(entries: readonly PromptEntry[], query: string, limit = 50): PromptSearchResult[] {
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.trunc(limit)) : 50;
  const trimmedQuery = query.trim();

  if (safeLimit === 0) return [];

  if (!trimmedQuery) {
    return entries.slice(0, safeLimit).map((prompt, refIndex) => ({
      prompt,
      matches: [],
      refIndex,
    }));
  }

  const literalQuery = getMultiTokenLiteralSearchQuery(trimmedQuery);

  if (literalQuery) {
    const literalFuse = new Fuse(entries, promptLiteralSearchFuseOptions);
    const literalResults = literalFuse.search(literalQuery, { limit: safeLimit });

    if (literalResults.length) {
      return literalResults.map((result) => normalizeFuseResult(result));
    }
  }

  const fuse = new Fuse(entries, promptFuseOptions);
  return fuse.search(trimmedQuery, { limit: safeLimit }).map((result) => normalizeFuseResult(result));
}

export function getMatchForKey(result: PromptSearchResult, key: string): FuseResultMatch | undefined {
  return result.matches.find((match) => match.key === key);
}

export function getDisplayMatchIndices(
  text: string,
  query: string,
  fuseIndices: readonly MatchRange[] = [],
): MatchRange[] {
  return getDisplayMatchCandidate(text, query, fuseIndices).indices;
}

export function getDisplayMatchesForFields<const Field extends string>(
  fields: readonly DisplayMatchField<Field>[],
  query: string,
): DisplayMatch<Field>[] {
  const matches = fields.map(({ field, text, fuseIndices = [] }) => ({
    field,
    ...getDisplayMatchCandidate(text, query, fuseIndices),
  }));
  const hasLiteralEvidence = matches.some(
    (match) => (match.source === 'phrase' || match.source === 'token') && match.indices.length > 0,
  );

  if (!hasLiteralEvidence) return matches;

  return matches.map((match) => (match.source === 'fuse' ? { ...match, indices: [], source: 'none' as const } : match));
}

export function getPromptHeaderDisplayMatches(result: PromptSearchResult, query: string): PromptHeaderDisplayMatches {
  const displayMatches = getPromptDisplayMatches(result, query);
  const titleDisplayMatch = displayMatches.find((match) => match.field === 'title');
  const summaryDisplayMatch = displayMatches.find((match) => match.field === 'summary');

  return {
    titleIndices: titleDisplayMatch?.indices ?? [],
    summaryIndices: summaryDisplayMatch?.indices ?? [],
  };
}

export function getRenderedPromptSearchVariants(prompt: PromptEntry): RenderedPromptSearchVariant[] {
  if (!prompt.modifier) {
    return [{ text: renderPromptText(prompt) }];
  }

  return prompt.modifier.options.map((option) => ({
    optionId: option.id,
    text: renderPromptText(prompt, option.id),
  }));
}

export function getMatchedPromptSearchVariant(
  result: PromptSearchResult,
  query: string,
): MatchedPromptSearchVariant | undefined {
  const candidate = getPromptMatchDisplayCandidate(result, query);

  if (!candidate.hasPromptMatch) return undefined;

  return {
    optionId: candidate.optionId,
    text: candidate.text,
    fuseIndices: candidate.fuseIndices,
  };
}

export function makeSnippet(text: string, indices: readonly MatchRange[], radius = 80): PromptSnippet {
  if (!indices.length) {
    return makeLeadingSnippet(text, radius);
  }

  const mergedIndices = mergeRanges(indices, text.length);
  if (!mergedIndices.length) {
    return makeLeadingSnippet(text, radius);
  }

  const [firstStart, firstEnd] = mergedIndices[0] ?? [0, 0];
  const from = Math.max(0, firstStart - radius);
  const to = Math.min(text.length, firstEnd + radius + 1);

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

function makeLeadingSnippet(text: string, radius: number): PromptSnippet {
  const to = Math.min(text.length, radius * 2);
  return {
    field: 'prompt',
    text: text.slice(0, to),
    indices: [],
    leadingEllipsis: false,
    trailingEllipsis: to < text.length,
  };
}

export function pickResultSnippet(result: PromptSearchResult | undefined, radius = 80, query = ''): PromptSnippet {
  if (!result) {
    return { field: 'context', text: '', indices: [], leadingEllipsis: false, trailingEllipsis: false };
  }

  const snippetFields = ['summary', 'context', 'prompt'] as const;
  const displayFields = getPromptDisplayFields(result, query);
  const displayMatches = getDisplayMatchesForFields(displayFields, query);
  const candidates = snippetFields.map((field) => ({
    field,
    candidate: displayMatches.find((match) => match.field === field) ?? { indices: [], source: 'none' as const },
  }));

  for (const source of ['phrase', 'token', 'fuse'] as const) {
    const displayMatch = candidates.find(({ candidate }) => candidate.source === source && candidate.indices.length);
    if (!displayMatch) continue;

    const displayField = displayFields.find((field) => field.field === displayMatch.field);
    const snippet = makeSnippet(displayField?.text ?? '', displayMatch.candidate.indices, radius);
    return { ...snippet, field: displayMatch.field };
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

function getPromptDisplayMatches(result: PromptSearchResult, query: string) {
  return getDisplayMatchesForFields(getPromptDisplayFields(result, query), query);
}

function getPromptDisplayFields(result: PromptSearchResult, query: string) {
  const titleMatch = getMatchForKey(result, 'title');
  const summaryMatch = getMatchForKey(result, 'summary');
  const contextMatch = getMatchForKey(result, 'context');
  const promptCandidate = getPromptMatchDisplayCandidate(result, query);

  return [
    { field: 'title', text: result.prompt.title, fuseIndices: titleMatch?.indices },
    { field: 'summary', text: result.prompt.summary, fuseIndices: summaryMatch?.indices },
    { field: 'context', text: result.prompt.context, fuseIndices: contextMatch?.indices },
    { field: 'prompt', text: promptCandidate.text, fuseIndices: promptCandidate.fuseIndices },
    { field: 'tags', text: result.prompt.tags.join(' ') },
  ] as const satisfies readonly DisplayMatchField<'title' | 'summary' | 'context' | 'prompt' | 'tags'>[];
}

function getMultiTokenLiteralSearchQuery(query: string): Expression | undefined {
  const tokens = getDisplayTokens(query);

  if (tokens.length < 2) return undefined;

  return {
    $and: tokens.map((token) => ({
      $or: promptLiteralSearchFields.map((field) => ({ [field]: getFuseIncludePattern(token) })),
    })),
  };
}

function getFuseIncludePattern(token: string): string {
  return `'${token.replace(/\|/g, '\\|')}`;
}

function getDisplayMatchCandidate(
  text: string,
  query: string,
  fuseIndices: readonly MatchRange[],
): { indices: MatchRange[]; source: DisplayMatchSource } {
  const trimmedQuery = query.trim();
  const phraseIndices = findLiteralRanges(text, trimmedQuery);

  if (phraseIndices.length) {
    return { indices: phraseIndices, source: 'phrase' };
  }

  const tokenIndices = getDisplayTokens(trimmedQuery).flatMap((token) => findLiteralRanges(text, token));

  if (tokenIndices.length) {
    return { indices: mergeRanges(tokenIndices, text.length), source: 'token' };
  }

  const fallbackIndices = mergeRanges(fuseIndices, text.length);

  if (fallbackIndices.length) {
    return { indices: fallbackIndices, source: 'fuse' };
  }

  return { indices: [], source: 'none' };
}

type PromptMatchDisplayCandidate = {
  hasPromptMatch: boolean;
  optionId?: string;
  text: string;
  fuseIndices: readonly MatchRange[];
  indices: MatchRange[];
  source: DisplayMatchSource;
};

function getPromptMatchDisplayCandidate(result: PromptSearchResult, query: string): PromptMatchDisplayCandidate {
  const candidates = result.matches
    .filter((match) => match.key === 'prompt')
    .map((match) => {
      const variant = getRenderedPromptSearchVariantForMatch(result.prompt, match);
      const text = typeof match.value === 'string' ? match.value : (variant?.text ?? renderPromptText(result.prompt));
      const fuseIndices = match.indices ?? [];

      return {
        hasPromptMatch: true,
        optionId: variant?.optionId,
        text,
        fuseIndices,
        ...getDisplayMatchCandidate(text, query, fuseIndices),
      };
    });

  for (const source of ['phrase', 'token', 'fuse'] as const) {
    const candidate = candidates.find((item) => item.source === source && item.indices.length);
    if (candidate) return candidate;
  }

  const firstCandidate = candidates[0];
  if (firstCandidate) return firstCandidate;

  return {
    hasPromptMatch: false,
    text: renderPromptText(result.prompt),
    fuseIndices: [],
    indices: [],
    source: 'none',
  };
}

function getRenderedPromptSearchVariantForMatch(
  prompt: PromptEntry,
  match: FuseResultMatch,
): RenderedPromptSearchVariant | undefined {
  const variants = getRenderedPromptSearchVariants(prompt);

  if (typeof match.refIndex === 'number') {
    return variants[match.refIndex];
  }

  if (typeof match.value === 'string') {
    return variants.find((variant) => variant.text === match.value);
  }

  return undefined;
}

function findLiteralRanges(text: string, literal: string): MatchRange[] {
  if (!literal) return [];

  const normalizedText = text.toLowerCase();
  const normalizedLiteral = literal.toLowerCase();
  const ranges: MatchRange[] = [];
  let cursor = 0;

  while (cursor < normalizedText.length) {
    const start = normalizedText.indexOf(normalizedLiteral, cursor);
    if (start === -1) break;

    ranges.push([start, start + literal.length - 1]);
    cursor = start + 1;
  }

  return ranges;
}

function getDisplayTokens(query: string): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const token of query.split(/\s+/)) {
    if (token.length < 2) continue;

    const normalizedToken = token.toLowerCase();
    if (seen.has(normalizedToken)) continue;

    seen.add(normalizedToken);
    tokens.push(token);
  }

  return tokens;
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
