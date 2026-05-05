import type { ReactNode } from 'react';
import { mergeClassNames } from '../../../lib/classNames';

type SubSectionProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function SubSection({ label, children, className }: SubSectionProps) {
  return (
    <div className={mergeClassNames('space-y-2', className)}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-subtle)]">{label}</div>
      {children}
    </div>
  );
}
