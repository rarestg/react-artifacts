import type { KeyboardEvent, ReactNode } from 'react';

type ToggleProps = {
  label: string;
  reserveLabel?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  focusTarget?: 'track' | 'container';
  className?: string;
  labelClassName?: string;
  trackClassName?: string;
  knobClassName?: string;
  suffix?: ReactNode;
};

export function Toggle({
  label,
  reserveLabel,
  checked,
  onCheckedChange,
  disabled = false,
  focusTarget = 'track',
  className,
  labelClassName,
  trackClassName,
  knobClassName,
  suffix,
}: ToggleProps) {
  const resolvedReserveLabel = reserveLabel ?? label;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onCheckedChange(!checked);
    }
  };

  const trackTone = checked
    ? 'border-[color:var(--toggle-track-on-border,#1e293b)] bg-[var(--toggle-track-on-bg,#1e293b)]'
    : 'border-[color:var(--toggle-track-off-border,#cbd5e1)] bg-[var(--toggle-track-off-bg,#e2e8f0)]';
  const knobTone = checked ? 'bg-[var(--toggle-knob-on-bg,#ffffff)]' : 'bg-[var(--toggle-knob-off-bg,#ffffff)]';
  const trackFocus =
    focusTarget === 'track'
      ? [
          'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring,#94a3b8)]',
          'peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-[color:var(--surface,#ffffff)]',
        ].join(' ')
      : '';

  return (
    <label
      className={[
        'inline-flex items-center gap-3 cursor-pointer select-none py-1',
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
          className="pointer-events-none absolute -inset-[1px] ring-2 ring-[var(--ring,#94a3b8)] ring-offset-1 ring-offset-[color:var(--surface,#ffffff)] opacity-0 peer-focus-visible:opacity-100"
        />
      )}
      <span
        data-state={checked ? 'on' : 'off'}
        className={[
          'sharp-toggle transition-colors motion-reduce:transition-none',
          trackFocus,
          trackTone,
          trackClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className={['sharp-toggle__knob', knobTone, knobClassName].filter(Boolean).join(' ')} />
      </span>
      <span
        className={['relative inline-grid min-w-0 text-sm text-[var(--text,#334155)]', labelClassName]
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
