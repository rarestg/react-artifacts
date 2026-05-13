import { CopyButton } from '../../../components/CopyButton';
import { Tag } from '../../../components/Tag';
import type { ToolCallStatus } from './types';

export type ToolCallProps = {
  tool: string;
  input: string;
  output: string;
  timestamp?: string;
  status?: ToolCallStatus;
  showDetails?: boolean;
};

export function ToolCall({ tool, input, output, timestamp, status = 'success', showDetails = true }: ToolCallProps) {
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
    <div className="border-l-2 border-l-[var(--category-violet)] bg-[var(--surface)] p-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
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
            ariaLabel="Copy tool input and output"
            className="border-0 bg-transparent hover:bg-[var(--surface-strong)] px-1.5"
          />
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 space-y-2">
          {/* Input */}
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

          {/* Output */}
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
