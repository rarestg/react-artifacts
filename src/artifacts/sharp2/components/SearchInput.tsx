import { Search as SearchIcon } from 'lucide-react';
import {
  type ChangeEventHandler,
  type FocusEventHandler,
  type KeyboardEventHandler,
  type ReactNode,
  useEffect,
  useId,
  useState,
} from 'react';
import { mergeClassNames } from '../../../lib/classNames';

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
  results?: SearchResult[];
  onSelect?: (result: SearchResult) => void;
  onSearch?: (value: string) => void;
  showResults?: boolean;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

const getSearchResultKey = (result: SearchResult) => {
  if (result.id) return result.id;
  return [result.title, result.subtitle, result.meta].filter(Boolean).join('::');
};

export function SearchInput({
  ariaLabel = 'Search',
  placeholder = 'Search...',
  results = [],
  onSelect,
  onSearch, // Intentionally unused; reserved for future wiring.
  showResults,
  onFocus,
  onBlur,
  value,
  onChange,
}: SearchInputProps) {
  void onSearch;
  const listboxId = useId();
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const hasSearchValue = (value ?? '').length > 0;
  const showDropdown = Boolean(showResults && (results.length > 0 || hasSearchValue));

  useEffect(() => {
    if (!showResults) {
      setActiveIndex(-1);
      return;
    }
    if (results.length === 0) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex((prev) => (prev >= 0 && prev < results.length ? prev : 0));
  }, [showResults, results.length]);

  const activeResult = activeIndex >= 0 && activeIndex < results.length ? results[activeIndex] : null;
  const activeOptionId =
    activeIndex >= 0 && activeIndex < results.length ? `${listboxId}-option-${activeIndex}` : undefined;

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!showResults) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setActiveIndex(-1);
      event.currentTarget.blur();
      return;
    }

    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      if (activeResult) {
        event.preventDefault();
        onSelect?.(activeResult);
      }
    }
  };

  return (
    <div className="relative">
      {/* Input container */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" />
        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          role="combobox"
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          className={
            'h-9 w-full border bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus-visible:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)] border-[var(--border)]'
          }
        />
      </div>

      {/* Floating dropdown - absolutely positioned */}
      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto border border-[var(--border)] bg-[var(--surface)]"
        >
          {results.length > 0 ? (
            results.map((result, index) => (
              // biome-ignore lint/a11y/useFocusableInteractive: aria-activedescendant keeps focus on the combobox input.
              <div
                key={getSearchResultKey(result)}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelect?.(result);
                }}
                className={mergeClassNames(
                  'flex w-full cursor-pointer items-center gap-3 border-b border-l-2 border-b-[color:var(--border)] px-3 py-2 text-left last:border-b-0',
                  'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)]',
                  activeIndex === index ? 'border-l-[var(--accent)] bg-[var(--surface-muted)]' : 'border-l-transparent',
                )}
              >
                {result.icon && <span className="shrink-0 text-[var(--text-subtle)]">{result.icon}</span>}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-[var(--text)]">{result.title}</div>
                  {result.subtitle && (
                    <div className="truncate text-xs text-[var(--text-subtle)]">{result.subtitle}</div>
                  )}
                </div>
                {result.meta && <span className="shrink-0 text-xs text-[var(--text-subtle)]">{result.meta}</span>}
              </div>
            ))
          ) : (
            <div className="border-t border-[var(--border)] px-3 py-3 text-xs text-[var(--text-muted)]">
              No results for "{value}".
            </div>
          )}
        </div>
      )}
    </div>
  );
}
