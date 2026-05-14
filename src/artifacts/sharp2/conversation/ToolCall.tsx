import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useId, useState } from 'react';
import { CopyButton } from '../../../components/CopyButton';
import { mergeClassNames } from '../../../lib/classNames';
import { AgentTag, EventLabel, EventPreviewPill, ToolStatusBadge } from './EventRowParts';
import { TimestampBadge } from './TimestampBadge';
import type { ToolCallKind, ToolCallStatus } from './types';

export type ToolCallProps = {
  tool: string;
  toolKind?: ToolCallKind;
  agentId?: string;
  agentNickname?: string;
  agentRole?: string;
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

const toolCallKindConfig: Record<ToolCallKind, { category: string; action: string; color: string }> = {
  standard: {
    category: 'TOOL',
    action: '',
    color: 'var(--category-violet)',
  },
  subagent_spawn: {
    category: 'SUBAGENT',
    action: 'Spawn',
    color: 'var(--category-cyan)',
  },
  subagent_wait: {
    category: 'SUBAGENT',
    action: 'Wait',
    color: 'var(--category-cyan)',
  },
  subagent_send_input: {
    category: 'SUBAGENT',
    action: 'Input',
    color: 'var(--category-cyan)',
  },
  subagent_resume: {
    category: 'SUBAGENT',
    action: 'Resume',
    color: 'var(--category-cyan)',
  },
  subagent_close: {
    category: 'SUBAGENT',
    action: 'Close',
    color: 'var(--category-cyan)',
  },
};

export function ToolCall({
  tool,
  toolKind = 'standard',
  agentId,
  agentNickname,
  agentRole,
  summary,
  input,
  output,
  timestamp,
  status = 'success',
  defaultExpanded = false,
}: ToolCallProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const detailsId = useId();
  const kindConfig = toolCallKindConfig[toolKind] || toolCallKindConfig.standard;
  const toneStyle: ToolCallToneStyle = {
    '--tool-call-color': kindConfig.color,
  };
  const isSubagent = toolKind !== 'standard';
  const agentLabel = agentNickname?.trim() || agentId?.trim();
  const commandPreview =
    isSubagent && agentLabel ? `${tool} > ${agentLabel}` : (summary ?? getCommandPreview(input, tool));
  const commandTitle = (summary ?? input.trim()) || tool;
  const actionLabel = kindConfig.action || tool;

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
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <EventLabel
            category={kindConfig.category}
            action={actionLabel}
            colorClassName="text-[color:var(--tool-call-color)]"
          />
          {isSubagent && <AgentTag agentId={agentId} agentNickname={agentNickname} agentRole={agentRole} />}
          <EventPreviewPill title={commandTitle}>{commandPreview}</EventPreviewPill>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ToolStatusBadge status={status} />
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
