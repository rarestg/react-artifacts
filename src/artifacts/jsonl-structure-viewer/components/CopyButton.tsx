import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';

type CopyStatus = 'idle' | 'copied' | 'failed';

export type CopyButtonHandle = {
  copy: () => void;
};

type CopyButtonProps = {
  text: string;
  idleLabel?: string;
  successLabel?: string;
  failureLabel?: string;
  className?: string;
  disabled?: boolean;
};

const DEFAULT_LABELS: Record<CopyStatus, string> = {
  idle: 'Copy',
  copied: 'Copied OK',
  failed: 'Failed',
};

const CopyButton = forwardRef<CopyButtonHandle, CopyButtonProps>(
  (
    {
      text,
      idleLabel = DEFAULT_LABELS.idle,
      successLabel = DEFAULT_LABELS.copied,
      failureLabel = DEFAULT_LABELS.failed,
      className,
      disabled,
    },
    ref,
  ) => {
    const [status, setStatus] = useState<CopyStatus>('idle');

    const labels = useMemo(
      () => ({ idle: idleLabel, copied: successLabel, failed: failureLabel }),
      [idleLabel, successLabel, failureLabel],
    );
    const reserveLabel = useMemo(() => {
      const labelList = [idleLabel, successLabel, failureLabel];
      return labelList.reduce(
        (longest, current) => (current.length > longest.length ? current : longest),
        labelList[0],
      );
    }, [idleLabel, successLabel, failureLabel]);

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

    return (
      <button
        type="button"
        onClick={handleCopy}
        disabled={disabled}
        className={[
          'inline-grid items-center border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]',
          'hover:bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
          disabled ? 'cursor-not-allowed opacity-60' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="col-start-1 row-start-1 opacity-0" aria-hidden>
          {reserveLabel}
        </span>
        <span className="col-start-1 row-start-1">{labels[status]}</span>
        <span className="sr-only" aria-live="polite">
          {status === 'copied' ? 'Copied to clipboard.' : status === 'failed' ? 'Copy failed.' : ''}
        </span>
      </button>
    );
  },
);

CopyButton.displayName = 'CopyButton';

export default CopyButton;
