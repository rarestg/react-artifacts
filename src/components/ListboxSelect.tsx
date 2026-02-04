import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

type ListboxOption<T extends string> = {
  value: T;
  label: string;
};

type ListboxSelectProps<T extends string> = {
  id?: string;
  value: T;
  options: ListboxOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  triggerClassName?: string;
  optionClassName?: string;
  listboxClassName?: string;
  selectedLabel?: string;
  // Ask yourself, will the user be annoyed if they have to keep re-opening this? or will they have no reason to re-open it once selected.
  closeOnSelect?: boolean;
};

export function ListboxSelect<T extends string>({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  className,
  triggerClassName,
  optionClassName,
  listboxClassName,
  selectedLabel = 'On',
  closeOnSelect = true,
}: ListboxSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : options[0];

  useArtifactThemeGuard('ListboxSelect', containerRef);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
      return;
    }

    if (options.length === 0) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);

    requestAnimationFrame(() => {
      listboxRef.current?.focus();
    });
  }, [open, selectedIndex, options.length]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selectIndex = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    if (closeOnSelect) {
      setOpen(false);
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
      return;
    }
    setActiveIndex(index);
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen((prev) => !prev);
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleListboxKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    // Escape/Tab should always work even if the list is empty.
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (options.length === 0) break;
        setActiveIndex((prev) => Math.min(options.length - 1, prev + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (options.length === 0) break;
        setActiveIndex((prev) => Math.max(0, prev - 1));
        break;
      case 'Home':
        event.preventDefault();
        if (options.length === 0) break;
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        if (options.length === 0) break;
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (options.length === 0) break;
        if (activeIndex >= 0) {
          selectIndex(activeIndex);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        requestAnimationFrame(() => {
          triggerRef.current?.focus();
        });
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const activeOptionId =
    activeIndex >= 0 && activeIndex < options.length ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className={['relative', className].filter(Boolean).join(' ')}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={[
          'flex h-9 w-full items-center justify-between gap-2 border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
          triggerClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="truncate">{selectedOption?.label ?? 'Select'}</span>
        <span className="text-[var(--text-muted)]">▾</span>
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-activedescendant={activeOptionId}
          ref={listboxRef}
          onKeyDown={handleListboxKeyDown}
          className={[
            'absolute left-0 right-0 top-full z-10 mt-1 border border-[var(--border)] bg-[var(--surface)]',
            'focus:outline-none',
            listboxClassName,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {options.map((option, index) => {
            const isActive = index === activeIndex;
            const isSelected = option.value === value;
            return (
              // Options are not independently focusable — the parent listbox manages focus via
              // aria-activedescendant and handles all keyboard interaction (Arrow keys, Enter, Space).
              // Adding tabIndex or onKeyDown here would break that pattern.
              // biome-ignore lint/a11y/useFocusableInteractive: managed by parent listbox via aria-activedescendant
              // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handling is on the parent listbox
              <div
                key={option.value}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectIndex(index)}
                className={[
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm cursor-pointer',
                  'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)]',
                  isActive && 'bg-[var(--surface-muted)]',
                  isSelected && 'border-l-2 border-l-[var(--accent)] pl-[calc(0.75rem-2px)]',
                  optionClassName,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{selectedLabel}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
