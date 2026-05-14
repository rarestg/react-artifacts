import { ChevronDown, ChevronRight } from 'lucide-react';
import { useId, useState } from 'react';
import { CopyButton } from '../../../components/CopyButton';
import { mergeClassNames } from '../../../lib/classNames';
import { TimestampBadge } from './TimestampBadge';
import type { ToolCallStatus } from './types';

export type ToolCallProps = {
  tool: string;
  input: string;
  output: string;
  timestamp?: string;
  status?: ToolCallStatus;
  defaultExpanded?: boolean;
};

function getCommandPreview(input: string, fallback: string) {
  return (
    input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? fallback
  );
}

export function ToolCall({
  tool,
  input,
  output,
  timestamp,
  status = 'success',
  defaultExpanded = false,
}: ToolCallProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const detailsId = useId();
  const statusConfig: Record<ToolCallStatus, { label: string; color: string }> = {
    success: {
      label: 'Success',
      color: 'text-[var(--success-text)] bg-[var(--success-weak)] border-[color:var(--success)]',
    },
    error: {
      label: 'Error',
      color: 'text-[var(--danger-text)] bg-[var(--danger-weak)] border-[color:var(--danger)]',
    },
    pending: {
      label: 'Running',
      color: 'text-[var(--warning-text)] bg-[var(--warning-weak)] border-[color:var(--warning)]',
    },
  };

  const config = statusConfig[status] || statusConfig.success;
  const commandPreview = getCommandPreview(input, tool);
  const commandTitle = input.trim() || tool;

  return (
    <div className="border-l-2 border-l-[var(--category-violet)] bg-[var(--surface)]">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        aria-label={isExpanded ? `Collapse ${tool} tool details` : `Expand ${tool} tool details`}
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className={mergeClassNames(
          'flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors',
          'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] motion-reduce:transition-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          'focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-xs font-semibold uppercase text-[var(--category-violet)]">Tool Call</span>
          <span className="min-w-0 truncate font-mono text-xs font-semibold text-[var(--text)]" title={commandTitle}>
            {commandPreview}
          </span>
          <span className={`shrink-0 border px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <TimestampBadge timestamp={timestamp} interactive={false} />
          {isExpanded ? (
            <ChevronDown className="size-4 text-[var(--text-subtle)]" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4 text-[var(--text-subtle)]" aria-hidden="true" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div id={detailsId} className="space-y-3 px-4 pb-3">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--category-violet)]">
                Input
              </div>
              <CopyButton
                text={input}
                idleLabel="Copy"
                ariaLabel="Copy tool input"
                className="border-0 bg-transparent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-[var(--surface-strong)]"
              />
            </div>
            <pre className="font-mono text-sm text-[var(--text)] whitespace-pre-wrap break-words bg-[var(--surface-muted)] border border-[var(--border)] px-2 py-1.5">
              {input}
            </pre>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Output</div>
              <CopyButton
                text={output}
                idleLabel="Copy"
                ariaLabel="Copy tool output"
                className="border-0 bg-transparent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-[var(--surface-strong)]"
              />
            </div>
            <pre className="font-mono text-sm text-[var(--text)] whitespace-pre-wrap break-words bg-[var(--surface-muted)] border border-[var(--border)] px-2 py-1.5 max-h-48 overflow-y-auto">
              {output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
