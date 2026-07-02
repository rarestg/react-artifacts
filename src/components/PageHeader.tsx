import { type ReactNode, type Ref, useCallback, useRef } from 'react';
import { assignRef } from '../lib/refs';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type PageHeaderProps = {
  ref?: Ref<HTMLElement>;
  title: string;
  subtitle?: string;
  /** Right-hand lane, rendered as a direct child of the justify-between row; the caller owns the lane element. */
  actions?: ReactNode;
};

/** The full-width artifact page header band: title, optional subtitle, right-hand action lane. */
export function PageHeader({ ref, title, subtitle, actions }: PageHeaderProps) {
  const rootRef = useRef<HTMLElement>(null);
  useArtifactThemeGuard('PageHeader', rootRef);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <header ref={setRef} className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-base font-semibold">{title}</h1>
          {subtitle && <p className="mt-1 max-w-3xl text-xs text-[var(--text-muted)]">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}
