import { Popover as BasePopover } from '@base-ui/react/popover';
import type { ReactElement, ReactNode } from 'react';
import { mergeClassNames } from '../../../lib/classNames';
import { ArtifactPopoverPortal } from '../../../ui/base-portals';
import { collectionPositioner, popupSurface } from '../../../ui/recipes';

type PopoverProps = {
  trigger: ReactElement;
  children: ReactNode;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  // Popover.Popup renders role="dialog", so it needs an accessible name.
  ariaLabel?: string;
};

export const popoverActionClass =
  'w-full cursor-pointer px-2 py-1.5 text-left text-sm hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] focus:outline-none focus-visible:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]';

export function Popover({ trigger, children, open, onOpenChange, ariaLabel = 'Popover' }: PopoverProps) {
  // Base UI Popover owns the trigger wiring, open/close, Escape, outside-press, and focus return —
  // the hand-rolled keyboard/outside-click/focus logic is gone. Non-modal: no backdrop, no scroll
  // lock, matching the previous lightweight dropdown.
  return (
    <BasePopover.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <BasePopover.Trigger render={trigger} />
      <ArtifactPopoverPortal>
        <BasePopover.Positioner sideOffset={4} align="start" className={collectionPositioner}>
          <BasePopover.Popup
            aria-label={ariaLabel}
            className={mergeClassNames(popupSurface, 'min-w-[200px] outline-none')}
          >
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </ArtifactPopoverPortal>
    </BasePopover.Root>
  );
}
