import { Check } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';

type CheckboxProps = {
  label: string;
  reserveLabel?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  focusTarget?: 'box' | 'container';
  size?: 'sm' | 'md';
  className?: string;
  labelClassName?: string;
  boxClassName?: string;
  checkClassName?: string;
  suffix?: ReactNode;
};

export function Checkbox({
  label,
  reserveLabel,
  checked,
  onCheckedChange,
  disabled = false,
  focusTarget = 'box',
  size = 'md',
  className,
  labelClassName,
  boxClassName,
  checkClassName,
  suffix,
}: CheckboxProps) {
  const resolvedReserveLabel = reserveLabel ?? label;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onCheckedChange(!checked);
    }
  };

  const boxTone = checked
    ? 'bg-[var(--checkbox-on-bg)] border-[color:var(--checkbox-on-border)]'
    : 'bg-[var(--checkbox-off-bg)] border-[color:var(--checkbox-off-border)]';
  const boxSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const checkSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';
  const boxFocus =
    focusTarget === 'box'
      ? [
          'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)]',
          'peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-[color:var(--surface)]',
        ].join(' ')
      : '';

  return (
    <label
      className={[
        'inline-flex items-center gap-2 cursor-pointer select-none py-1',
        focusTarget === 'container' ? 'relative' : '',
        disabled && 'opacity-50 pointer-events-none cursor-not-allowed',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="peer sr-only"
      />
      {focusTarget === 'container' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[1px] ring-2 ring-[var(--ring)] ring-offset-1 ring-offset-[color:var(--surface)] opacity-0 peer-focus-visible:opacity-100"
        />
      )}
      <span
        className={[
          'flex shrink-0 items-center justify-center border rounded-none transition-colors motion-reduce:transition-none',
          boxSize,
          boxFocus,
          checked
            ? 'active:bg-[var(--checkbox-on-bg)]'
            : 'hover:border-[color:var(--border-strong)] active:bg-[var(--surface-strong)]',
          boxTone,
          boxClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {checked && (
          <Check className={['text-[var(--primary-contrast)]', checkSize, checkClassName].filter(Boolean).join(' ')} />
        )}
      </span>
      <span
        className={['relative inline-grid min-w-0 text-sm text-[var(--text)]', labelClassName]
          .filter(Boolean)
          .join(' ')}
      >
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          {resolvedReserveLabel}
        </span>
        <span className="col-start-1 row-start-1 min-w-0 truncate">{label}</span>
      </span>
      {suffix}
    </label>
  );
}
