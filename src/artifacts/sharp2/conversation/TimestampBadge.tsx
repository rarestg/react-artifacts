import { CopyButton } from '../../../components/CopyButton';
import { formatConversationTimestamp, formatConversationTimestampTitle } from './time';

export function TimestampBadge({ timestamp }: { timestamp?: string }) {
  const label = formatConversationTimestamp(timestamp);
  const title = formatConversationTimestampTitle(timestamp);
  const sourceTimestamp = timestamp?.trim();

  if (!label || !sourceTimestamp) return null;

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
