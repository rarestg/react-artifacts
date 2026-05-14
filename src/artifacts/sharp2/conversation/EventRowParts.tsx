import type { ReactNode } from 'react';
import { mergeClassNames } from '../../../lib/classNames';
import type { SubagentNotificationStatus, ToolCallStatus } from './types';

export function getAgentIdSuffix(agentId?: string) {
  const trimmedId = agentId?.trim();
  if (!trimmedId) return undefined;
  return trimmedId.slice(-6);
}

export function getAgentDisplayLabel({ agentId, agentNickname }: { agentId?: string; agentNickname?: string }) {
  const nickname = agentNickname?.trim();
  const suffix = getAgentIdSuffix(agentId);

  if (nickname && suffix) return `${nickname} / ${suffix}`;
  return nickname || suffix || undefined;
}

export function getAgentTitle({
  agentId,
  agentNickname,
  agentRole,
}: {
  agentId?: string;
  agentNickname?: string;
  agentRole?: string;
}) {
  const parts = [
    agentNickname?.trim() ? `Nickname: ${agentNickname.trim()}` : undefined,
    agentId?.trim() ? `Agent ID: ${agentId.trim()}` : undefined,
    agentRole?.trim() ? `Role: ${agentRole.trim()}` : undefined,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' / ') : undefined;
}

export function EventLabel({
  category,
  action,
  colorClassName,
}: {
  category: string;
  action: string;
  colorClassName: string;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold">
      <span className={mergeClassNames('uppercase', colorClassName)}>{category}</span>
      <span className="h-3 border-l border-[var(--border-strong)]" aria-hidden="true" />
      <span className="text-[var(--text)]">{action}</span>
    </span>
  );
}

export function AgentTag({
  agentId,
  agentNickname,
  agentRole,
}: {
  agentId?: string;
  agentNickname?: string;
  agentRole?: string;
}) {
  const label = getAgentDisplayLabel({ agentId, agentNickname });
  if (!label) return null;

  return (
    <span
      title={getAgentTitle({ agentId, agentNickname, agentRole })}
      className="inline-flex h-6 max-w-32 shrink-0 items-center border border-[var(--border)] bg-[var(--surface)] px-1.5 font-mono text-[10px] font-semibold text-[var(--text-muted)]"
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

export function EventPreviewPill({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex h-6 min-w-0 max-w-[24rem] flex-[1_1_10rem] items-center border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 font-mono text-xs font-medium text-[var(--text)]"
    >
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

const toolStatusConfig: Record<Exclude<ToolCallStatus, 'success'>, { label: string; className: string }> = {
  error: {
    label: 'Error',
    className: 'text-[var(--danger-text)] bg-[var(--danger-weak)] border-[color:var(--danger)]',
  },
  pending: {
    label: 'Running',
    className: 'text-[var(--warning-text)] bg-[var(--warning-weak)] border-[color:var(--warning)]',
  },
};

const notificationStatusConfig: Record<
  Exclude<SubagentNotificationStatus, 'completed'>,
  { label: string; className: string }
> = {
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

export function ToolStatusBadge({ status }: { status?: ToolCallStatus }) {
  if (!status || status === 'success') return null;
  const config = toolStatusConfig[status];

  return <EventStatusBadge label={config.label} className={config.className} />;
}

export function SubagentNotificationStatusBadge({ status }: { status: SubagentNotificationStatus }) {
  if (status === 'completed') return null;
  const config = notificationStatusConfig[status];

  return <EventStatusBadge label={config.label} className={config.className} />;
}

function EventStatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span className={mergeClassNames('shrink-0 border px-1.5 py-0.5 text-[10px] font-semibold', className)}>
      {label}
    </span>
  );
}
