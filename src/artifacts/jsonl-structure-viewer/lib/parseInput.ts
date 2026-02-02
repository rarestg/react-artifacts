import type { FormatKind, JsonlError, ParseResult } from '../types';

function createJsonlError(line: number, message: string, preview: string): JsonlError {
  return {
    line,
    message,
    preview: preview.length > 120 ? `${preview.slice(0, 120)}...` : preview,
  };
}

export function parseInput(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { format: 'empty', data: null, error: '', errors: [] };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return { format: 'array', data: parsed, error: '', errors: [] };
    }
    if (parsed && typeof parsed === 'object') {
      return { format: 'object', data: parsed, error: '', errors: [] };
    }
    return {
      format: 'unsupported',
      data: null,
      error: 'JSON value must be an object or array.',
      errors: [],
    };
  } catch {
    const rawLines = trimmed.split('\n');
    const lines = rawLines
      .map((line, index) => ({ line: index + 1, value: line.trim() }))
      .filter((entry) => entry.value.length > 0);

    if (lines.length < 2) {
      return { format: 'invalid', data: null, error: 'Invalid JSON or JSONL.', errors: [] };
    }

    const parsedLines: unknown[] = [];
    const errors: JsonlError[] = [];

    lines.forEach((entry) => {
      try {
        parsedLines.push(JSON.parse(entry.value));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid JSON';
        errors.push(createJsonlError(entry.line, message, entry.value));
      }
    });

    if (parsedLines.length === 0) {
      return {
        format: 'invalid',
        data: null,
        error: 'Invalid JSONL. Each line must be valid JSON.',
        errors,
      };
    }

    return {
      format: 'jsonl',
      data: parsedLines,
      error: errors.length ? 'Some JSONL lines failed to parse.' : '',
      errors,
    };
  }
}

export function formatBadge(format: FormatKind) {
  switch (format) {
    case 'array':
      return 'JSON Array';
    case 'object':
      return 'Single Object';
    case 'jsonl':
      return 'JSONL';
    case 'empty':
      return 'Empty';
    case 'invalid':
      return 'Invalid';
    case 'unsupported':
      return 'Unsupported';
    default:
      return 'Unknown';
  }
}
