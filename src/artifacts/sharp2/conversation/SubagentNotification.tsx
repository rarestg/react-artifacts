import { CopyButton } from '../../../components/CopyButton';
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

const statusConfig: Record<SubagentNotificationStatus, { label: string; className: string }> = {
  completed: {
    label: 'Completed',
    className: 'text-[var(--success-text)] bg-[var(--success-weak)] border-[color:var(--success)]',
  },
  failed: {
    label: 'Failed',
    className: 'text-[var(--danger-text)] bg-[var(--danger-weak)] border-[color:var(--danger)]',
  },
  running: {
    label: 'Running',
    className: 'text-[var(--warning-text)] bg-[var(--warning-weak)] border-[color:var(--warning)]',
  },
  timed_out: {
    label: 'Timed out',
    className: 'text-[var(--warning-text)] bg-[var(--warning-weak)] border-[color:var(--warning)]',
  },
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
  const config = statusConfig[status] || statusConfig.completed;
  const agentLabel = agentNickname ?? agentId;
  const metadataLabel = agentRole ? `${agentLabel} / ${agentRole}` : agentLabel;
  const copyText = rawPayload ?? `${metadataLabel}: ${config.label}: ${summary}`;

  return (
    <div className="border-l-2 border-l-[var(--category-cyan)] bg-[var(--surface)]">
      <div className="flex min-w-0 items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="shrink-0 text-xs font-semibold uppercase text-[var(--category-cyan)]">
              Subagent Notification
            </span>
            <span className={`shrink-0 border px-1.5 py-0.5 text-[10px] font-medium ${config.className}`}>
              {config.label}
            </span>
            <span className="min-w-0 truncate text-[10px] font-semibold uppercase text-[var(--text-subtle)]">
              {metadataLabel}
            </span>
          </div>
          <div className="whitespace-pre-wrap break-words font-mono text-xs text-[var(--text)]">{summary}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
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
