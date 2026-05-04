import { CopyButton } from '../../../components/CopyButton';

export type TokenCounterProps = {
  used: number;
  limit: number;
  label?: string;
};

const INVALID_LIMIT_TEXT = 'invalid limit';

const formatTokens = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
};

export function getTokenUsageSummary({ used, limit, label = 'Context Window' }: TokenCounterProps) {
  const hasValidLimit = Number.isFinite(limit) && limit > 0;
  const denominatorText = hasValidLimit ? `${formatTokens(limit)} tokens` : INVALID_LIMIT_TEXT;
  const copyDenominatorText = hasValidLimit ? `${limit} tokens` : INVALID_LIMIT_TEXT;
  const usageText = `${formatTokens(used)} / ${denominatorText}`;
  const copyUsageText = `${used} / ${copyDenominatorText}`;
  const rawPercentage = hasValidLimit ? Math.round((used / limit) * 100) : null;
  const percentage = rawPercentage === null ? null : Math.min(100, Math.max(0, rawPercentage));
  const filledBlocks = percentage === null ? 0 : Math.round((percentage / 100) * 20);
  const emptyBlocks = 20 - filledBlocks;
  const percentageText = percentage === null ? 'percentage unavailable' : `${percentage}% Used`;
  const copyText = `${label}: ${copyUsageText} (${percentageText})`;

  return { usageText, percentageText, copyText, percentage, filledBlocks, emptyBlocks };
}

export function TokenCounter({ used, limit, label = 'Context Window' }: TokenCounterProps) {
  const { usageText, percentageText, copyText, percentage, filledBlocks, emptyBlocks } = getTokenUsageSummary({
    used,
    limit,
    label,
  });

  return (
    <div className="border border-[var(--border-strong)] bg-[var(--surface-muted)] font-mono text-xs">
      <div className="px-3 py-1.5 border-b border-[var(--border-strong)] bg-[var(--surface-strong)] flex items-center justify-between">
        <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wide text-[10px]">
          Tokens & Limits
        </span>
        <CopyButton text={copyText} className="border-0 bg-transparent hover:bg-[var(--surface-strong)] px-1.5" />
      </div>
      <div className="px-3 py-2 space-y-1">
        <div className="text-[var(--text-subtle)] text-[10px] uppercase tracking-wide">{label}</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="text-[var(--text-subtle)]">[</span>
            <span className="text-[var(--success)]">{'█'.repeat(filledBlocks)}</span>
            <span className="text-[var(--text-subtle)]">{'░'.repeat(emptyBlocks)}</span>
            <span className="text-[var(--text-subtle)]">]</span>
          </div>
          <span
            className={[
              'tabular-nums',
              percentage !== null && percentage > 90
                ? 'text-[var(--danger)]'
                : percentage !== null && percentage > 75
                  ? 'text-[var(--warning)]'
                  : 'text-[var(--text-muted)]',
            ].join(' ')}
          >
            {percentageText}
          </span>
          <span className="text-[var(--text-subtle)] tabular-nums">({usageText})</span>
        </div>
      </div>
    </div>
  );
}
