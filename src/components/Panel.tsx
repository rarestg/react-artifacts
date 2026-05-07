import { type HTMLAttributes, type Ref, useCallback, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { assignRef } from '../lib/refs';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type PanelVariant = 'default' | 'muted' | 'dashed';

export type PanelProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
  variant?: PanelVariant;
};

export function Panel({ ref, children, variant = 'default', className, ...props }: PanelProps) {
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
}
