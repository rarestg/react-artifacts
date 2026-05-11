import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { type ReactNode, type RefObject, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
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
      <Dialog.Portal container={container ?? undefined}>
        <Dialog.Overlay
          className={mergeClassNames(
            positionClass,
            'pointer-events-auto z-40 bg-[color:var(--overlay)]',
            overlayClassName,
          )}
        />
        <div
          className={mergeClassNames(
            positionClass,
            verticalAlignClass,
            'pointer-events-none z-50 flex justify-center overflow-y-auto p-4',
          )}
        >
          <Dialog.Content
            ref={contentRef}
            {...(description ? {} : { 'aria-describedby': undefined })}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              (initialFocusRef?.current ?? titleRef.current)?.focus();
            }}
            onCloseAutoFocus={(event) => {
              // Radix FocusScope fires close autofocus on content unmount, so conditionally rendered dialogs still
              // restore focus even when callers remove the dialog instead of rendering an explicit closed state.
              if (returnFocusTo?.isConnected) {
                event.preventDefault();
                returnFocusTo.focus();
                return;
              }

              if (fallbackFocusTo?.isConnected) {
                event.preventDefault();
                fallbackFocusTo.focus();
              }
            }}
            className={mergeClassNames(
              'pointer-events-auto flex max-h-[calc(100%-2rem)] w-full max-w-[42rem] flex-col border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]',
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
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label={closeLabel}
                  className={
                    'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center border border-transparent bg-transparent text-[var(--text-muted)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] active:bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]'
                  }
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </Dialog.Close>
            </header>
            <div className={mergeClassNames('min-h-0 flex-1 overflow-y-auto px-4 py-4', bodyClassName)}>{children}</div>
            {footer && (
              <footer className={mergeClassNames('border-t border-[var(--border)] px-4 py-3', footerClassName)}>
                {footer}
              </footer>
            )}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
