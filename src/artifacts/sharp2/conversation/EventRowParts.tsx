import type { CSSProperties, ReactNode } from 'react';
import { mergeClassNames } from '../../../lib/classNames';
import { useCopyToClipboard } from '../../../lib/useCopyToClipboard';
import type { SubagentNotificationStatus, ToolCallStatus } from './types';

type EventDescriptorSectionWidth = 'subagentAction';

export type EventDescriptorSection = {
  value: string;
  width?: EventDescriptorSectionWidth;
  title?: string;
  className?: string;
};

const emptyEventDescriptorSections: EventDescriptorSection[] = [];

type AgentIdentityTagStyle = CSSProperties & {
  '--agent-tag-color': string;
  '--agent-tag-text': string;
  '--agent-tag-bg': string;
};

const eventDescriptorSectionWidthClasses: Record<EventDescriptorSectionWidth, string> = {
  subagentAction: 'min-w-[12ch] shrink-0',
};

const agentIdentityTonePalette = [
  {
    name: 'blue',
    color: 'var(--category-blue)',
    text: 'var(--category-blue-text)',
    weak: 'var(--category-blue-weak)',
  },
  {
    name: 'violet',
    color: 'var(--category-violet)',
    text: 'var(--category-violet-text)',
    weak: 'var(--category-violet-weak)',
  },
  {
    name: 'pink',
    color: 'var(--category-pink)',
    text: 'var(--category-pink-text)',
    weak: 'var(--category-pink-weak)',
  },
  {
    name: 'cyan',
    color: 'var(--category-cyan)',
    text: 'var(--category-cyan-text)',
    weak: 'var(--category-cyan-weak)',
  },
] as const;

const metadataAgentTone = {
  name: 'metadata',
  color: 'var(--border)',
  text: 'var(--text-muted)',
  weak: 'var(--surface)',
} as const;

type AgentIdentityTone = (typeof agentIdentityTonePalette)[number] | typeof metadataAgentTone;

export const agentIdentityToneNames = agentIdentityTonePalette.map((tone) => tone.name);

const hashString = (value: string) => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
};

export function getAgentIdSuffix(agentId?: string) {
  const trimmedId = agentId?.trim();
  if (!trimmedId) return undefined;

  const compact = trimmedId.replace(/-/g, '');
  if (/^[0-9a-f]{32}$/i.test(compact)) return compact.slice(-6).toLowerCase();

  return trimmedId.slice(-6);
}

export function getAgentIdentityToneName(agentId?: string): AgentIdentityTone['name'] {
  const trimmedId = agentId?.trim();
  if (!trimmedId) return metadataAgentTone.name;

  return agentIdentityTonePalette[hashString(trimmedId) % agentIdentityTonePalette.length].name;
}

