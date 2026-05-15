import { useId, useState } from 'react';
import { CopyButton } from '../../../components/CopyButton';
import {
  AgentIdentityTags,
  EventDescriptor,
  EventPreviewPill,
  getAgentSummaryLabel,
  SubagentNotificationStatusBadge,
} from './EventRowParts';
import { TimestampBadge } from './TimestampBadge';
import { ExpandableTranscriptRow, TranscriptRowActionCluster, TranscriptRowDisclosureButton } from './TranscriptRow';
import type { SubagentNotificationStatus } from './types';

export type SubagentNotificationProps = {
  agentId: string;
  agentNickname?: string;
  agentRole?: string;
  status: SubagentNotificationStatus;
  summary: string;
  rawPayload?: string;
  timestamp?: string;
  defaultExpanded?: boolean;
};

const detailLabelClasses =
  'text-[10px] font-semibold uppercase tracking-wider text-[color:var(--transcript-row-accent)]';
const detailCopyButtonClasses =
  'border-0 bg-transparent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-[var(--surface-strong)]';
const detailPreClasses =
  'font-mono text-sm text-[var(--text)] whitespace-pre-wrap break-words bg-[var(--surface-muted)] border border-[var(--border)] px-2 py-1.5';

export function SubagentNotification({
  agentId,
  agentNickname,
  agentRole,
  status,
  summary,
  rawPayload,
  timestamp,
  defaultExpanded = false,
}: SubagentNotificationProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const detailsId = useId();
  const agentLabel = getAgentSummaryLabel({ agentId, agentNickname }) ?? agentId;
  const hasAgentIdentity = Boolean(agentNickname?.trim() || agentId?.trim());
  const disclosureLabel = isExpanded
    ? `Collapse subagent notification details for ${agentLabel}`
    : `Expand subagent notification details for ${agentLabel}`;

  return (
    <ExpandableTranscriptRow
      accentColor="var(--category-cyan)"
      expanded={isExpanded}
      controlsId={detailsId}
      summaryAriaLabel={disclosureLabel}
      onToggle={() => setIsExpanded((expanded) => !expanded)}
      left={
        <EventDescriptor
          category="SUBAGENT"
          colorClassName="text-[color:var(--transcript-row-accent)]"
          sections={[{ value: 'Notification', width: 'subagentAction' }]}
        />
      }
      leftControls={
        <AgentIdentityTags agentId={agentId} agentNickname={agentNickname} agentRole={agentRole} mode="copy" />
      }
      leftTrailing={<EventPreviewPill title={summary}>{summary}</EventPreviewPill>}
      right={
        <TranscriptRowActionCluster
          leading={<SubagentNotificationStatusBadge status={status} />}
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
      {hasAgentIdentity && (
        <div className="flex min-w-0 items-center gap-2">
          <div className={detailLabelClasses}>Agent</div>
          <AgentIdentityTags agentId={agentId} agentNickname={agentNickname} agentRole={agentRole} mode="copy" />
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className={detailLabelClasses}>Result</div>
          <CopyButton
            text={summary}
            idleLabel="Copy"
            ariaLabel={`Copy subagent notification result for ${agentLabel}`}
            className={detailCopyButtonClasses}
          />
        </div>
        <pre className={detailPreClasses}>{summary}</pre>
      </div>

      {rawPayload && (
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
              Raw Payload
            </div>
            <CopyButton
              text={rawPayload}
              idleLabel="Copy"
              ariaLabel={`Copy raw subagent notification payload for ${agentLabel}`}
              className={detailCopyButtonClasses}
            />
          </div>
          <pre className={`${detailPreClasses} max-h-48 overflow-y-auto`}>{rawPayload}</pre>
        </div>
      )}
    </ExpandableTranscriptRow>
  );
}
