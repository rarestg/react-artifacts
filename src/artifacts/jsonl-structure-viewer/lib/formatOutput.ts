import type { FormatKind, OutputFormat } from '../types';

export function formatOutput(value: unknown, format: FormatKind, outputFormat: OutputFormat) {
  if (format === 'jsonl') {
    if (!Array.isArray(value)) return '';
    const spacing = outputFormat === 'pretty' ? 2 : 0;
    return value.map((item) => JSON.stringify(item, null, spacing)).join('\n');
  }

  if (outputFormat === 'compact') {
    return JSON.stringify(value);
  }

  return JSON.stringify(value, null, 2);
}

export function getItemCount(value: unknown, format: FormatKind) {
  if (!value) return 0;
  if (format === 'array' || format === 'jsonl') {
    return Array.isArray(value) ? value.length : 0;
  }
  if (format === 'object') return 1;
  return 0;
}

export function getOutputStats(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { characters: 0, lines: 0 };
  }
  return {
    characters: text.length,
    lines: text.split('\n').length,
  };
}
