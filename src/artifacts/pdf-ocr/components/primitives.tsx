import { AlertTriangle, Check, X } from 'lucide-react';
import type { ReactNode } from 'react';
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
        <span className="col-start-1 row-start-1 min-w-0 truncate text-center">{label}</span>
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
  const Icon = state === 'suspect' ? AlertTriangle : X;
  return (
    <span
      className={mergeClassNames(
        'inline-flex items-center gap-1 border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] leading-none',
        chipToneClass[tone],
      )}
    >
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0" strokeWidth={state === 'failed' ? 3 : undefined} />
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
  active = false,
}: {
  value: number;
  max: number;
  tone?: 'accent' | 'neutral';
  label?: string;
  /** When true, overlay a decorative baton that slides back and forth so a stalled run still reads as live. */
  active?: boolean;
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
      className={mergeClassNames(
        'h-2.5 w-full border border-[var(--border)] bg-[var(--surface-strong)]',
        active && 'relative overflow-hidden',
      )}
    >
      <div className={mergeClassNames('h-full', fill)} style={{ width: `${pct}%` }} />
      {active && (
        <div
          aria-hidden="true"
          className="progress-slider pointer-events-none absolute inset-y-0 left-0 w-[35%] bg-[var(--accent)] opacity-40"
        />
      )}
    </div>
  );
}
