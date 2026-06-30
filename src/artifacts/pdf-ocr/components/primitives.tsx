import { AlertTriangle, Check, Minus, Plus, X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useState } from 'react';
import { mergeClassNames } from '../../../lib/classNames';

/** Tokenized keyboard-focus ring shared by every locally-built control in this artifact. */
export const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]';

/** Padding for every full-width band inside the guided-flow shell. */
export const bandClass = 'px-4 py-4';
export const bandLabelClass = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]';
export const helperClass = 'text-xs text-[var(--text-muted)]';

/** mm:ss from milliseconds, tabular-friendly and zero-padded. */
export function formatMmSs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Human file size (B / KB / MB) for the loaded-document row. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

export type ChipTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const chipToneClass: Record<ChipTone, string> = {
  neutral: 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]',
  accent: 'border-[color:var(--accent)] bg-[var(--accent-weak)] text-[var(--accent-text)]',
  success: 'border-[color:var(--success)] bg-[var(--success-weak)] text-[var(--success-text)]',
  warning: 'border-[color:var(--warning)] bg-[var(--warning-weak)] text-[var(--warning-text)]',
  danger: 'border-[color:var(--danger)] bg-[var(--danger-weak)] text-[var(--danger-text)]',
};

/**
 * A status chip whose label width is reserved (via an invisible widest-label span) so the surrounding
 * layout never shifts when the label changes between states.
 */
export function StateChip({
  label,
  reserveLabel,
  tone = 'neutral',
  icon,
  className,
}: {
  label: string;
  reserveLabel?: string;
  tone?: ChipTone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={mergeClassNames(
        'inline-flex items-center gap-1.5 border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] leading-none',
        chipToneClass[tone],
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="relative inline-grid min-w-0">
        <span aria-hidden="true" className="col-start-1 row-start-1 whitespace-nowrap opacity-0 pointer-events-none">
          {reserveLabel ?? label}
        </span>
        <span className="col-start-1 row-start-1 min-w-0 truncate">{label}</span>
      </span>
    </span>
  );
}

export type PageState = 'ok' | 'suspect' | 'failed';

/**
 * Tri-state page mark. Each state differs by SHAPE + ICON, never color alone:
 * ok = filled square + check, suspect = triangle, failed = outlined square + ✕.
 */
export function PageStateMark({ state, className }: { state: PageState; className?: string }) {
  if (state === 'ok') {
    return (
      <span
        aria-hidden="true"
        className={mergeClassNames(
          'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center bg-[var(--success)] text-[var(--surface)]',
          className,
        )}
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === 'suspect') {
    return (
      <AlertTriangle
        aria-hidden="true"
        className={mergeClassNames('h-3.5 w-3.5 shrink-0 text-[var(--warning)]', className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={mergeClassNames(
        'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center border border-[color:var(--danger)] text-[var(--danger)]',
        className,
      )}
    >
      <X className="h-2.5 w-2.5" strokeWidth={3} />
    </span>
  );
}

/** Labeled tri-state chip for a flagged-row badge ("SUSPECT · kept" / "FAILED"). */
export function PageStateChip({ state }: { state: 'suspect' | 'failed' }) {
  const tone: ChipTone = state === 'suspect' ? 'warning' : 'danger';
  const label = state === 'suspect' ? 'SUSPECT · kept' : 'FAILED';
  return (
    <span
      className={mergeClassNames(
        'inline-flex items-center gap-1 border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] leading-none',
        chipToneClass[tone],
      )}
    >
      <PageStateMark state={state} className="h-3 w-3" />
      {label}
    </span>
  );
}

/**
 * Progress bar with a NEUTRAL or accent fill — never green-on-done. The verdict lives in the state
 * chip and the ok/suspect/failed counts, so the bar only conveys "how far", not "good vs bad".
 */
export function ProgressBar({
  value,
  max,
  tone = 'accent',
  label,
}: {
  value: number;
  max: number;
  tone?: 'accent' | 'neutral';
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const fill = tone === 'accent' ? 'bg-[var(--accent)]' : 'bg-[var(--text-subtle)]';
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className="h-2.5 w-full border border-[var(--border)] bg-[var(--surface-strong)]"
    >
      <div className={mergeClassNames('h-full', fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Numeric stepper: lucide −/+ buttons around a clamped number input with native spinners hidden. */
export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  suffix?: string;
}) {
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
    onChange(next);
  };
  const stepBy = (direction: -1 | 1) => {
    const next = clamp(value + direction * step);
    setDraft(String(next));
    onChange(next);
  };

  const buttonClass = mergeClassNames(
    'inline-flex w-7 shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
    'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] disabled:cursor-not-allowed disabled:opacity-50',
    !disabled && 'cursor-pointer',
    focusRing,
  );

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className={bandLabelClass}>
        {label}
      </label>
      <div className="inline-flex h-8 w-fit items-center">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={disabled || value <= min}
          onClick={() => stepBy(-1)}
          className={mergeClassNames(buttonClass, 'h-8')}
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
          aria-label={label}
          onChange={(event) => {
            const next = event.currentTarget.value;
            setDraft(next);
            const parsed = Number(next);
            if (Number.isInteger(parsed) && parsed >= min && parsed <= max) onChange(parsed);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
          }}
          className={mergeClassNames(
            '-ml-px h-8 w-14 border border-[var(--border)] bg-[var(--surface)] px-1 text-center text-sm text-[var(--text)] tabular-nums',
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
          className={mergeClassNames(buttonClass, '-ml-px h-8')}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        {suffix && <span className="ml-2 text-xs text-[var(--text-muted)]">{suffix}</span>}
      </div>
    </div>
  );
}
