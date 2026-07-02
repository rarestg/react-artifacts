import type { ReactNode } from 'react';
import { mergeClassNames } from '../lib/classNames';

/** Reserves the width of the widest label a slot can show, so state swaps never shift layout. */
export function ReservedWidth({
  reserve,
  className,
  contentClassName,
  children,
}: {
  reserve: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <span className={mergeClassNames('relative inline-grid', className)}>
      <span aria-hidden="true" className="col-start-1 row-start-1 whitespace-nowrap opacity-0 pointer-events-none">
        {reserve}
      </span>
      <span className={mergeClassNames('col-start-1 row-start-1', contentClassName)}>{children}</span>
    </span>
  );
}
