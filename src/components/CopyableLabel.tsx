import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const isHoveredRef = useRef(false);
  const isFocusedRef = useRef(false);

  const resolvedReserveLabel = useMemo(() => {
    if (reserveLabel) return reserveLabel;
    const fallback = [copiedLabel, failedLabel, hoverLabel].reduce((longest, next) =>
      next.length > longest.length ? next : longest,
    );
    return value.length > fallback.length ? value : fallback;
  }, [reserveLabel, value, copiedLabel, failedLabel, hoverLabel]);

  const displayText: Record<CopyableLabelStatus, string> = {
    idle: value,
    hover: hoverLabel,
    copied: copiedLabel,
    failed: failedLabel,
  };

  const shouldShowHover = useCallback(
    () => isHoveredRef.current || (showHoverOnFocus && isFocusedRef.current),
    [showHoverOnFocus],
  );

  useEffect(() => {
    if (status !== 'copied' && status !== 'failed') return;
    const timeout = window.setTimeout(() => {
      setStatus(shouldShowHover() ? 'hover' : 'idle');
    }, 2000);
    return () => window.clearTimeout(timeout);
  }, [status, shouldShowHover]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  };

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    if (status === 'idle') setStatus('hover');
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    if (status === 'hover' && !shouldShowHover()) setStatus('idle');
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    if (!showHoverOnFocus) return;
    if (status === 'idle') setStatus('hover');
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (!showHoverOnFocus) return;
    if (status === 'hover' && !shouldShowHover()) setStatus('idle');
  };

  const tone =
    status === 'copied'
      ? 'border-[color:var(--copy-success-border)] bg-[var(--copy-success-bg)] text-[var(--copy-success-text)]'
      : status === 'failed'
        ? 'border-[color:var(--copy-fail-border)] bg-[var(--copy-fail-bg)] text-[var(--copy-fail-text)]'
        : status === 'hover'
          ? 'border-[color:var(--copy-hover-border)] bg-[var(--copy-hover-bg)] text-[var(--copy-hover-text)]'
          : 'border-[color:var(--copy-idle-border)] bg-[var(--copy-idle-bg)] text-[var(--copy-idle-text)]';

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
        'rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        'focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
        tone,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <span className="shrink-0 text-[var(--copy-idle-text)]">{icon}</span>}
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
