import type { ReactNode } from 'react';

type SectionCols = 1 | 2 | 3;

type SectionProps = {
  title: string;
  children: ReactNode;
  cols?: SectionCols;
};

const colsClass: Record<SectionCols, string> = {
  1: '',
  2: 'grid grid-cols-[repeat(auto-fit,minmax(min(18rem,100%),1fr))] gap-6',
  3: 'grid grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),1fr))] gap-6',
};

export function Section({ title, children, cols = 1 }: SectionProps) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</h2>
      </div>
      <div className={`p-6 ${colsClass[cols] ?? ''}`}>{children}</div>
    </div>
  );
}
