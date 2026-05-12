import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { CopyButton } from '../../../components/CopyButton';
import { Tag } from '../../../components/Tag';
import type { ToolCallStatus } from './types';

export type ToolCallProps = {
  tool: string;
  input: string;
  output: string;
  timestamp?: string;
  status?: ToolCallStatus;
};

export function ToolCall({ tool, input, output, timestamp, status = 'success' }: ToolCallProps) {
  const [expanded, setExpanded] = useState(true);

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
    <div className="border border-[var(--border)] border-l-2 border-l-[var(--category-violet)] bg-[var(--surface)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[color:var(--border)] bg-[var(--surface-muted)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse tool call details' : 'Expand tool call details'}
            aria-expanded={expanded}
            className="text-[var(--text-subtle)] hover:text-[var(--text-muted)] active:text-[var(--text)] cursor-pointer p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
          <span className="text-xs font-semibold text-[var(--text)]">Tool Call</span>
          <Tag variant="muted" className="font-mono">
            {tool}
          </Tag>
          {timestamp && <span className="text-[10px] text-[var(--text-subtle)] tabular-nums">{timestamp}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 border ${config.color}`}>{config.label}</span>
          <CopyButton
            text={`Tool: ${tool}\nInput: ${input}\nOutput: ${output}`}
            className="border-0 bg-transparent hover:bg-[var(--surface-strong)] px-1.5"
          />
        </div>
      </div>

      {expanded && (
        <div className="divide-y divide-[color:var(--border)]">
          {/* Input */}
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--category-violet)] mb-1">
              Input
            </div>
            <pre className="font-mono text-sm text-[var(--text)] whitespace-pre-wrap break-words bg-[var(--surface-muted)] border border-[var(--border)] px-2 py-1.5">
              {input}
            </pre>
          </div>

          {/* Output */}
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-subtle)] mb-1">Output</div>
            <pre className="font-mono text-sm text-[var(--text)] whitespace-pre-wrap break-words bg-[var(--surface-muted)] border border-[var(--border)] px-2 py-1.5 max-h-48 overflow-y-auto">
              {output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
