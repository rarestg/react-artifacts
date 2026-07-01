import { type HTMLAttributes, type Ref, useCallback, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { assignRef } from '../lib/refs';
import { type PanelVariant, panel } from '../ui/recipes';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type { PanelVariant };

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

  return (
    <div ref={setRef} className={mergeClassNames(panel[variant], className)} {...props}>
      {children}
    </div>
  );
}
