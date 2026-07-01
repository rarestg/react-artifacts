import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { type ReactNode, type RefObject, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { ArtifactDialogPortal } from '../ui/base-portals';
import { popupOverlay, popupSurface } from '../ui/recipes';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type ArtifactDialogPlacement = 'viewport' | 'contained';
export type ArtifactDialogAlign = 'start' | 'center';

export type ArtifactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  container?: HTMLElement | null;
  placement?: ArtifactDialogPlacement;
  align?: ArtifactDialogAlign;
  overlayClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusTo?: HTMLElement | null;
  fallbackFocusTo?: HTMLElement | null;
};

const placementClass: Record<ArtifactDialogPlacement, string> = {
  viewport: 'fixed inset-0',
  contained: 'absolute inset-0',
};

const alignClass: Record<ArtifactDialogAlign, string> = {
  start: 'items-start',
  center: 'items-center',
};

const closeButtonClass =
  'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center border border-transparent bg-transparent text-[var(--text-muted)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] active:bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]';

export function ArtifactDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel = 'Close',
  container,
  placement = 'viewport',
  align = 'start',
  overlayClassName,
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  initialFocusRef,
  returnFocusTo,
  fallbackFocusTo,
}: ArtifactDialogProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const positionClass = placementClass[placement];
  const verticalAlignClass = alignClass[align];

  useArtifactThemeGuard('ArtifactDialog', open ? contentRef : undefined);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <ArtifactDialogPortal container={container}>
        <Dialog.Backdrop className={mergeClassNames(positionClass, 'z-40', popupOverlay, overlayClassName)} />
        <Dialog.Viewport
          className={mergeClassNames(
            positionClass,
            verticalAlignClass,
            'pointer-events-none z-50 flex justify-center overflow-y-auto p-4',
          )}
        >
          <Dialog.Popup
            ref={contentRef}
            initialFocus={() => initialFocusRef?.current ?? titleRef.current}
            finalFocus={() =>
              returnFocusTo?.isConnected ? returnFocusTo : fallbackFocusTo?.isConnected ? fallbackFocusTo : true
            }
            className={mergeClassNames(
              popupSurface,
              'pointer-events-auto flex max-h-[calc(100%-2rem)] w-full max-w-[42rem] flex-col',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
              contentClassName,
            )}
          >
            <header
              className={mergeClassNames(
                'flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3',
                headerClassName,
              )}
            >
              <div className="min-w-0 space-y-1">
                <Dialog.Title ref={titleRef} tabIndex={-1} className="text-base font-semibold text-[var(--text)]">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="text-xs leading-5 text-[var(--text-muted)]">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close
                render={
                  <button type="button" aria-label={closeLabel} className={closeButtonClass}>
                    <X className="size-4" aria-hidden="true" />
                  </button>
                }
              />
            </header>
            <div className={mergeClassNames('min-h-0 flex-1 overflow-y-auto px-4 py-4', bodyClassName)}>{children}</div>
            {footer && (
              <footer className={mergeClassNames('border-t border-[var(--border)] px-4 py-3', footerClassName)}>
                {footer}
              </footer>
            )}
          </Dialog.Popup>
        </Dialog.Viewport>
      </ArtifactDialogPortal>
    </Dialog.Root>
  );
}
