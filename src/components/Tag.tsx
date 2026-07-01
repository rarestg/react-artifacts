import { type HTMLAttributes, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { badge, type TagVariant } from '../ui/recipes';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type { TagVariant };

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: TagVariant;
};

export function Tag({ children, variant = 'base', className, ...props }: TagProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  useArtifactThemeGuard('Tag', rootRef);

  return (
    <span ref={rootRef} className={mergeClassNames(badge.base, badge.variant[variant], className)} {...props}>
      {children}
    </span>
  );
}