function getAgentIdentityTone(agentId?: string): AgentIdentityTone {
  const toneName = getAgentIdentityToneName(agentId);

  return agentIdentityTonePalette.find((tone) => tone.name === toneName) ?? metadataAgentTone;
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

export function getAgentSummaryLabel({ agentId, agentNickname }: { agentId?: string; agentNickname?: string }) {
  const nickname = agentNickname?.trim();
  const suffix = getAgentIdSuffix(agentId);

  if (nickname && suffix) return `${nickname} (${suffix})`;
  return nickname || suffix || agentId?.trim() || undefined;
}

export function EventDescriptor({
  category,
  sections = emptyEventDescriptorSections,
  colorClassName,
}: {
  category: string;
  sections?: EventDescriptorSection[];
  colorClassName: string;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold">
      <span className={mergeClassNames('uppercase', colorClassName)}>{category}</span>
      {sections.map((section) => (
        <span key={`${section.width ?? 'natural'}-${section.value}`} className="inline-flex items-center gap-1.5">
          <span className="h-3 border-l border-[var(--border-strong)]" aria-hidden="true" />
          <span
            title={section.title}
            data-section-width={section.width}
            className={mergeClassNames(
              'min-w-0 text-[var(--text)]',
              section.width && eventDescriptorSectionWidthClasses[section.width],
              section.className,
            )}
          >
            {section.value}
          </span>
        </span>
      ))}
    </span>
  );
}

type AgentIdentityTagModel = {
  key: 'nickname' | 'id';
  label: string;
  copyValue: string;
  ariaLabel: string;
  title?: string;
  maxWidthClassName: string;
};

function getAgentIdentityTagStyle(tone: AgentIdentityTone): AgentIdentityTagStyle {
  return {
    '--agent-tag-color': tone.color,
    '--agent-tag-text': tone.text,
    '--agent-tag-bg': tone.weak,
  };
}

const agentIdentityTagBaseClasses =
  'inline-flex h-6 min-w-0 shrink-0 items-center border border-transparent px-1.5 font-mono text-[10px] font-semibold';
const agentIdentityTagToneClasses = 'bg-[var(--agent-tag-bg)] text-[var(--agent-tag-text)]';
const copySuccessLabel = 'Copied';
const copyFailedLabel = 'Failed';

function AgentIdentityDisplayTag({ tag, tone }: { tag: AgentIdentityTagModel; tone: AgentIdentityTone }) {
  return (
    <span
      title={tag.title}
      data-agent-identity-tag={tag.key}
      style={getAgentIdentityTagStyle(tone)}
      className={mergeClassNames(agentIdentityTagBaseClasses, agentIdentityTagToneClasses, tag.maxWidthClassName)}
    >
      <span className="truncate">{tag.label}</span>
    </span>
  );
}

function AgentIdentityCopyTag({ tag, tone }: { tag: AgentIdentityTagModel; tone: AgentIdentityTone }) {
  const { status, copy, announcement } = useCopyToClipboard();
  const displayLabel = status === 'copied' ? copySuccessLabel : status === 'failed' ? copyFailedLabel : tag.label;
  const reserveLabel =
    tag.label.length >= copySuccessLabel.length && tag.label.length >= copyFailedLabel.length
      ? tag.label
      : copySuccessLabel;
  const statusClass =
    status === 'copied'
      ? 'border-transparent bg-[var(--copy-success-bg)] text-[var(--copy-success-text)]'
      : status === 'failed'
        ? 'border-transparent bg-[var(--copy-fail-bg)] text-[var(--copy-fail-text)]'
        : mergeClassNames(agentIdentityTagToneClasses, 'hover:bg-[var(--surface)] active:bg-[var(--surface-pressed)]');
  const title = tag.key === 'nickname' ? 'Copy nickname' : 'Copy full agent ID';

  return (
    <button
      type="button"
      title={title}
      aria-label={tag.ariaLabel}
      data-agent-identity-tag={tag.key}
      data-copy-value={tag.copyValue}
      style={getAgentIdentityTagStyle(tone)}
      onClick={() => {
        void copy(tag.copyValue);
      }}
      className={mergeClassNames(
        agentIdentityTagBaseClasses,
        'cursor-pointer transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
        statusClass,
        tag.maxWidthClassName,
      )}
    >
      <span className="relative inline-grid min-w-0">
        <span aria-hidden="true" className="col-start-1 row-start-1 truncate opacity-0 pointer-events-none">
          {reserveLabel}
        </span>
        <span className="col-start-1 row-start-1 truncate">{displayLabel}</span>
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </button>
  );
}

export function AgentIdentityTags({
  agentId,
  agentNickname,
  agentRole,
  mode = 'display',
}: {
  agentId?: string;
  agentNickname?: string;
  agentRole?: string;
  mode?: 'display' | 'copy';
}) {
  const trimmedNickname = agentNickname?.trim();
  const trimmedId = agentId?.trim();
  const suffix = getAgentIdSuffix(trimmedId);
  const title = getAgentTitle({ agentId: trimmedId, agentNickname: trimmedNickname, agentRole });
  const tone = getAgentIdentityTone(trimmedId);
  const tags: AgentIdentityTagModel[] = [];

  if (trimmedNickname) {
    tags.push({
      key: 'nickname',
      label: trimmedNickname,
      copyValue: trimmedNickname,
      ariaLabel: `Copy agent nickname ${trimmedNickname}`,
      title,
      maxWidthClassName: 'max-w-28',
    });
  }

  if (trimmedId && suffix) {
    tags.push({
      key: 'id',
      label: suffix,
      copyValue: trimmedId,
      ariaLabel: `Copy full agent ID ${trimmedId}`,
      title,
      maxWidthClassName: 'max-w-20 tabular-nums',
    });
  }

  if (tags.length === 0) return null;
  const TagComponent = mode === 'copy' ? AgentIdentityCopyTag : AgentIdentityDisplayTag;

  return (
    <span className="inline-flex min-w-0 shrink-0 items-center gap-1" data-agent-tone={tone.name}>
      {tags.map((tag) => (
        <TagComponent key={tag.key} tag={tag} tone={tone} />
      ))}
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
