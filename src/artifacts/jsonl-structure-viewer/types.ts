export type FormatKind = 'array' | 'object' | 'jsonl' | 'empty' | 'invalid' | 'unsupported';

export type OutputFormat = 'pretty' | 'compact';

export type LayoutMode = 'one-column' | 'two-column' | 'three-column';

export type PathSegment =
  | {
      kind: 'key';
      key: string;
    }
  | {
      kind: 'array';
      key?: string;
    };

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
  key: string;
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
