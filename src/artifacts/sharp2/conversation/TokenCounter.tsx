import { CopyButton } from '../../../components/CopyButton';

export type TokenCounterProps = {
  used: number;
  limit: number;
  label?: string;
};

export function TokenCounter({ used, limit, label = 'Context Window' }: TokenCounterProps) {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 1;
  const rawPercentage = Math.round((used / safeLimit) * 100);
  const percentage = Math.min(100, Math.max(0, rawPercentage));
  const filledBlocks = Math.round((percentage / 100) * 20);
  const emptyBlocks = 20 - filledBlocks;

  const formatTokens = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="border border-[var(--border-strong)] bg-[var(--surface-muted)] font-mono text-xs">
      <div className="px-3 py-1.5 border-b border-[var(--border-strong)] bg-[var(--surface-strong)] flex items-center justify-between">
        <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wide text-[10px]">
          Tokens & Limits
        </span>
        <CopyButton
          text={`${label}: ${used} / ${limit} tokens (${percentage}%)`}
          className="border-0 bg-transparent hover:bg-[var(--surface-strong)] px-1.5"
        />
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
              percentage > 90
                ? 'text-[var(--danger)]'
                : percentage > 75
                  ? 'text-[var(--warning)]'
                  : 'text-[var(--text-muted)]',
            ].join(' ')}
          >
            {percentage}% Used
          </span>
          <span className="text-[var(--text-subtle)] tabular-nums">
            ({formatTokens(used)} / {formatTokens(limit)} tokens)
          </span>
        </div>
      </div>
    </div>
  );
}
