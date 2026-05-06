import type { ReactNode } from 'react';
import { useMemo, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { type CopyStatus, useCopyToClipboard } from '../lib/useCopyToClipboard';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type CopyableLabelProps = {
  value: string;
  icon?: ReactNode;
  className?: string;
  reserveLabel?: string;
  copiedLabel?: string;
  failedLabel?: string;
  hoverLabel?: string;
  showHoverOnFocus?: boolean;
  ariaLabel?: string;
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
  ariaLabel,
}: CopyableLabelProps) {
  const { status, copy, announcement } = useCopyToClipboard();
  const rootRef = useRef<HTMLButtonElement>(null);

  useArtifactThemeGuard('CopyableLabel', rootRef);

  const resolvedAriaLabel = ariaLabel?.trim() || `Copy: ${value}`;

  const resolvedReserveLabel = useMemo(() => {
    if (reserveLabel) return reserveLabel;
    const fallback = [copiedLabel, failedLabel, hoverLabel].reduce((longest, next) =>
      next.length > longest.length ? next : longest,
    );
    return value.length > fallback.length ? value : fallback;
  }, [reserveLabel, value, copiedLabel, failedLabel, hoverLabel]);

  const feedbackText: Record<Exclude<CopyStatus, 'idle'>, string> = {
    copied: copiedLabel,
    failed: failedLabel,
  };

  const handleCopy = () => {
    void copy(value);
  };

  const tone =
    status === 'copied'
      ? 'border-[color:var(--copy-success-border)] bg-[var(--copy-success-bg)] text-[var(--copy-success-text)]'
      : status === 'failed'
        ? 'border-[color:var(--copy-fail-border)] bg-[var(--copy-fail-bg)] text-[var(--copy-fail-text)]'
        : mergeClassNames(
            'border-[color:var(--copy-idle-border)] bg-[var(--copy-idle-bg)] text-[var(--copy-idle-text)]',
            'hover:border-[color:var(--copy-hover-border)] hover:bg-[var(--copy-hover-bg)] hover:text-[var(--copy-hover-text)]',
            showHoverOnFocus &&
              'focus-visible:border-[color:var(--copy-hover-border)] focus-visible:bg-[var(--copy-hover-bg)] focus-visible:text-[var(--copy-hover-text)]',
            'active:bg-[var(--copy-hover-bg)]',
          );

  return (
    <button
      ref={rootRef}
      type="button"
      aria-label={resolvedAriaLabel}
      onClick={handleCopy}
      title={`Copy: ${value}`}
      className={mergeClassNames(
        'group inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border transition-colors motion-reduce:transition-none cursor-pointer',
        'rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        'focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
        tone,
        className,
      )}
    >
      {icon && <span className="shrink-0 text-[var(--copy-idle-text)]">{icon}</span>}
      <span className="relative inline-grid min-w-0">
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          {resolvedReserveLabel}
        </span>
        <span
          className={mergeClassNames(
            'col-start-1 row-start-1 truncate transition-opacity motion-reduce:transition-none',
            status === 'idle'
              ? mergeClassNames(
                  'opacity-100 group-hover:opacity-0',
                  showHoverOnFocus && 'group-focus-visible:opacity-0',
                )
              : 'opacity-0',
          )}
        >
          {value}
        </span>
        <span
          className={mergeClassNames(
            'col-start-1 row-start-1 truncate opacity-0 transition-opacity motion-reduce:transition-none',
            status === 'idle' &&
              mergeClassNames('group-hover:opacity-100', showHoverOnFocus && 'group-focus-visible:opacity-100'),
          )}
          aria-hidden="true"
        >
          {hoverLabel}
        </span>
        <span
          className={mergeClassNames(
            'col-start-1 row-start-1 truncate opacity-0 transition-opacity motion-reduce:transition-none',
            status !== 'idle' && 'opacity-100',
          )}
        >
          {status === 'idle' ? copiedLabel : feedbackText[status]}
        </span>
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </button>
  );
}
