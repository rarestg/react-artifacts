import { Check, Copy, X } from 'lucide-react';
import { type CSSProperties, type Ref, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { type CopyStatus, useCopyToClipboard } from '../lib/useCopyToClipboard';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type CopyButtonHandle = {
  copy: () => void;
};

export type CopyButtonDataAttributes = Partial<Record<`data-${string}`, string | number | boolean | undefined>>;

export type CopyButtonProps = {
  ref?: Ref<CopyButtonHandle>;
  text: string;
  idleLabel?: string;
  reserveLabel?: string;
  ariaLabel?: string;
  title?: string;
  showIcon?: boolean;
  className?: string;
  style?: CSSProperties;
  dataAttributes?: CopyButtonDataAttributes;
  disabled?: boolean;
  variant?: 'default' | 'headerAction' | 'icon' | 'headerText' | 'tag';
};

const COPIED_LABEL = 'Copied';
const FAILED_LABEL = 'Failed';

export function CopyButton({
  ref,
  text,
  idleLabel = 'Copy',
  reserveLabel: reserveLabelOverride,
  ariaLabel,
  title,
  showIcon = true,
  className,
  style,
  dataAttributes,
  disabled,
  variant = 'default',
}: CopyButtonProps) {
  const { status, copy, announcement } = useCopyToClipboard();
  const rootRef = useRef<HTMLButtonElement>(null);
  const resolvedAriaLabel = ariaLabel?.trim() || idleLabel.trim() || 'Copy';
  const resolvedTitle = title?.trim() || resolvedAriaLabel;

  useArtifactThemeGuard('CopyButton', rootRef);

  const labels: Record<CopyStatus, string> = useMemo(
    () => ({ idle: idleLabel, copied: COPIED_LABEL, failed: FAILED_LABEL }),
    [idleLabel],
  );

  const reserveLabel = useMemo(() => {
    return [idleLabel, FAILED_LABEL, COPIED_LABEL, reserveLabelOverride]
      .filter((label): label is string => Boolean(label))
      .reduce((longest, next) => (next.length >= longest.length ? next : longest));
  }, [idleLabel, reserveLabelOverride]);

  const handleCopy = useCallback(async () => {
    if (disabled) return;
    await copy(text);
  }, [copy, disabled, text]);

  useImperativeHandle(ref, () => ({ copy: handleCopy }), [handleCopy]);

  const copiedTone =
    variant === 'tag'
      ? 'border-transparent bg-[var(--copy-success-bg)] text-[var(--copy-success-text)]'
      : 'border-[color:var(--copy-success-border)] bg-[var(--copy-success-bg)] text-[var(--copy-success-text)]';
  const failedTone =
    variant === 'tag'
      ? 'border-transparent bg-[var(--copy-fail-bg)] text-[var(--copy-fail-text)]'
      : 'border-[color:var(--copy-fail-border)] bg-[var(--copy-fail-bg)] text-[var(--copy-fail-text)]';
  const tone =
    status === 'copied'
      ? copiedTone
      : status === 'failed'
        ? failedTone
        : variant === 'tag'
          ? mergeClassNames(
              'border-transparent bg-[var(--copy-button-tag-bg,var(--surface-muted))] text-[var(--copy-button-tag-text,var(--text))]',
              !disabled && 'hover:bg-[var(--copy-button-tag-hover-bg,var(--surface))]',
            )
          : variant === 'icon' || variant === 'headerText'
            ? mergeClassNames(
                'border-transparent bg-transparent text-[var(--text-subtle)]',
                !disabled &&
                  'hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
              )
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
  const sizeClass =
    variant === 'headerAction'
      ? 'h-9 px-3 text-sm font-medium'
      : variant === 'icon'
        ? 'size-6 justify-center p-0 text-[11px] font-medium'
        : variant === 'tag'
          ? 'h-6 min-w-0 justify-center px-2 py-0 font-mono text-[10px] font-semibold'
          : variant === 'headerText'
            ? 'h-6 justify-center px-1.5 py-0 text-[10px] font-semibold normal-case'
            : 'px-2 py-1 text-[11px] font-medium';
  const activeClass =
    variant === 'headerAction'
      ? 'active:bg-[var(--surface-strong)]'
      : variant === 'icon' || variant === 'headerText' || variant === 'tag'
        ? 'active:bg-[var(--surface-pressed)]'
        : 'active:bg-[var(--copy-hover-bg)]';
  const StatusIcon = status === 'copied' ? Check : status === 'failed' ? X : Copy;
  const labelClass = variant === 'tag' ? 'col-start-1 row-start-1 truncate' : 'col-start-1 row-start-1';

  return (
    <button
      ref={rootRef}
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      aria-label={resolvedAriaLabel}
      title={resolvedTitle}
      style={style}
      {...dataAttributes}
      className={mergeClassNames(
        'pointer-events-auto inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border transition-colors motion-reduce:transition-none',
        'rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        'focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
        sizeClass,
        disabled ? 'opacity-40 cursor-not-allowed' : mergeClassNames('cursor-pointer', activeClass),
        tone,
        className,
      )}
    >
      {showIcon && <StatusIcon className="size-3 shrink-0" />}
      {idleLabel && (
        <span className="relative inline-grid min-w-0">
          <span aria-hidden="true" className={mergeClassNames(labelClass, 'opacity-0 pointer-events-none')}>
            {reserveLabel}
          </span>
          <span className={labelClass}>{labels[status]}</span>
        </span>
      )}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </button>
  );
}
