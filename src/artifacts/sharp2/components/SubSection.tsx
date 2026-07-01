import type { ReactNode } from 'react';
import { mergeClassNames } from '../../../lib/classNames';
import { typo } from '../../../ui/recipes';

type SubSectionProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function SubSection({ label, children, className }: SubSectionProps) {
  return (
    <div className={mergeClassNames('space-y-2', className)}>
      <div className={typo.subLabel}>{label}</div>
      {children}
    </div>
  );
}
