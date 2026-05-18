import { CopyButton } from '../../../components/CopyButton';
import { formatConversationTimestamp, formatConversationTimestampTitle } from './time';

const timestampBadgeClasses =
  'inline-flex h-6 shrink-0 items-center justify-center border border-transparent bg-transparent px-1.5 py-0 text-[10px] font-semibold normal-case text-[var(--text-subtle)] tabular-nums';

export function TimestampBadge({ timestamp, interactive = true }: { timestamp?: string; interactive?: boolean }) {
  const label = formatConversationTimestamp(timestamp);
  const title = formatConversationTimestampTitle(timestamp);
  const sourceTimestamp = timestamp?.trim();

  if (!label || !sourceTimestamp) return null;

  if (!interactive) {
    return (
      <span title={title ? `${title} local time` : undefined} className={timestampBadgeClasses}>
        {label}
      </span>
    );
  }

  return (
    <CopyButton
      text={sourceTimestamp}
      idleLabel={label}
      ariaLabel={`Copy UTC timestamp ${sourceTimestamp}`}
      title={title ? `${title} local time; click to copy UTC timestamp ${sourceTimestamp}` : undefined}
      showIcon={false}
      variant="headerText"
      className="tabular-nums"
    />
  );
}
