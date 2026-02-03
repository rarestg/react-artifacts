import type { ReactNode } from 'react';

type StatusTagProps = {
  label: string;
  reserveLabel?: string;
  active?: boolean;
  icon?: ReactNode;
  helper?: ReactNode;
  showState?: boolean;
  className?: string;
};

export default function StatusTag({
  label,
  reserveLabel,
  active = true,
  icon,
  helper,
  showState = true,
  className,
}: StatusTagProps) {
  const resolvedReserveLabel = reserveLabel ?? label;

  return (
    <span
      className={[
        'inline-flex items-center gap-2 border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] leading-none',
        'transition-[background-color,color,border-color] motion-reduce:transition-none',
        active
          ? 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]'
          : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <span className={`shrink-0 ${active ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{icon}</span>}
      <span
        className={[
          'h-2 w-2 shrink-0 border',
          active ? 'border-[color:var(--success)] bg-[var(--success)]' : 'border-[var(--border-strong)] bg-transparent',
        ].join(' ')}
        aria-hidden="true"
      />
      <span className="relative inline-grid min-w-0">
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          {resolvedReserveLabel}
        </span>
        <span className="col-start-1 row-start-1 min-w-0 truncate">{label}</span>
      </span>
      {helper && <span className="sr-only">{helper}</span>}
      {showState && <span className="sr-only">{active ? 'On' : 'Off'}</span>}
    </span>
  );
}
