import type { ReactNode } from 'react';

type SubSectionProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function SubSection({ label, children, className }: SubSectionProps) {
  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-subtle)]">{label}</div>
      {children}
    </div>
  );
}
