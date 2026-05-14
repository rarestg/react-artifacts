import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useId, useState } from 'react';
import { CopyButton } from '../../../components/CopyButton';
import { mergeClassNames } from '../../../lib/classNames';
import { TimestampBadge } from './TimestampBadge';
import type { ToolCallKind, ToolCallStatus } from './types';

export type ToolCallProps = {
  tool: string;
  toolKind?: ToolCallKind;
  summary?: string;
  input: string;
  output: string;
  timestamp?: string;
  status?: ToolCallStatus;
  defaultExpanded?: boolean;
};

type ToolCallToneStyle = CSSProperties & {
  '--tool-call-color': string;
};

function getCommandPreview(input: string, fallback: string) {
  return (
    input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? fallback
  );
}

const toolCallKindConfig: Record<ToolCallKind, { label: string; color: string }> = {
  standard: {
    label: 'Tool Call',
    color: 'var(--category-violet)',
  },
  subagent_spawn: {
    label: 'Spawn Agent',
    color: 'var(--category-cyan)',
  },
  subagent_wait: {
    label: 'Wait Agent',
    color: 'var(--category-cyan)',
  },
  subagent_send_input: {
    label: 'Send Input',
    color: 'var(--category-cyan)',
  },
  subagent_resume: {
    label: 'Resume Agent',
    color: 'var(--category-cyan)',
  },
  subagent_close: {
    label: 'Close Agent',
    color: 'var(--category-cyan)',
  },
};

export function ToolCall({
  tool,
  toolKind = 'standard',
  summary,
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
  const kindConfig = toolCallKindConfig[toolKind] || toolCallKindConfig.standard;
  const toneStyle: ToolCallToneStyle = {
    '--tool-call-color': kindConfig.color,
  };
  const commandPreview = summary ?? getCommandPreview(input, tool);
  const commandTitle = (summary ?? input.trim()) || tool;

  return (
    <div style={toneStyle} className="border-l-2 border-l-[color:var(--tool-call-color)] bg-[var(--surface)]">
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
          <span className="shrink-0 text-xs font-semibold uppercase text-[color:var(--tool-call-color)]">
            {kindConfig.label}
          </span>
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
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--tool-call-color)]">
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
