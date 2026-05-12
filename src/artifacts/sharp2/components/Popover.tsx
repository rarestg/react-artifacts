import {
  type AriaAttributes,
  cloneElement,
  isValidElement,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
} from 'react';
import { assignRef } from '../../../lib/refs';

type PopoverTriggerProps = {
  ref?: Ref<HTMLElement>;
  onClick?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
} & AriaAttributes;

type PopoverProps = {
  trigger: ReactElement<PopoverTriggerProps>;
  children: ReactNode;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
};

export const popoverActionClass =
  'w-full cursor-pointer px-2 py-1.5 text-left text-sm hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] focus:outline-none focus-visible:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]';

export function Popover({ trigger, children, open, onOpenChange }: PopoverProps) {
  const popoverId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const triggerRefProp = isValidElement(trigger) ? trigger.props.ref : undefined;

  const setTriggerRef = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      assignRef(triggerRefProp, node);
    },
    [triggerRefProp],
  );

  const closePopover = useEffectEvent((restoreFocus: boolean) => {
    onOpenChange(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  });

  const handleTriggerKeyDown: KeyboardEventHandler<HTMLElement> = (event) => {
    if (event.currentTarget instanceof HTMLButtonElement) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenChange(!open);
    }
  };

  const triggerNode = isValidElement(trigger)
    ? cloneElement(trigger, {
        ref: setTriggerRef,
        onClick: (event) => {
          trigger.props.onClick?.(event);
          if (!event.defaultPrevented) {
            onOpenChange(!open);
          }
        },
        onKeyDown: (event) => {
          trigger.props.onKeyDown?.(event);
          if (!event.defaultPrevented) {
            handleTriggerKeyDown(event);
          }
        },
        'aria-expanded': open,
        'aria-controls': popoverId,
      } as Partial<PopoverTriggerProps> & { ref: (node: HTMLElement | null) => void })
    : null;

  useEffect(() => {
    if (!open) return;
    popupRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        closePopover(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePopover(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={popoverRef} className="relative inline-block">
      {triggerNode}
      {open && (
        <div
          id={popoverId}
          ref={popupRef}
          className="absolute left-0 top-full z-10 mt-1 min-w-[200px] border border-[var(--border)] bg-[var(--surface)]"
        >
          {children}
        </div>
      )}
    </div>
  );
}
