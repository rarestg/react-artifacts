import { type HTMLAttributes, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type TagVariant = 'base' | 'muted' | 'solid';

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: TagVariant;
};

export function Tag({ children, variant = 'base', className, ...props }: TagProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  useArtifactThemeGuard('Tag', rootRef);

  const variants: Record<TagVariant, string> = {
    base: 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
    muted: 'border border-transparent bg-[var(--surface-strong)] text-[var(--text-muted)]',
    solid: 'border border-transparent bg-[var(--primary)] text-[var(--primary-contrast)]',
  };

  return (
    <span
      ref={rootRef}
      className={mergeClassNames(
        'inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-none',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
