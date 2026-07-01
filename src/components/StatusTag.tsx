import { type ReactNode, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { status } from '../ui/recipes';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type StatusTagProps = {
  label: string;
  reserveLabel?: string;
  active?: boolean;
  icon?: ReactNode;
  helper?: ReactNode;
  showState?: boolean;
  className?: string;
};

export function StatusTag({
  label,
  reserveLabel,
  active = true,
  icon,
  helper,
  showState = true,
  className,
}: StatusTagProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const resolvedReserveLabel = reserveLabel ?? label;

  useArtifactThemeGuard('StatusTag', rootRef);

  return (
    <span
      ref={rootRef}
      className={mergeClassNames(status.root, active ? status.rootActive : status.rootInactive, className)}
    >
      {icon && <span className={`shrink-0 ${active ? status.iconActive : status.iconInactive}`}>{icon}</span>}
      <span
        className={mergeClassNames(status.dot, active ? status.dotActive : status.dotInactive)}
        aria-hidden="true"
      />
      <span className="relative inline-grid min-w-0">
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          {resolvedReserveLabel}
        </span>
        <span className="col-start-1 row-start-1 min-w-0 truncate">{label}</span>
      </span>
      {helper && <span className="sr-only">{helper}</span>}
      {showState && <span className="sr-only">{active ? 'On' : 'Off'}</span>}
    </span>
  );
}
