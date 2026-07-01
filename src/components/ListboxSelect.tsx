import { Select } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { ArtifactSelectPortal } from '../ui/base-portals';
import { collectionPopup, collectionPositioner, itemBase, itemIndicator } from '../ui/recipes';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

type ListboxOption<T extends string> = {
  value: T;
  label: string;
  /** Optional right-aligned muted annotation (e.g. a per-option cost). Plain text so it's part of the
   *  option's accessible name; omit it and the row renders exactly as before. */
  hint?: string;
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

const triggerClass =
  // Keep bracketed var() syntax here to match the repo-wide Tailwind token convention.
  'flex h-9 w-full cursor-pointer items-center justify-between gap-2 border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]';

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
  // Base UI Select closes on selection; controlling `open` lets closeOnSelect=false keep the popup
  // open after picking (so the user can sample options without re-opening).
  const [open, setOpen] = useState(false);

  useArtifactThemeGuard('ListboxSelect');

  return (
    <Select.Root
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
      open={open}
      onOpenChange={(nextOpen, details) => {
        if (!nextOpen && !closeOnSelect && details.reason === 'item-press') return;
        setOpen(nextOpen);
      }}
      // Non-modal: no scroll lock / inert, matching the previous hand-rolled listbox.
      modal={false}
    >
      <div className={className}>
        <Select.Trigger id={id} className={mergeClassNames(triggerClass, triggerClassName)}>
          <Select.Value className="min-w-0 truncate" placeholder="Select" />
          <Select.Icon className="shrink-0 text-[var(--text-muted)]">
            <ChevronDown className="size-4" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
      </div>
      <ArtifactSelectPortal>
        <Select.Positioner
          alignItemWithTrigger={false}
          sideOffset={4}
          className={mergeClassNames(collectionPositioner, listboxClassName)}
        >
          <Select.Popup aria-label={ariaLabel} className={collectionPopup}>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={mergeClassNames(itemBase, optionClassName)}
              >
                <Select.ItemText className="min-w-0 truncate">{option.label}</Select.ItemText>
                <span className="ml-auto flex shrink-0 items-center gap-2">
                  {option.hint && (
                    <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">{option.hint}</span>
                  )}
                  <Select.ItemIndicator className={itemIndicator}>
                    <Check className="size-3.5" aria-hidden="true" />
                    <span className="text-[10px] uppercase tracking-[0.2em]">{selectedLabel}</span>
                  </Select.ItemIndicator>
                </span>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </ArtifactSelectPortal>
    </Select.Root>
  );
}
