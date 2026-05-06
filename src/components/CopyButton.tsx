import { Copy } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

type CopyButtonStatus = 'idle' | 'copied' | 'failed';

export type CopyButtonHandle = {
  copy: () => void;
};

export type CopyButtonProps = {
  text: string;
  idleLabel?: string;
  reserveLabel?: string;
  ariaLabel?: string;
  showIcon?: boolean;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'headerAction';
};

const COPIED_LABEL = 'Copied \u2713';
const FAILED_LABEL = 'Failed \u2717';

export const CopyButton = forwardRef<CopyButtonHandle, CopyButtonProps>(function CopyButton(
  {
    text,
    idleLabel = 'Copy',
    reserveLabel: reserveLabelOverride,
    ariaLabel,
    showIcon = true,
    className,
    disabled,
    variant = 'default',
  },
  ref,
) {
  const [status, setStatus] = useState<CopyButtonStatus>('idle');
  const rootRef = useRef<HTMLButtonElement>(null);
  const resolvedAriaLabel = ariaLabel?.trim() || idleLabel.trim() || 'Copy';

  useArtifactThemeGuard('CopyButton', rootRef);

  const labels: Record<CopyButtonStatus, string> = useMemo(
    () => ({ idle: idleLabel, copied: COPIED_LABEL, failed: FAILED_LABEL }),
    [idleLabel],
  );

  const reserveLabel = useMemo(() => {
    return [idleLabel, reserveLabelOverride, COPIED_LABEL, FAILED_LABEL]
      .filter((label): label is string => Boolean(label))
      .reduce((longest, next) => (next.length >= longest.length ? next : longest));
  }, [idleLabel, reserveLabelOverride]);

  const handleCopy = useCallback(async () => {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  }, [disabled, text]);

  useImperativeHandle(ref, () => ({ copy: handleCopy }), [handleCopy]);

  useEffect(() => {
    if (status === 'idle') return;
    const timeout = window.setTimeout(() => setStatus('idle'), 2000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const tone =
    status === 'copied'
      ? 'border-[color:var(--copy-success-border)] bg-[var(--copy-success-bg)] text-[var(--copy-success-text)]'
      : status === 'failed'
        ? 'border-[color:var(--copy-fail-border)] bg-[var(--copy-fail-bg)] text-[var(--copy-fail-text)]'
        : variant === 'headerAction'
          ? mergeClassNames(
              'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]',
              !disabled &&
                'hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
            )
          : mergeClassNames(
              'border-[color:var(--copy-idle-border)] bg-[var(--copy-idle-bg)] text-[var(--copy-idle-text)]',
              !disabled &&
                'hover:border-[color:var(--copy-hover-border)] hover:bg-[var(--copy-hover-bg)] hover:text-[var(--copy-hover-text)]',
            );
  const sizeClass = variant === 'headerAction' ? 'h-9 px-3 text-sm font-medium' : 'px-2 py-1 text-[11px] font-medium';
  const activeClass =
    variant === 'headerAction' ? 'active:bg-[var(--surface-strong)]' : 'active:bg-[var(--copy-hover-bg)]';

  return (
    <button
      ref={rootRef}
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      aria-label={resolvedAriaLabel}
      className={mergeClassNames(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border transition-colors motion-reduce:transition-none',
        'rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        'focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
        sizeClass,
        disabled ? 'opacity-40 cursor-not-allowed' : mergeClassNames('cursor-pointer', activeClass),
        tone,
        className,
      )}
    >
      {showIcon && <Copy className="w-3 h-3 shrink-0" />}
      {idleLabel && (
        <span className="relative inline-grid min-w-0">
          <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
            {reserveLabel}
          </span>
          <span className="col-start-1 row-start-1">{labels[status]}</span>
        </span>
      )}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {status === 'copied' ? 'Copied to clipboard' : status === 'failed' ? 'Copy failed' : ''}
      </span>
    </button>
  );
});
