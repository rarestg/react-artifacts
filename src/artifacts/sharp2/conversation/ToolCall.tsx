import { type ReactNode, useId, useState } from 'react';
import { CopyButton } from '../../../components/CopyButton';
import { AgentIdentityTags, EventDescriptor, EventPreviewPill, ToolStatusBadge } from './EventRowParts';
import { TimestampBadge } from './TimestampBadge';
import { ExpandableTranscriptRow, TranscriptRow, TranscriptRowActionCluster } from './TranscriptRow';
import {
  isKnownToolCallKind,
  isSubagentToolKind,
  type ToolCallKind,
  type ToolCallStatus,
  type ToolDetailStatus,
} from './types';

export type ToolCallProps = {
  tool: string;
  toolKind?: ToolCallKind;
  agentId?: string;
  agentNickname?: string;
  agentRole?: string;
  preview?: string;
  summary?: string;
  input?: string;
  output?: string;
  detailsAvailable?: boolean;
  detailsStatus?: ToolDetailStatus;
  timestamp?: string;
  status?: ToolCallStatus;
  defaultExpanded?: boolean;
};

function getCommandPreview(input: string | undefined, fallback: string) {
  return (
    input
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? fallback
  );
}

function hasDetailText(value: string | undefined): value is string {
  return value !== undefined && value.length > 0;
}

function getMissingDetailMessage(
  label: 'Input' | 'Output',
  detailsStatus: ToolDetailStatus | undefined,
  detailsAvailable: boolean | undefined,
) {
  if (detailsStatus === 'loading') return `${label} loading`;
  if (detailsStatus === 'pending') return `${label} pending`;
  if (detailsStatus === 'available_on_demand' || detailsAvailable === true) return `${label} available on demand`;
  if (detailsStatus === 'unavailable' || detailsAvailable === false) return `${label} unavailable`;
  return undefined;
}

const detailLabelClasses = 'text-[10px] font-semibold uppercase tracking-wider';
const detailPreClasses =
  'font-mono text-sm text-[var(--text)] whitespace-pre-wrap break-words bg-[var(--surface-muted)] border border-[var(--border)] px-2 py-1.5';
const detailStateClasses =
  'border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1.5 text-sm text-[var(--text-muted)]';

function ToolDetailTextBlock({
  label,
  text,
  copyAriaLabel,
  labelClassName,
  maxHeightClassName,
}: {
  label: 'Input' | 'Output';
  text: string;
  copyAriaLabel: string;
  labelClassName: string;
  maxHeightClassName?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className={`${detailLabelClasses} ${labelClassName}`}>{label}</div>
        <CopyButton text={text} idleLabel="" ariaLabel={copyAriaLabel} variant="icon" />
      </div>
      <pre className={`${detailPreClasses} ${maxHeightClassName ?? ''}`}>{text}</pre>
    </div>
  );
}

