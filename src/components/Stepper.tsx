import { Minus, Plus } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { focusRing, inputBase } from '../ui/recipes';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type StepperSize = 'default' | 'compact';
export type StepperLabelPosition = 'top' | 'start';

const rowSize: Record<StepperSize, string> = {
  default: 'h-8',
  compact: 'h-6',
};

const buttonSize: Record<StepperSize, string> = {
  default: 'h-8 w-7',
  compact: 'h-6 w-6',
};

// Input typography mirrors each consumer's density: roomy tabular digits vs compact medium text.
const inputSize: Record<StepperSize, string> = {
  default: 'h-8 w-14 text-sm tabular-nums',
  compact: 'h-6 w-12 text-xs font-medium',
};

const labelSize: Record<StepperSize, string> = {
  default: 'text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]',
  compact: 'text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]',
};

export type StepperProps = {
  /** Visible label text; also names the −/+ buttons ("Decrease …" / "Increase …"). */
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  size?: StepperSize;
  /** `top` stacks the label (and helper) over a centered row; `start` puts the label inline before it. */
  labelPosition?: StepperLabelPosition;
  /** Append a "Max" button that jumps straight to `max`. */
  maxButton?: boolean;
  helperText?: string;
  className?: string;
};

/**
 * Numeric stepper: −/+ buttons around a clamped number input with native spinners hidden.
 *
 * Draft-then-commit semantics: typing edits a local draft that only live-commits while it is a
 * whole number within range; blur or Enter commits the clamped value, and an empty draft reverts
 * to the current value. The −/+ (and Max) buttons commit immediately and disable at the bounds.
 */
export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onValueChange,
  disabled = false,
  size = 'default',
  labelPosition = 'top',
  maxButton = false,
  helperText,
  className,
}: StepperProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useArtifactThemeGuard('Stepper', rootRef);

  const inputId = useId();
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));
  const commit = () => {
    const parsed = draft.trim() === '' ? value : Number(draft);
    const next = Number.isFinite(parsed) ? clamp(parsed) : value;
    setDraft(String(next));
    onValueChange(next);
  };
  const stepBy = (direction: -1 | 1) => {
    const next = clamp(value + direction * step);
    setDraft(String(next));
    onValueChange(next);
  };

  const buttonClass = mergeClassNames(
    'inline-flex shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
    'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] disabled:cursor-not-allowed disabled:opacity-50',
    !disabled && 'cursor-pointer',
    focusRing,
    buttonSize[size],
  );

  return (
    <div
      ref={rootRef}
      className={mergeClassNames(
        labelPosition === 'top' ? 'flex flex-col items-center gap-1' : 'inline-flex min-w-0 items-center gap-2',
        className,
      )}
    >
      <label htmlFor={inputId} className={labelSize[size]}>
        {label}
      </label>
      <div
        className={mergeClassNames(
          'inline-flex items-center',
          rowSize[size],
          labelPosition === 'top' ? 'w-fit' : 'min-w-0',
        )}
      >
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={disabled || value <= min}
          onClick={() => stepBy(-1)}
          className={buttonClass}
        >
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={draft}
          disabled={disabled}
          onChange={(event) => {
            const next = event.currentTarget.value;
            setDraft(next);
            // Guard the empty draft explicitly: Number('') is 0, which would live-commit on min<=0.
            if (next.trim() === '') return;
            const parsed = Number(next);
            if (Number.isInteger(parsed) && parsed >= min && parsed <= max) onValueChange(parsed);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
          }}
          className={mergeClassNames(
            '-ml-px border border-[var(--border)] bg-[var(--surface)] px-1 text-center text-[var(--text)]',
            inputSize[size],
            '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'focus:outline-none focus-visible:z-10 focus-visible:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
          )}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={disabled || value >= max}
          onClick={() => stepBy(1)}
          className={mergeClassNames(buttonClass, '-ml-px')}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        {maxButton && Number.isFinite(max) && (
          <button
            type="button"
            aria-label={`Set to maximum, ${max}`}
            title={`Set to maximum, ${max}`}
            disabled={disabled || value >= max}
            onClick={() => {
              setDraft(String(max));
              onValueChange(max);
            }}
            className={mergeClassNames(
              'inline-flex shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-medium text-[var(--text-muted)]',
              'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] disabled:cursor-not-allowed disabled:opacity-50',
              !disabled && 'cursor-pointer',
              '-ml-px',
              rowSize[size],
              focusRing,
            )}
          >
            Max
          </button>
        )}
      </div>
      {helperText && <p className={mergeClassNames(inputBase.helper, 'text-center')}>{helperText}</p>}
    </div>
  );
}
