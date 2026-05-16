import { useId, useState } from 'react';
import { CopyButton } from '../../../components/CopyButton';
import { AgentIdentityTags, EventDescriptor, EventPreviewPill, ToolStatusBadge } from './EventRowParts';
import { TimestampBadge } from './TimestampBadge';
import { ExpandableTranscriptRow } from './TranscriptRow';
import type { ToolCallKind, ToolCallStatus } from './types';

export type ToolCallProps = {
  tool: string;
  toolKind?: ToolCallKind;
  agentId?: string;
  agentNickname?: string;
  agentRole?: string;
  preview?: string;
  summary?: string;
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

const subagentPreviewFallbacks: Partial<Record<ToolCallKind, string>> = {
  subagent_spawn: 'Spawn request',
  subagent_wait: 'Wait request',
  subagent_send_input: 'Follow-up submitted',
  subagent_resume: 'Resume requested',
  subagent_close: 'Close requested',
};

function getSubagentPreview(preview: string | undefined, toolKind: ToolCallKind) {
  const trimmedPreview = preview?.trim();
  if (trimmedPreview) return trimmedPreview;

  return subagentPreviewFallbacks[toolKind] ?? 'Subagent event';
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
  preview,
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
  const isSubagent = toolKind !== 'standard';
  const commandPreview = isSubagent
    ? getSubagentPreview(preview, toolKind)
    : (summary ?? getCommandPreview(input, tool));
  const commandTitle = (isSubagent && preview?.trim() ? preview.trim() : (summary ?? input.trim())) || tool;
  const actionLabel = kindConfig.action || tool;
  const disclosureLabel = isExpanded ? `Collapse ${tool} tool details` : `Expand ${tool} tool details`;

  return (
    <ExpandableTranscriptRow
      accentColor={kindConfig.color}
      expanded={isExpanded}
      controlsId={detailsId}
      summaryAriaLabel={disclosureLabel}
      summaryTitle={commandTitle}
      onToggle={() => setIsExpanded((expanded) => !expanded)}
      left={
        isSubagent ? (
          <EventDescriptor
            category={kindConfig.category}
            colorClassName="text-[color:var(--transcript-row-accent)]"
            sections={[{ value: actionLabel, width: 'action' }]}
          />
        ) : (
          <>
            <EventDescriptor
              category={kindConfig.category}
              colorClassName="text-[color:var(--transcript-row-accent)]"
              sections={[{ value: actionLabel, width: 'action' }]}
            />
            <EventPreviewPill title={commandTitle} className="flex-1">
              {commandPreview}
            </EventPreviewPill>
          </>
        )
      }
      leftControls={
        isSubagent ? (
          <AgentIdentityTags agentId={agentId} agentNickname={agentNickname} agentRole={agentRole} mode="copy" />
        ) : undefined
      }
      leftTrailing={
        isSubagent ? (
          <EventPreviewPill title={commandTitle} className="flex-1">
            {commandPreview}
          </EventPreviewPill>
        ) : undefined
      }
      rightLeading={<ToolStatusBadge status={status} />}
      rightTimestamp={<TimestampBadge timestamp={timestamp} />}
    >
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--transcript-row-accent)]">
            Input
          </div>
          <CopyButton text={input} idleLabel="" ariaLabel="Copy tool input" variant="icon" />
        </div>
        <pre className="font-mono text-sm text-[var(--text)] whitespace-pre-wrap break-words bg-[var(--surface-muted)] border border-[var(--border)] px-2 py-1.5">
          {input}
        </pre>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Output</div>
          <CopyButton text={output} idleLabel="" ariaLabel="Copy tool output" variant="icon" />
        </div>
        <pre className="font-mono text-sm text-[var(--text)] whitespace-pre-wrap break-words bg-[var(--surface-muted)] border border-[var(--border)] px-2 py-1.5 max-h-48 overflow-y-auto">
          {output}
        </pre>
      </div>
    </ExpandableTranscriptRow>
  );
}