function ToolDetailStateBlock({
  label,
  message,
  labelClassName,
}: {
  label: 'Input' | 'Output';
  message: string;
  labelClassName: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className={`${detailLabelClasses} ${labelClassName}`}>{label}</div>
      </div>
      <div className={detailStateClasses}>{message}</div>
    </div>
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

function EmptyDisclosureActionSlot() {
  return <span aria-hidden="true" className="inline-flex size-6 shrink-0" />;
}

function getToolCallSummarySlots({
  isSubagent,
  category,
  actionLabel,
  commandTitle,
  commandPreview,
  agentId,
  agentNickname,
  agentRole,
}: {
  isSubagent: boolean;
  category: string;
  actionLabel: string;
  commandTitle: string;
  commandPreview: string;
  agentId?: string;
  agentNickname?: string;
  agentRole?: string;
}): {
  expandableLeft: ReactNode;
  expandableLeftControls?: ReactNode;
  expandableLeftTrailing?: ReactNode;
  staticLeft: ReactNode;
} {
  const descriptor = (
    <EventDescriptor
      category={category}
      colorClassName="text-[color:var(--transcript-row-accent)]"
      sections={[{ value: actionLabel, width: 'action' }]}
    />
  );
  const previewPill = (
    <EventPreviewPill title={commandTitle} className="flex-1">
      {commandPreview}
    </EventPreviewPill>
  );

  if (!isSubagent) {
    return {
      expandableLeft: (
        <>
          {descriptor}
          {previewPill}
        </>
      ),
      staticLeft: (
        <>
          {descriptor}
          {previewPill}
        </>
      ),
    };
  }

  const hasAgentIdentity = Boolean(agentId?.trim() || agentNickname?.trim());
  const agentTags = hasAgentIdentity ? (
    <AgentIdentityTags agentId={agentId} agentNickname={agentNickname} agentRole={agentRole} mode="copy" />
  ) : undefined;

  return {
    expandableLeft: descriptor,
    expandableLeftControls: agentTags,
    expandableLeftTrailing: previewPill,
    staticLeft: (
      <>
        {descriptor}
        {agentTags}
        {previewPill}
      </>
    ),
  };
}

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
  detailsAvailable,
  detailsStatus,
  timestamp,
  status = 'success',
  defaultExpanded = false,
}: ToolCallProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const detailsId = useId();
  const normalizedToolKind = isKnownToolCallKind(toolKind) ? toolKind : 'standard';
  const kindConfig = toolCallKindConfig[normalizedToolKind];
  const isSubagent = isSubagentToolKind(toolKind);
  const commandPreview = isSubagent
    ? getSubagentPreview(preview, normalizedToolKind)
    : (summary ?? getCommandPreview(input, tool));
  const commandTitle = (isSubagent && preview?.trim() ? preview.trim() : summary?.trim() || input?.trim()) || tool;
  const actionLabel = kindConfig.action || tool;
  const disclosureLabel = isExpanded ? `Collapse ${tool} tool details` : `Expand ${tool} tool details`;
  const inputStateMessage = hasDetailText(input)
    ? undefined
    : getMissingDetailMessage('Input', detailsStatus, detailsAvailable);
  const outputStateMessage = hasDetailText(output)
    ? undefined
    : getMissingDetailMessage('Output', detailsStatus, detailsAvailable);
  const hasVisibleDetails =
    hasDetailText(input) ||
    inputStateMessage !== undefined ||
    hasDetailText(output) ||
    outputStateMessage !== undefined;
  const summarySlots = getToolCallSummarySlots({
    isSubagent,
    category: kindConfig.category,
    actionLabel,
    commandTitle,
    commandPreview,
    agentId,
    agentNickname,
    agentRole,
  });
  const rightLeading = <ToolStatusBadge status={status} />;
  const rightTimestamp = <TimestampBadge timestamp={timestamp} />;

  if (!hasVisibleDetails) {
    return (
      <TranscriptRow
        accentColor={kindConfig.color}
        left={summarySlots.staticLeft}
        right={
          <TranscriptRowActionCluster
            leading={rightLeading}
            timestamp={rightTimestamp}
            action={<EmptyDisclosureActionSlot />}
          />
        }
      />
    );
  }

  return (
    <ExpandableTranscriptRow
      accentColor={kindConfig.color}
      expanded={isExpanded}
      controlsId={detailsId}
      summaryAriaLabel={disclosureLabel}
      summaryTitle={commandTitle}
      onToggle={() => setIsExpanded((expanded) => !expanded)}
      left={summarySlots.expandableLeft}
      leftControls={summarySlots.expandableLeftControls}
      leftTrailing={summarySlots.expandableLeftTrailing}
      rightLeading={rightLeading}
      rightTimestamp={rightTimestamp}
    >
      {hasVisibleDetails && (
        <>
          {hasDetailText(input) && (
            <ToolDetailTextBlock
              label="Input"
              text={input}
              copyAriaLabel="Copy tool input"
              labelClassName="text-[color:var(--transcript-row-accent)]"
            />
          )}
          {inputStateMessage && (
            <ToolDetailStateBlock
              label="Input"
              message={inputStateMessage}
              labelClassName="text-[color:var(--transcript-row-accent)]"
            />
          )}

          {hasDetailText(output) && (
            <ToolDetailTextBlock
              label="Output"
              text={output}
              copyAriaLabel="Copy tool output"
              labelClassName="text-[var(--text-subtle)]"
              maxHeightClassName="max-h-48 overflow-y-auto"
            />
          )}
          {outputStateMessage && (
            <ToolDetailStateBlock
              label="Output"
              message={outputStateMessage}
              labelClassName="text-[var(--text-subtle)]"
            />
          )}
        </>
      )}
    </ExpandableTranscriptRow>
  );
}
