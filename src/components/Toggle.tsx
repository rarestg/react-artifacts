import { type KeyboardEvent, type ReactNode, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type ToggleProps = {
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
  const rootRef = useRef<HTMLLabelElement>(null);
  const resolvedReserveLabel = reserveLabel ?? label;

  useArtifactThemeGuard('Toggle', rootRef);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onCheckedChange(!checked);
    }
  };

  const trackTone = checked
    ? 'border-[color:var(--toggle-track-on-border)] bg-[var(--toggle-track-on-bg)]'
    : 'border-[color:var(--toggle-track-off-border)] bg-[var(--toggle-track-off-bg)]';
  const knobTone = checked ? 'bg-[var(--toggle-knob-on-bg)]' : 'bg-[var(--toggle-knob-off-bg)]';
  const trackFocus =
    focusTarget === 'track'
      ? mergeClassNames(
          'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)]',
          'peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-[color:var(--surface)]',
        )
      : '';

  return (
    <label
      ref={rootRef}
      className={mergeClassNames(
        'inline-flex items-center gap-3 select-none py-1',
        focusTarget === 'container' && 'relative',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      )}
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
        data-state={checked ? 'on' : 'off'}
        className={mergeClassNames(
          'sharp-toggle transition-colors motion-reduce:transition-none',
          trackFocus,
          checked
            ? !disabled && 'active:bg-[var(--primary-active)]'
            : !disabled && 'hover:border-[color:var(--border-strong)] active:bg-[var(--surface-pressed)]',
          trackTone,
          trackClassName,
        )}
      >
        <span className={mergeClassNames('sharp-toggle__knob', knobTone, knobClassName)} />
      </span>
      <span className={mergeClassNames('relative inline-grid min-w-0 text-sm text-[var(--text)]', labelClassName)}>
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          {resolvedReserveLabel}
        </span>
        <span className="col-start-1 row-start-1 min-w-0 truncate">{label}</span>
      </span>
      {suffix}
    </label>
  );
}
