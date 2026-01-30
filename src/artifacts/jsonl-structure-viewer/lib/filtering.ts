import type { TruncateResult } from '../types';

export function applyFilter(value: unknown, segments: string[], includedPaths: Record<string, boolean>): unknown {
  const isIncluded = (path: string) => includedPaths[path] !== false;

  if (Array.isArray(value)) {
    const path = segments.length === 0 ? '[]' : segments.join('->');
    const nextSegments = segments.length === 0 ? ['[]'] : segments;
    if (path && !isIncluded(path)) {
      return [];
    }
    return value.map((item) => {
      if (Array.isArray(item)) {
        return applyFilter(item, [...nextSegments, '[]'], includedPaths);
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
        const arraySegment = `${key}[]`;
        if (!isIncluded([...segments, arraySegment].join('->'))) {
          return;
        }
        next[key] = applyFilter(entry, [...segments, arraySegment], includedPaths);
        return;
      }

      const path = [...segments, key].join('->');
      if (!isIncluded(path)) {
        return;
      }
      if (entry && typeof entry === 'object') {
        next[key] = applyFilter(entry, [...segments, key], includedPaths);
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
  if (typeof value === 'string') {
    if (value.length <= limit) return { value, truncated: 0 };
    return { value: `${value.slice(0, limit)}...`, truncated: 1 };
  }
  if (Array.isArray(value)) {
    let truncated = 0;
    const next = value.map((item) => {
      const result = truncateValue(item, limit);
      truncated += result.truncated;
      return result.value;
    });
    return { value: next, truncated };
  }
  if (value && typeof value === 'object') {
    let truncated = 0;
    const next: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      const result = truncateValue(entry, limit);
      truncated += result.truncated;
      next[key] = result.value;
    });
    return { value: next, truncated };
  }
  return { value, truncated: 0 };
}
