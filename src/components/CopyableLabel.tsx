import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

type CopyableLabelStatus = 'idle' | 'hover' | 'copied' | 'failed';

type CopyableLabelProps = {
  value: string;
  icon?: ReactNode;
  className?: string;
  reserveLabel?: string;
  copiedLabel?: string;
  failedLabel?: string;
  hoverLabel?: string;
  showHoverOnFocus?: boolean;
};

export function CopyableLabel({
  value,
  icon,
  className,
  reserveLabel,
  copiedLabel = 'Copied ✓',
  failedLabel = 'Failed ✗',
  hoverLabel = 'Copy',
  showHoverOnFocus = true,
}: CopyableLabelProps) {
  const [status, setStatus] = useState<CopyableLabelStatus>('idle');

  const resolvedReserveLabel = useMemo(() => {
    if (reserveLabel) return reserveLabel;
    const fallback = copiedLabel.length > failedLabel.length ? copiedLabel : failedLabel;
    return value.length > fallback.length ? value : fallback;
  }, [reserveLabel, value, copiedLabel, failedLabel]);

  const displayText: Record<CopyableLabelStatus, string> = {
    idle: value,
    hover: hoverLabel,
    copied: copiedLabel,
    failed: failedLabel,
  };

  useEffect(() => {
    if (status !== 'copied' && status !== 'failed') return;
    const timeout = window.setTimeout(() => setStatus('idle'), 2000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  };

  const handleMouseEnter = () => {
    if (status === 'idle') setStatus('hover');
  };

  const handleMouseLeave = () => {
    if (status === 'hover') setStatus('idle');
  };

  const handleFocus = () => {
    if (!showHoverOnFocus) return;
    if (status === 'idle') setStatus('hover');
  };

  const handleBlur = () => {
    if (!showHoverOnFocus) return;
    if (status === 'hover') setStatus('idle');
  };

  const tone =
    status === 'copied'
      ? 'border-[color:var(--copy-success-border,#6ee7b7)] bg-[var(--copy-success-bg,#ecfdf5)] text-[var(--copy-success-text,#047857)]'
      : status === 'failed'
        ? 'border-[color:var(--copy-fail-border,#fca5a5)] bg-[var(--copy-fail-bg,#fef2f2)] text-[var(--copy-fail-text,#b91c1c)]'
        : status === 'hover'
          ? 'border-[color:var(--copy-hover-border,#cbd5e1)] bg-[var(--copy-hover-bg,#f8fafc)] text-[var(--copy-hover-text,#334155)]'
          : 'border-[color:var(--copy-idle-border,#e2e8f0)] bg-[var(--copy-idle-bg,#ffffff)] text-[var(--copy-idle-text,#475569)]';

  return (
    <button
      type="button"
      onClick={handleCopy}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      title={`Copy: ${value}`}
      className={[
        'inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border transition-colors motion-reduce:transition-none cursor-pointer',
        'rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring,#94a3b8)]',
        'focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface,#ffffff)]',
        tone,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <span className="shrink-0 text-[var(--copy-icon,#94a3b8)]">{icon}</span>}
      <span className="relative inline-grid min-w-0">
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          {resolvedReserveLabel}
        </span>
        <span className="col-start-1 row-start-1 truncate">{displayText[status]}</span>
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {status === 'copied' ? 'Copied to clipboard' : status === 'failed' ? 'Copy failed' : ''}
      </span>
    </button>
  );
}
