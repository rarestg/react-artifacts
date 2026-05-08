import { type Ref, useCallback, useImperativeHandle, useMemo } from 'react';
import { mergeClassNames } from '../../../lib/classNames';
import { useCopyToClipboard } from '../../../lib/useCopyToClipboard';

type CopyStatus = 'idle' | 'copied' | 'failed';

export type CopyButtonHandle = {
  copy: () => void;
};

type CopyButtonProps = {
  ref?: Ref<CopyButtonHandle>;
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

function CopyButton({
  ref,
  text,
  idleLabel = DEFAULT_LABELS.idle,
  successLabel = DEFAULT_LABELS.copied,
  failureLabel = DEFAULT_LABELS.failed,
  className,
  disabled,
}: CopyButtonProps) {
  const { status, copy, announcement } = useCopyToClipboard();

  const labels = useMemo(
    () => ({ idle: idleLabel, copied: successLabel, failed: failureLabel }),
    [idleLabel, successLabel, failureLabel],
  );
  const reserveLabel = useMemo(() => {
    const labelList = [idleLabel, successLabel, failureLabel];
    return labelList.reduce((longest, current) => (current.length > longest.length ? current : longest), labelList[0]);
  }, [idleLabel, successLabel, failureLabel]);

  const handleCopy = useCallback(async () => {
    if (disabled) return;
    await copy(text);
  }, [copy, disabled, text]);

  useImperativeHandle(ref, () => ({ copy: handleCopy }), [handleCopy]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      className={mergeClassNames(
        'inline-grid items-center border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]',
        'hover:bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--surface)]',
        !disabled && 'cursor-pointer',
        className,
      )}
    >
      <span className="col-start-1 row-start-1 opacity-0" aria-hidden>
        {reserveLabel}
      </span>
      <span className="col-start-1 row-start-1">{labels[status]}</span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </button>
  );
}

export default CopyButton;
