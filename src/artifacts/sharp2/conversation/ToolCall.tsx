import { ChevronDown, ChevronRight } from 'lucide-react';
import { useId, useState } from 'react';
import { CopyButton } from '../../../components/CopyButton';
import { Tag } from '../../../components/Tag';
import { mergeClassNames } from '../../../lib/classNames';
import type { ToolCallStatus } from './types';

export type ToolCallProps = {
  tool: string;
  input: string;
  output: string;
  timestamp?: string;
  status?: ToolCallStatus;
  defaultExpanded?: boolean;
};

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

  return (
    <div className="border-l-2 border-l-[var(--category-violet)] bg-[var(--surface)]">
      <div className="flex items-stretch">
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={detailsId}
          aria-label={isExpanded ? `Collapse ${tool} tool details` : `Expand ${tool} tool details`}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className={mergeClassNames(
            'flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 px-3 py-3 text-left transition-colors',
            'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] motion-reduce:transition-none',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
            'focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
          )}
        >
          <div className="flex min-w-0 items-center gap-2 px-1">
            <span className="text-xs font-semibold uppercase text-[var(--category-violet)]">Tool Call</span>
            <Tag variant="muted" className="font-mono">
              {tool}
            </Tag>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 border ${config.color}`}>{config.label}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 px-1">
            {timestamp && <span className="text-[10px] text-[var(--text-subtle)] tabular-nums">{timestamp}</span>}
            {isExpanded ? (
              <ChevronDown className="size-4 text-[var(--text-subtle)]" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-4 text-[var(--text-subtle)]" aria-hidden="true" />
            )}
          </div>
        </button>
        <div className="flex items-center pr-3">
          <CopyButton
            text={`Tool: ${tool}\nInput: ${input}\nOutput: ${output}`}
            idleLabel=""
            ariaLabel="Copy tool input and output"
            variant="icon"
          />
        </div>
      </div>

      {isExpanded && (
        <div id={detailsId} className="space-y-2 px-3 pb-3">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--category-violet)]">Input</div>
              <CopyButton
                text={input}
                idleLabel="Copy input"
                reserveLabel="Copy output"
                ariaLabel="Copy tool input"
                className="border-0 bg-transparent px-1.5 py-0.5 hover:bg-[var(--surface-strong)]"
              />
            </div>
            <pre className="font-mono text-sm text-[var(--text)] whitespace-pre-wrap break-words bg-[var(--surface-muted)] border border-[var(--border)] px-2 py-1.5">
              {input}
            </pre>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-subtle)]">Output</div>
              <CopyButton
                text={output}
                idleLabel="Copy output"
                reserveLabel="Copy output"
                ariaLabel="Copy tool output"
                className="border-0 bg-transparent px-1.5 py-0.5 hover:bg-[var(--surface-strong)]"
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
