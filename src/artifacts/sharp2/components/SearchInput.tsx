import { Autocomplete } from '@base-ui/react/autocomplete';
import { Search as SearchIcon } from 'lucide-react';
import { type FocusEventHandler, type ReactNode, useRef } from 'react';
import { mergeClassNames } from '../../../lib/classNames';
import { ArtifactAutocompletePortal } from '../../../ui/base-portals';
import { collectionPopup, collectionPositioner, itemBase } from '../../../ui/recipes';

export type SearchResult = {
  id?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: ReactNode;
};

type SearchInputProps = {
  ariaLabel?: string;
  placeholder?: string;
  results?: readonly SearchResult[];
  onSelect?: (result: SearchResult) => void;
  showResults?: boolean;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  value?: string;
  onValueChange?: (value: string) => void;
};

const EMPTY_SEARCH_RESULTS: readonly SearchResult[] = [];

const getSearchResultKey = (result: SearchResult) => {
  if (result.id) return result.id;
  return [result.title, result.subtitle, result.meta].filter(Boolean).join('::');
};

export function SearchInput({
  ariaLabel = 'Search',
  placeholder = 'Search...',
  results = EMPTY_SEARCH_RESULTS,
  onSelect,
  showResults,
  onFocus,
  onBlur,
  value,
  onValueChange,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const query = value ?? '';
  // Mirror the previous gate: results float only while the field is active (showResults) and there
  // is something to show — matching rows, or a query worth an empty-state message.
  const open = Boolean(showResults && (results.length > 0 || query.length > 0));

  return (
    <Autocomplete.Root
      // Parent-owned filtering: `results` arrive pre-filtered, so items stay static (mode="none": no
      // internal filtering, and highlighting a row never rewrites the input). selectionMode is 'none'
      // and fillInputOnItemPress is on by default, so pressing a row fills the field with its title.
      mode="none"
      items={results}
      itemToStringValue={(result) => result.title}
      value={query}
      onValueChange={onValueChange}
      // Keep the first row highlighted as the query changes / pointer leaves, reproducing the old
      // auto-active-index-0 behavior; loopFocus wraps arrow navigation like the old cyclic handler.
      autoHighlight="always"
      keepHighlight
      loopFocus
      open={open}
      onOpenChange={(nextOpen, details) => {
        // The showcase derives `open` from focus (showResults), but Base UI keeps input focus on
        // Escape/outside-press; blur on close so the parent's focus state syncs. input-clear is the
        // exception: a focused, emptied field should keep showing all results.
        if (!nextOpen && details.reason !== 'input-clear') {
          inputRef.current?.blur();
        }
      }}
    >
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-subtle)]" />
        <Autocomplete.Input
          ref={inputRef}
          aria-label={ariaLabel}
          placeholder={placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          className={
            'h-9 w-full border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus-visible:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]'
          }
        />
      </div>
      <ArtifactAutocompletePortal>
        <Autocomplete.Positioner sideOffset={4} align="start" className={collectionPositioner}>
          <Autocomplete.Popup className={collectionPopup}>
            <Autocomplete.Empty className="px-3 py-3 text-xs text-[var(--text-muted)]">
              No results for "{query}".
            </Autocomplete.Empty>
            {/* aria-label names the listbox (the Popup is role=presentation in this composition). */}
            <Autocomplete.List aria-label={ariaLabel}>
              {results.map((result) => (
                <Autocomplete.Item
                  key={getSearchResultKey(result)}
                  value={result}
                  onClick={() => onSelect?.(result)}
                  // itemBase carries the sharp collection-row skin; the accent left-border tracks the
                  // highlighted (active) row here since Autocomplete keeps no persistent selection.
                  className={mergeClassNames(itemBase, 'gap-3 data-[highlighted]:border-l-[var(--accent)]')}
                >
                  {result.icon && <span className="shrink-0 text-[var(--text-subtle)]">{result.icon}</span>}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-[var(--text)]">{result.title}</div>
                    {result.subtitle && (
                      <div className="truncate text-xs text-[var(--text-subtle)]">{result.subtitle}</div>
                    )}
                  </div>
                  {result.meta && <span className="shrink-0 text-xs text-[var(--text-subtle)]">{result.meta}</span>}
                </Autocomplete.Item>
              ))}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </ArtifactAutocompletePortal>
    </Autocomplete.Root>
  );
}
