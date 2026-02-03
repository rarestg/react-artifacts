import { Check as CheckIcon } from 'lucide-react';
import type { ChangeEventHandler, ReactNode } from 'react';

type CheckboxLayout = 'inline' | 'between';

type CheckboxProps = {
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  label?: ReactNode;
  reserveLabel?: string;
  layout?: CheckboxLayout;
  className?: string;
  ariaLabel?: string;
};

export default function Checkbox({
  checked,
  onChange,
  disabled = false,
  label,
  reserveLabel,
  layout = 'inline',
  className,
  ariaLabel,
}: CheckboxProps) {
  const wrapperClass =
    layout === 'between' ? 'flex min-w-0 items-center justify-between gap-3' : 'inline-flex items-center gap-2';
  const labelText = typeof label === 'string' ? label : null;
  const resolvedAriaLabel = ariaLabel ?? labelText ?? undefined;
  const resolvedReserveLabel = reserveLabel ?? labelText ?? '';

  if (import.meta.env.DEV && !label && !ariaLabel) {
    // eslint-disable-next-line no-console
    console.warn('Checkbox: provide either `label` or `ariaLabel` for an accessible name.');
  }

  return (
    <label
      className={[
        wrapperClass,
        'cursor-pointer select-none py-1 text-sm text-[var(--text-muted)]',
        disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {layout === 'between' && <div className="min-w-0 flex-1">{label}</div>}
      <span
        className={[
          'h-4 w-4 shrink-0 border flex items-center justify-center',
          'transition-colors motion-reduce:transition-none',
          'focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:ring-offset-1 focus-within:ring-offset-[var(--surface)]',
          checked
            ? 'bg-[var(--accent)] border-[var(--accent)]'
            : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {checked && <CheckIcon className="h-3 w-3 text-white" />}
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-label={resolvedAriaLabel}
          className="sr-only"
        />
      </span>
      {layout === 'inline' && labelText && (
        <span className="relative inline-grid min-w-0">
          <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
            {resolvedReserveLabel}
          </span>
          <span className="col-start-1 row-start-1 min-w-0 truncate">{labelText}</span>
        </span>
      )}
      {layout === 'inline' && !labelText && label}
    </label>
  );
}
