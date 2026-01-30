export type FormatKind = 'array' | 'object' | 'jsonl' | 'empty' | 'invalid' | 'unsupported';

export type OutputFormat = 'pretty' | 'compact';

export type LayoutMode = 'two-column' | 'three-column';

export type JsonlError = {
  line: number;
  message: string;
  preview: string;
};

export type ParseResult = {
  format: FormatKind;
  data: unknown;
  error: string;
  errors: JsonlError[];
};

export type PathNode = {
  id: string;
  label: string;
  path: string;
  isArray: boolean;
  depth: number;
  children: PathNode[];
  subtreeCount: number;
};

export type TruncateResult = {
  value: unknown;
  truncated: number;
};
