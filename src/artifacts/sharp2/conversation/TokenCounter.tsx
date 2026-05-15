import { CopyButton } from '../../../components/CopyButton';
import { mergeClassNames } from '../../../lib/classNames';

export type TokenUsageViewModel = {
  used: number;
  limit: number;
  label?: string;
  cached?: number;
  inputTokens?: number;
  outputTokens?: number;
  reasoningOutputTokens?: number;
  lastUsage?: {
    inputTokens?: number;
    cachedInputTokens?: number;
    outputTokens?: number;
    reasoningOutputTokens?: number;
    totalTokens?: number;
  };
  rateLimits?: unknown;
};

export type TokenCounterProps = TokenUsageViewModel;

export type TokenTelemetryPayload = {
  info?: {
    total_token_usage?: {
      input_tokens?: number;
      cached_input_tokens?: number;
      output_tokens?: number;
      reasoning_output_tokens?: number;
      total_tokens?: number;
    };
    last_token_usage?: {
      input_tokens?: number;
      cached_input_tokens?: number;
      output_tokens?: number;
      reasoning_output_tokens?: number;
      total_tokens?: number;
    };
    model_context_window?: number;
  };
  rate_limits?: unknown;
};

const INVALID_LIMIT_TEXT = 'invalid limit';
const INVALID_USED_TEXT = 'invalid usage';
const TOKEN_METER_BLOCKS = 20;

const formatTokens = (n: number) => new Intl.NumberFormat('en-US').format(n);

export function tokenCounterPropsFromTelemetry(
  payload: TokenTelemetryPayload,
  label = 'Context Window',
): TokenUsageViewModel {
  const totalUsage = payload.info?.total_token_usage;
  const lastUsage = payload.info?.last_token_usage;

  return {
    label,
    used: totalUsage?.total_tokens ?? Number.NaN,
    limit: payload.info?.model_context_window ?? Number.NaN,
    cached: totalUsage && 'cached_input_tokens' in totalUsage ? totalUsage.cached_input_tokens : undefined,
    inputTokens: totalUsage?.input_tokens,
    outputTokens: totalUsage?.output_tokens,
    reasoningOutputTokens: totalUsage?.reasoning_output_tokens,
    lastUsage: lastUsage
      ? {
          inputTokens: lastUsage.input_tokens,
          cachedInputTokens: lastUsage.cached_input_tokens,
          outputTokens: lastUsage.output_tokens,
          reasoningOutputTokens: lastUsage.reasoning_output_tokens,
          totalTokens: lastUsage.total_tokens,
        }
      : undefined,
    rateLimits: payload.rate_limits,
  };
}

export function getTokenUsageSummary({ used, limit, label = 'Context Window', cached }: TokenCounterProps) {
  const hasValidUsed = Number.isFinite(used) && used >= 0;
  const hasValidLimit = Number.isFinite(limit) && limit > 0;
  const hasCached = cached !== undefined && Number.isFinite(cached) && cached >= 0;
  const numeratorText = hasValidUsed ? formatTokens(used) : INVALID_USED_TEXT;
  const copyNumeratorText = hasValidUsed ? String(used) : INVALID_USED_TEXT;
  const denominatorText = hasValidLimit ? formatTokens(limit) : INVALID_LIMIT_TEXT;
  const copyDenominatorText = hasValidLimit ? `${limit} tokens` : INVALID_LIMIT_TEXT;
  const usageText = `${numeratorText} / ${denominatorText}`;
  const copyUsageText = `${copyNumeratorText} / ${copyDenominatorText}`;
  const cachedText = hasCached ? formatTokens(cached) : null;
  const copyCachedText = hasCached ? `${cached} cached` : null;
  const rawPercentage = hasValidUsed && hasValidLimit ? (used / limit) * 100 : null;
  const percentage = rawPercentage === null ? null : Math.min(100, Math.max(0, rawPercentage));
  const filledBlocks =
    percentage === null ? 0 : percentage > 0 ? Math.max(1, Math.floor((percentage / 100) * TOKEN_METER_BLOCKS)) : 0;
  const emptyBlocks = TOKEN_METER_BLOCKS - filledBlocks;
  const percentageText = percentage === null ? 'percentage unavailable' : `${percentage.toFixed(1)}%`;
  const copyText = `${label}: ${copyUsageText}${copyCachedText ? ` | ${copyCachedText}` : ''} (${percentageText})`;

  return {
    usageText,
    usedText: numeratorText,
    limitText: denominatorText,
    percentageText,
    copyText,
    percentage,
    filledBlocks,
    emptyBlocks,
    cachedText,
  };
}

export function TokenCounter({ used, limit, label = 'Context Window', cached }: TokenCounterProps) {
  const { usedText, limitText, percentageText, copyText, percentage, filledBlocks, emptyBlocks, cachedText } =
    getTokenUsageSummary({
      used,
      limit,
      label,
      cached,
    });

  return (
    <div className="bg-[var(--surface-muted)] px-3 py-2 font-mono text-xs">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wide text-[10px]">{label}</span>
        <div className="flex min-w-0 items-center">
          <span className="text-[var(--text-subtle)]">[</span>
          <span className="text-[var(--accent)]">{'▮'.repeat(filledBlocks)}</span>
          <span className="text-[var(--text-subtle)]">{'-'.repeat(emptyBlocks)}</span>
          <span className="text-[var(--text-subtle)]">]</span>
        </div>
        <span
          className={mergeClassNames(
            'tabular-nums',
            percentage !== null && percentage > 90
              ? 'text-[var(--danger)]'
              : percentage !== null && percentage > 75
                ? 'text-[var(--warning)]'
                : 'text-[var(--text-muted)]',
          )}
        >
          {percentageText}
        </span>
        <span className="text-[var(--text-subtle)] tabular-nums">Used: {usedText}</span>
        <span className="text-[var(--text-subtle)]">/</span>
        <span className="text-[var(--text-subtle)] tabular-nums">Limit: {limitText}</span>
        {cachedText !== null && <span className="text-[var(--text-subtle)] tabular-nums">Cached: {cachedText}</span>}
        <CopyButton
          text={copyText}
          ariaLabel="Copy context window token summary"
          className="ml-auto border-0 bg-transparent px-1.5 py-0.5 hover:bg-[var(--surface-strong)]"
        />
      </div>
    </div>
  );
}
