import { CopyButton } from '../../../components/CopyButton';
import {
  AgentIdentityTags,
  EventDescriptor,
  EventPreviewPill,
  getAgentSummaryLabel,
  SubagentNotificationStatusBadge,
} from './EventRowParts';
import { TimestampBadge } from './TimestampBadge';
import { TranscriptRow } from './TranscriptRow';
import type { SubagentNotificationStatus } from './types';

export type SubagentNotificationProps = {
  agentId: string;
  agentNickname?: string;
  agentRole?: string;
  status: SubagentNotificationStatus;
  summary: string;
  rawPayload?: string;
  timestamp?: string;
};

const statusLabels: Record<SubagentNotificationStatus, string> = {
  completed: 'Completed',
  failed: 'Failed',
  running: 'Running',
  timed_out: 'Timed out',
};

export function SubagentNotification({
  agentId,
  agentNickname,
  agentRole,
  status,
  summary,
  rawPayload,
  timestamp,
}: SubagentNotificationProps) {
  const agentLabel = getAgentSummaryLabel({ agentId, agentNickname }) ?? agentId;
  const copyText = rawPayload ?? `${agentLabel}: ${statusLabels[status]}: ${summary}`;

  return (
    <TranscriptRow
      accentColor="var(--category-cyan)"
      left={
        <>
          <EventDescriptor
            category="SUBAGENT"
            colorClassName="text-[var(--category-cyan)]"
            sections={[{ value: 'Notification', width: 'subagentAction' }]}
          />
          <AgentIdentityTags agentId={agentId} agentNickname={agentNickname} agentRole={agentRole} mode="copy" />
          <EventPreviewPill title={summary}>{summary}</EventPreviewPill>
        </>
      }
      right={
        <>
          <SubagentNotificationStatusBadge status={status} />
          <TimestampBadge timestamp={timestamp} interactive={false} />
          <CopyButton
            text={copyText}
            idleLabel="Copy"
            ariaLabel={`Copy subagent notification for ${agentLabel}`}
            className="border-0 bg-transparent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-[var(--surface-strong)]"
          />
        </>
      }
    />
  );
}
