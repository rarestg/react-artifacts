import type { PathSegment, TruncateResult } from '../types';
import { encodePath } from './pathTree';

const normalizeTruncateLimit = (limit: number) => {
  if (!Number.isFinite(limit)) return 0;
  return Math.max(0, Math.floor(limit));
};

export function countTruncatedStrings(value: unknown, limit: number): number {
  const safeLimit = normalizeTruncateLimit(limit);

  const walk = (node: unknown): number => {
    if (typeof node === 'string') {
      return node.length > safeLimit ? 1 : 0;
    }
    if (Array.isArray(node)) {
      return node.reduce((sum, item) => sum + walk(item), 0);
    }
    if (node && typeof node === 'object') {
      return Object.values(node as Record<string, unknown>).reduce<number>((sum, item) => sum + walk(item), 0);
    }
    return 0;
  };

  return walk(value);
}

export function applyFilter(value: unknown, segments: PathSegment[], includedPaths: Record<string, boolean>): unknown {
  const isIncluded = (pathSegments: PathSegment[]) => includedPaths[encodePath(pathSegments)] !== false;

  if (Array.isArray(value)) {
    const rootArraySegment: PathSegment = { kind: 'array' };
    const nextSegments = segments.length === 0 ? [rootArraySegment] : segments;
    if (!isIncluded(nextSegments)) {
      return [];
    }
    return value.map((item) => {
      if (Array.isArray(item)) {
        return applyFilter(item, [...nextSegments, { kind: 'array' } as PathSegment], includedPaths);
      }
      if (item && typeof item === 'object') {
        return applyFilter(item, nextSegments, includedPaths);
      }
      return item;
    });
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, entry]) => {
      if (Array.isArray(entry)) {
        const arraySegment: PathSegment = { kind: 'array', key };
        const arraySegments = [...segments, arraySegment];
        if (!isIncluded(arraySegments)) {
          return;
        }
        next[key] = applyFilter(entry, arraySegments, includedPaths);
        return;
      }

      const keySegment: PathSegment = { kind: 'key', key };
      const keySegments = [...segments, keySegment];
      if (!isIncluded(keySegments)) {
        return;
      }
      if (entry && typeof entry === 'object') {
        next[key] = applyFilter(entry, keySegments, includedPaths);
      } else {
        next[key] = entry;
      }
    });
    return next;
  }

  return value;
}

export function applyStructureOnly(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => applyStructureOnly(item));
  }

  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      next[key] = applyStructureOnly(entry);
    });
    return next;
  }

  if (value === null) return '<null>';
  if (typeof value === 'string') return '<string>';
  if (typeof value === 'number') return '<number>';
  if (typeof value === 'boolean') return '<boolean>';
  return '<value>';
}

export function truncateValue(value: unknown, limit: number): TruncateResult {
  const safeLimit = normalizeTruncateLimit(limit);
  if (typeof value === 'string') {
    if (value.length <= safeLimit) return { value, truncated: 0 };
    return { value: `${value.slice(0, safeLimit)}...`, truncated: 1 };
  }
  if (Array.isArray(value)) {
    let truncated = 0;
    const next = value.map((item) => {
      const result = truncateValue(item, safeLimit);
      truncated += result.truncated;
      return result.value;
    });
    return { value: next, truncated };
  }
  if (value && typeof value === 'object') {
    let truncated = 0;
    const next: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      const result = truncateValue(entry, safeLimit);
      truncated += result.truncated;
      next[key] = result.value;
    });
    return { value: next, truncated };
  }
  return { value, truncated: 0 };
}
