import type { CSSProperties, ReactNode } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { Checkbox } from './Checkbox';

const filterCheckboxTones = {
  blue: { color: 'var(--category-blue)', weak: 'var(--category-blue-weak)' },
  green: { color: 'var(--category-green)', weak: 'var(--category-green-weak)' },
  amber: { color: 'var(--category-amber)', weak: 'var(--category-amber-weak)' },
  violet: { color: 'var(--category-violet)', weak: 'var(--category-violet-weak)' },
  red: { color: 'var(--category-red)', weak: 'var(--category-red-weak)' },
  cyan: { color: 'var(--category-cyan)', weak: 'var(--category-cyan-weak)' },
  pink: { color: 'var(--category-pink)', weak: 'var(--category-pink-weak)' },
  lime: { color: 'var(--category-lime)', weak: 'var(--category-lime-weak)' },
  metadata: { color: 'var(--text-muted)', weak: 'color-mix(in srgb, var(--text-muted) 22%, var(--surface) 78%)' },
} as const;

export type FilterCheckboxTone = keyof typeof filterCheckboxTones;

type FilterCheckboxStyle = CSSProperties & {
  '--filter-checkbox-color': string;
  '--filter-checkbox-color-weak': string;
  '--checkbox-on-bg': string;
  '--checkbox-on-border': string;
  '--checkbox-off-border': string;
};

export type FilterCheckboxProps = {
  label: string;
  reserveLabel?: string;
  count?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  tone: FilterCheckboxTone;
  borderStyle?: 'tone' | 'neutral';
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  countClassName?: string;
  checkClassName?: string;
};

export function FilterCheckbox({
  label,
  reserveLabel,
  count,
  checked,
  onCheckedChange,
  tone,
  borderStyle = 'tone',
  disabled = false,
  className,
  labelClassName,
  countClassName,
  checkClassName,
}: FilterCheckboxProps) {
  const toneTokens = filterCheckboxTones[tone];
  const toneStyle: FilterCheckboxStyle = {
    '--filter-checkbox-color': toneTokens.color,
    '--filter-checkbox-color-weak': toneTokens.weak,
    '--checkbox-on-bg': toneTokens.color,
    '--checkbox-on-border': toneTokens.color,
    '--checkbox-off-border': toneTokens.color,
  };

  return (
    <Checkbox
      size="sm"
      focusTarget="container"
      label={label}
      reserveLabel={reserveLabel ?? label}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      style={toneStyle}
      className={mergeClassNames(
        'border px-2 text-xs transition-colors motion-reduce:transition-none',
        checked
          ? mergeClassNames(
              borderStyle === 'tone' ? 'border-[color:var(--filter-checkbox-color)]' : 'border-transparent',
              'bg-[var(--filter-checkbox-color-weak)]',
            )
          : 'border-[var(--border)] bg-[var(--surface)]',
        !disabled && !checked && 'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)]',
        className,
      )}
      labelClassName={mergeClassNames(
        'text-xs',
        checked ? 'text-[var(--text)]' : 'text-[var(--text-muted)]',
        labelClassName,
      )}
      checkClassName={mergeClassNames('text-[var(--surface)] [stroke-width:4]', checkClassName)}
      // Dependent filters can omit counts when a parent chip already carries the same count.
      suffix={
        count === undefined || count === null ? undefined : (
          <span
            className={mergeClassNames(
              'min-w-4 bg-[var(--surface-strong)] px-1.5 py-0.5 text-center text-[10px] font-medium tabular-nums',
              checked ? 'text-[var(--text)]' : 'text-[var(--text-muted)]',
              countClassName,
            )}
          >
            {count}
          </span>
        )
      }
    />
  );
}
