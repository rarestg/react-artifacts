import { CopyButton } from '../../../components/CopyButton';
import {
  AgentTag,
  EventLabel,
  EventPreviewPill,
  getAgentDisplayLabel,
  SubagentNotificationStatusBadge,
} from './EventRowParts';
import { TimestampBadge } from './TimestampBadge';
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
  const agentLabel = getAgentDisplayLabel({ agentId, agentNickname }) ?? agentNickname ?? agentId;
  const copyText = rawPayload ?? `${agentLabel}: ${statusLabels[status]}: ${summary}`;

  return (
    <div className="border-l-2 border-l-[var(--category-cyan)] bg-[var(--surface)]">
      <div className="flex min-w-0 items-center justify-between gap-3 p-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <EventLabel category="SUBAGENT" action="Notification" colorClassName="text-[var(--category-cyan)]" />
          <AgentTag agentId={agentId} agentNickname={agentNickname} agentRole={agentRole} />
          <EventPreviewPill title={summary}>{summary}</EventPreviewPill>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <SubagentNotificationStatusBadge status={status} />
          <TimestampBadge timestamp={timestamp} interactive={false} />
          <CopyButton
            text={copyText}
            idleLabel="Copy"
            ariaLabel={`Copy subagent notification for ${agentLabel}`}
            className="border-0 bg-transparent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-[var(--surface-strong)]"
          />
        </div>
      </div>
    </div>
  );
}
