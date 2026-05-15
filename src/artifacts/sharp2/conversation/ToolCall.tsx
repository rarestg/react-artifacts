import { useId, useState } from 'react';
import { CopyButton } from '../../../components/CopyButton';
import { AgentIdentityTags, EventDescriptor, EventPreviewPill, ToolStatusBadge } from './EventRowParts';
import { TimestampBadge } from './TimestampBadge';
import { ExpandableTranscriptRow, TranscriptRowActionCluster, TranscriptRowDisclosureButton } from './TranscriptRow';
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
  const isSubagent = toolKind !== 'standard';
  const agentLabel = agentNickname?.trim() || agentId?.trim();
  const commandPreview =
    isSubagent && agentLabel ? `${tool} > ${agentLabel}` : (summary ?? getCommandPreview(input, tool));
  const commandTitle = (summary ?? input.trim()) || tool;
  const actionLabel = kindConfig.action || tool;
  const hasAgentIdentity = Boolean(agentNickname?.trim() || agentId?.trim());
  const disclosureLabel = isExpanded ? `Collapse ${tool} tool details` : `Expand ${tool} tool details`;

  return (
    <ExpandableTranscriptRow
      accentColor={kindConfig.color}
      expanded={isExpanded}
      controlsId={detailsId}
      summaryAriaLabel={disclosureLabel}
      onToggle={() => setIsExpanded((expanded) => !expanded)}
      left={
        isSubagent ? (
          <EventDescriptor
            category={kindConfig.category}
            colorClassName="text-[color:var(--transcript-row-accent)]"
            sections={[{ value: actionLabel, width: isSubagent ? 'subagentAction' : undefined }]}
          />
        ) : (
          <>
            <EventDescriptor
              category={kindConfig.category}
              colorClassName="text-[color:var(--transcript-row-accent)]"
              sections={[{ value: actionLabel }]}
            />
            <EventPreviewPill title={commandTitle}>{commandPreview}</EventPreviewPill>
          </>
        )
      }
      leftControls={
        isSubagent ? (
          <AgentIdentityTags agentId={agentId} agentNickname={agentNickname} agentRole={agentRole} mode="copy" />
        ) : undefined
      }
      leftTrailing={isSubagent ? <EventPreviewPill title={commandTitle}>{commandPreview}</EventPreviewPill> : undefined}
      right={
        <TranscriptRowActionCluster
          leading={<ToolStatusBadge status={status} />}
          timestamp={<TimestampBadge timestamp={timestamp} />}
          action={
            <TranscriptRowDisclosureButton
              expanded={isExpanded}
              controlsId={detailsId}
              ariaLabel={disclosureLabel}
              onToggle={() => setIsExpanded((expanded) => !expanded)}
            />
          }
        />
      }
    >
      {isSubagent && hasAgentIdentity && (
        <div className="flex min-w-0 items-center gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--transcript-row-accent)]">
            Agent
          </div>
          <AgentIdentityTags agentId={agentId} agentNickname={agentNickname} agentRole={agentRole} mode="copy" />
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--transcript-row-accent)]">
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
    </ExpandableTranscriptRow>
  );
}
