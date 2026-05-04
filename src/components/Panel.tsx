import { forwardRef, type HTMLAttributes, useCallback, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { assignRef } from '../lib/refs';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type PanelVariant = 'default' | 'muted' | 'dashed';

export type PanelProps = HTMLAttributes<HTMLDivElement> & {
  variant?: PanelVariant;
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { children, variant = 'default', className, ...props },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  useArtifactThemeGuard('Panel', rootRef);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const variants: Record<PanelVariant, string> = {
    default: 'border border-[var(--border)] bg-[var(--surface)]',
    muted: 'bg-[var(--surface-muted)]',
    dashed: 'border border-dashed border-[var(--border-strong)] bg-[var(--surface)]',
  };

  return (
    <div ref={setRef} className={mergeClassNames(variants[variant], className)} {...props}>
      {children}
    </div>
  );
});
