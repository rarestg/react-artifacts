import type { ReactNode } from 'react';
import { mergeClassNames } from '../lib/classNames';

/**
 * Shared layout primitives for artifact demo layouts.
 *
 * One spacing system: three semantic gap tiers instead of ad-hoc `gap-N` / `space-y-N` mixes.
 * Class maps are literal strings on purpose — Tailwind v4 only sees classes written
 * out in source, never template-built ones.
 */

type GapTier = 'row' | 'group' | 'section';

const gapClass: Record<GapTier, string> = {
  row: 'gap-2', // items inside one control cluster (checkbox list, stacked rows)
  group: 'gap-4', // sibling groups inside a section column
  section: 'gap-6', // sub-sections inside a Section body
};

type StackProps = {
  gap: GapTier;
  className?: string;
  children: ReactNode;
};

/** Vertical stack with a semantic gap tier. Gap is intentionally explicit. */
export function Stack({ gap, className, children }: StackProps) {
  return <div className={mergeClassNames('flex min-w-0 flex-col', gapClass[gap], className)}>{children}</div>;
}

type GridMin = '12rem' | '14rem' | '18rem' | '20rem';

const gridColsClass: Record<GridMin, string> = {
  '12rem': 'grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),1fr))]',
  '14rem': 'grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),1fr))]',
  '18rem': 'grid-cols-[repeat(auto-fit,minmax(min(18rem,100%),1fr))]',
  '20rem': 'grid-cols-[repeat(auto-fit,minmax(min(20rem,100%),1fr))]',
};

type GridProps = {
  /** Minimum column width before the grid wraps. */
  min?: GridMin;
  gap?: GapTier;
  className?: string;
  children: ReactNode;
};

/**
 * The responsive artifact grid: auto-fit `minmax(min(M,100%),1fr)` columns.
 * Direct children are made shrinkable (`*:min-w-0`) so text can truncate;
 * wrap a child if it genuinely needs an intrinsic min width.
 */
export function Grid({ min = '18rem', gap = 'section', className, children }: GridProps) {
  return (
    <div className={mergeClassNames('grid *:min-w-0', gridColsClass[min], gapClass[gap], className)}>{children}</div>
  );
}
