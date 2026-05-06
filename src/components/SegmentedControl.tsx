import { type CSSProperties, useMemo, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type SegmentedControlTone = 'neutral' | 'accent';
export type SegmentedControlSize = 'compact' | 'default';

export type SegmentedControlOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  reserveLabel?: string;
  disabled?: boolean;
  title?: string;
};

export type SegmentedControlProps<TValue extends string = string> = {
  ariaLabel: string;
  value: TValue;
  onValueChange: (value: TValue) => void;
  options: readonly SegmentedControlOption<TValue>[];
  tone?: SegmentedControlTone;
  size?: SegmentedControlSize;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  optionClassName?: string;
  style?: CSSProperties;
};

export function SegmentedControl<TValue extends string = string>({
  ariaLabel,
  value,
  onValueChange,
  options,
  tone = 'neutral',
  size = 'default',
  fullWidth = false,
  disabled = false,
  className,
  optionClassName,
  style,
}: SegmentedControlProps<TValue>) {
  const rootRef = useRef<HTMLFieldSetElement>(null);

  useArtifactThemeGuard('SegmentedControl', rootRef);

  const defaultReserveLabel = useMemo(
    () => options.reduce((longest, option) => (option.label.length > longest.length ? option.label : longest), ''),
    [options],
  );

  const sizeClass: Record<SegmentedControlSize, string> = {
    compact: 'h-6 px-2 text-xs font-medium',
    default: 'h-8 px-2 text-xs font-medium',
  };
  const selectedTone: Record<SegmentedControlTone, string> = {
    neutral: 'border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--text)]',
    accent: 'border-[color:var(--accent)] bg-[var(--accent-weak)] text-[var(--accent)]',
  };
  const inactiveTone: Record<SegmentedControlTone, string> = {
    neutral: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
    accent: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
  };
  const inactiveInteractive: Record<SegmentedControlTone, string> = {
    neutral: 'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)]',
    accent: 'hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)] active:bg-[var(--surface-pressed)]',
  };

  return (
    <fieldset
      ref={rootRef}
      aria-label={ariaLabel}
      disabled={disabled}
      style={style}
      className={mergeClassNames(
        'm-0 min-w-0 [min-inline-size:0] border-0 p-0',
        fullWidth ? 'flex w-full' : 'inline-flex',
        disabled && 'opacity-50',
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const optionDisabled = disabled || option.disabled;
        const reserveLabel = option.reserveLabel ?? defaultReserveLabel;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={optionDisabled}
            title={option.title}
            onClick={() => onValueChange(option.value)}
            className={mergeClassNames(
              'relative inline-flex min-w-0 shrink-0 items-center justify-center border transition-colors motion-reduce:transition-none rounded-none',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)] focus-visible:z-20',
              sizeClass[size],
              fullWidth && 'flex-1',
              index > 0 && '-ml-px',
              selected ? 'z-10' : 'z-0',
              selected ? selectedTone[tone] : inactiveTone[tone],
              optionDisabled
                ? 'cursor-not-allowed'
                : mergeClassNames('cursor-pointer', !selected && inactiveInteractive[tone]),
              optionClassName,
            )}
          >
            <span className="relative inline-grid min-w-0">
              <span
                aria-hidden="true"
                className="col-start-1 row-start-1 whitespace-nowrap opacity-0 pointer-events-none"
              >
                {reserveLabel}
              </span>
              <span className="col-start-1 row-start-1 min-w-0 truncate">{option.label}</span>
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
