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
import { ExpandableTranscriptRow } from './TranscriptRow';
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
  const disclosureLabel = isExpanded
    ? `Collapse subagent notification details for ${agentLabel}`
    : `Expand subagent notification details for ${agentLabel}`;

  return (
    <ExpandableTranscriptRow
      accentColor="var(--category-cyan)"
      expanded={isExpanded}
      controlsId={detailsId}
      summaryAriaLabel={disclosureLabel}
      summaryTitle={summary}
      onToggle={() => setIsExpanded((expanded) => !expanded)}
      left={
        <EventDescriptor
          category="SUBAGENT"
          colorClassName="text-[color:var(--transcript-row-accent)]"
          sections={[{ value: 'Notification', width: 'action' }]}
        />
      }
      leftControls={
        <AgentIdentityTags agentId={agentId} agentNickname={agentNickname} agentRole={agentRole} mode="copy" />
      }
      leftTrailing={
        <EventPreviewPill title={summary} className="flex-1">
          {summary}
        </EventPreviewPill>
      }
      rightLeading={<SubagentNotificationStatusBadge status={status} />}
      rightTimestamp={<TimestampBadge timestamp={timestamp} />}
    >
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className={detailLabelClasses}>Result</div>
          <CopyButton
            text={summary}
            idleLabel=""
            ariaLabel={`Copy subagent notification result for ${agentLabel}`}
            variant="icon"
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
              idleLabel=""
              ariaLabel={`Copy raw subagent notification payload for ${agentLabel}`}
              variant="icon"
            />
          </div>
          <pre className={`${detailPreClasses} max-h-48 overflow-y-auto`}>{rawPayload}</pre>
        </div>
      )}
    </ExpandableTranscriptRow>
  );
}
