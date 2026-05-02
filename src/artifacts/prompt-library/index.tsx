import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import { Search, X } from 'lucide-react';
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { Checkbox } from '../../components/Checkbox';
import { CopyButton } from '../../components/CopyButton';
import { getPlatformShortcutHint } from '../../lib/keyboardShortcutHint';
import {
  getPromptTag,
  type PromptEntry,
  type PromptTagColorId,
  type PromptTagId,
  prompts,
  promptTags,
} from './prompts';
import {
  filterPromptsByTags,
  getHighlightedSegments,
  getMatchForKey,
  type PromptSearchResult,
  pickResultSnippet,
  searchPrompts,
} from './search';

const rootClass = 'relative min-h-screen overflow-hidden bg-[var(--surface-muted)] text-[var(--text)]';
const panelClass = 'border border-[var(--border)] bg-[var(--surface)]';
const focusClass =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]';
const shortcutKeyClass =
  'inline-flex h-5 min-w-5 items-center justify-center border border-[var(--border)] bg-[var(--surface)] px-1.5 font-mono text-[10px] font-semibold leading-none text-[var(--text-muted)]';
// The command glyph has more internal whitespace than Latin letters; size it optically so it balances with "K".
const commandGlyphClass = 'text-[13px]';

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

type HighlightIndices = readonly (readonly [number, number])[];

type PromptTagColorStyle = CSSProperties & {
  '--prompt-tag-color': string;
  '--prompt-tag-color-weak': string;
  '--checkbox-on-bg': string;
  '--checkbox-on-border': string;
  '--checkbox-off-border': string;
};

function getPromptTagColorStyle(color: PromptTagColorId): PromptTagColorStyle {
  const colorToken = `var(--category-${color})`;

  return {
    '--prompt-tag-color': colorToken,
    '--prompt-tag-color-weak': `var(--category-${color}-weak)`,
    '--checkbox-on-bg': colorToken,
    '--checkbox-on-border': colorToken,
    '--checkbox-off-border': colorToken,
  };
}

export default function PromptLibrary() {
  const [selectedTags, setSelectedTags] = useState<PromptTagId[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePrompt, setActivePrompt] = useState<PromptEntry | null>(null);
  const [activeSearchResult, setActiveSearchResult] = useState<PromptSearchResult | null>(null);
  const detailReturnFocusRef = useRef<HTMLElement | null>(null);
  const themePortalRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const searchShortcutHint = getPlatformShortcutHint('K');
  const visiblePrompts = useMemo(() => filterPromptsByTags(prompts, selectedTags), [selectedTags]);
  const searchResults = useMemo(() => searchPrompts(visiblePrompts, searchQuery), [searchQuery, visiblePrompts]);

  const openPromptDetail = (prompt: PromptEntry, opener: HTMLElement | null) => {
    detailReturnFocusRef.current = opener;
    setActiveSearchResult(null);
    setActivePrompt(prompt);
  };

  const closePromptDetail = () => {
    setActivePrompt(null);
    setActiveSearchResult(null);
  };

  const openSearchPalette = () => {
    setSearchOpen(true);
  };

  const selectSearchResult = (result: PromptSearchResult) => {
    detailReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setActiveSearchResult(result);
    setActivePrompt(result.prompt);
    setSearchOpen(false);
  };

  const toggleTag = (tag: PromptTagId, checked: boolean) => {
    setSelectedTags((current) => (checked ? [...current, tag] : current.filter((selected) => selected !== tag)));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || !(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== 'k') return;

      event.preventDefault();
      setSearchOpen((current) => !current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ArtifactThemeRoot className={rootClass}>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-semibold">Prompt Library</h1>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {visiblePrompts.length} of {prompts.length} prompts
              </p>
            </div>
            <button
              ref={searchButtonRef}
              type="button"
              aria-label={`Search (${searchShortcutHint.label})`}
              aria-keyshortcuts="Meta+K Control+K"
              onClick={openSearchPalette}
              className={[
                'inline-flex h-9 items-center gap-2 border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text)]',
                'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-strong)]',
                focusClass,
              ].join(' ')}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)]" aria-hidden="true">
                {searchShortcutHint.modifier === 'command' ? (
                  <>
                    <kbd className={shortcutKeyClass}>
                      <span className={commandGlyphClass}>⌘</span>
                    </kbd>
                    <span>+</span>
                    <kbd className={shortcutKeyClass}>{searchShortcutHint.key}</kbd>
                  </>
                ) : (
                  <>
                    <kbd className={shortcutKeyClass}>Ctrl</kbd>
                    <span>+</span>
                    <kbd className={shortcutKeyClass}>{searchShortcutHint.key}</kbd>
                  </>
                )}
              </span>
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4">
          <section className={['flex flex-wrap items-center gap-2 p-3', panelClass].join(' ')} aria-label="Prompt tags">
            {promptTags.map((tag) => {
              const checked = selectedTags.includes(tag.id);
              const tagColorStyle = getPromptTagColorStyle(tag.color);
              const count = filterPromptsByTags(prompts, [
                ...selectedTags.filter((selected) => selected !== tag.id),
                tag.id,
              ]).length;

              return (
                <Checkbox
                  key={tag.id}
                  size="sm"
                  focusTarget="container"
                  checked={checked}
                  onCheckedChange={(nextChecked) => toggleTag(tag.id, nextChecked)}
                  label={tag.label}
                  suffix={
                    <span
                      className={[
                        'font-mono text-[10px] tabular-nums',
                        checked ? 'text-[var(--text)]' : 'text-[var(--text-muted)]',
                      ].join(' ')}
                    >
                      {count}
                    </span>
                  }
                  style={tagColorStyle}
                  className={[
                    'border px-2 text-xs',
                    checked
                      ? 'border-[color:var(--prompt-tag-color)] bg-[var(--prompt-tag-color-weak)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]',
                  ].join(' ')}
                  labelClassName="text-xs"
                  checkClassName="text-[var(--surface)]"
                />
              );
            })}
          </section>

          {visiblePrompts.length ? (
            <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3">
              {visiblePrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} onOpen={(opener) => openPromptDetail(prompt, opener)} />
              ))}
            </section>
          ) : (
            <section className={['p-6 text-sm text-[var(--text-muted)]', panelClass].join(' ')}>
              No prompts match the selected tags.
            </section>
          )}
        </main>
      </div>

      {activePrompt && (
        <PromptDetailDialog
          prompt={activePrompt}
          searchResult={activeSearchResult}
          returnFocusTo={detailReturnFocusRef.current}
          fallbackFocusTo={searchButtonRef.current}
          onClose={closePromptDetail}
        />
      )}

      <div ref={themePortalRef} className="pointer-events-none absolute inset-0" />
      <PromptCommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        results={searchResults}
        container={themePortalRef.current}
        onSelectResult={selectSearchResult}
      />
    </ArtifactThemeRoot>
  );
}

function PromptCard({ prompt, onOpen }: { prompt: PromptEntry; onOpen: (opener: HTMLElement) => void }) {
  return (
    <article className={['flex min-h-56 flex-col gap-4 p-4', panelClass].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={(event) => onOpen(event.currentTarget)}
          className={['min-w-0 text-left text-sm font-semibold text-[var(--text)] hover:underline', focusClass].join(
            ' ',
          )}
        >
          {prompt.title}
        </button>
        <CopyButton text={prompt.prompt} ariaLabel={`Copy ${prompt.title}`} idleLabel="Copy" />
      </div>
      <p className="text-sm text-[var(--text)]">{prompt.summary}</p>
      <p className="line-clamp-4 text-xs leading-5 text-[var(--text-muted)]">{prompt.context}</p>
      <div className="mt-auto">
        <PromptTags prompt={prompt} />
      </div>
    </article>
  );
}

function PromptCommandPalette({
  open,
  onOpenChange,
  query,
  onQueryChange,
  results,
  container,
  onSelectResult,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  results: readonly PromptSearchResult[];
  container: HTMLElement | null;
  onSelectResult: (result: PromptSearchResult) => void;
}) {
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search prompts"
      shouldFilter={false}
      loop
      container={container ?? undefined}
      overlayClassName="pointer-events-auto absolute inset-0 z-40 bg-[var(--overlay)]"
      contentClassName="pointer-events-auto absolute left-1/2 top-4 z-50 flex max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-[42rem] -translate-x-1/2 flex-col border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]"
      className="flex min-h-0 flex-col overflow-hidden"
    >
      <DialogTitle className="sr-only">Search prompts</DialogTitle>
      <DialogDescription className="sr-only">
        Search the curated prompt library and open a prompt to copy or review.
      </DialogDescription>
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
        <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
        <Command.Input
          value={query}
          onValueChange={onQueryChange}
          placeholder="Search prompts..."
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>
      <Command.List className="min-h-0 overflow-y-auto p-2" label="Prompt results">
        <Command.Empty className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
          No prompts found.
        </Command.Empty>
        {results.map((result) => (
          <Command.Item
            key={result.prompt.id}
            value={result.prompt.id}
            onSelect={() => onSelectResult(result)}
            className={[
              'cursor-pointer border border-transparent p-3 text-left outline-none',
              'data-[selected=true]:border-[var(--border-strong)] data-[selected=true]:bg-[var(--surface-muted)]',
            ].join(' ')}
          >
            <PromptSearchResultItem result={result} />
          </Command.Item>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}

function PromptSearchResultItem({ result }: { result: PromptSearchResult }) {
  const titleMatch = getMatchForKey(result, 'title');
  const summaryMatch = getMatchForKey(result, 'summary');

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-[var(--text)]">
          <HighlightedText text={result.prompt.title} indices={titleMatch?.indices} />
        </h3>
        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
          <HighlightedText text={result.prompt.summary} indices={summaryMatch?.indices} />
        </p>
      </div>
      <ResultSnippet result={result} />
      <PromptTags prompt={result.prompt} highlightedTagIds={getMatchedTagIds(result)} />
    </div>
  );
}

function PromptTags({
  prompt,
  highlightedTagIds = [],
}: {
  prompt: PromptEntry;
  highlightedTagIds?: readonly PromptTagId[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {prompt.tags.map((tagId) => {
        const tag = getPromptTag(tagId);
        const highlighted = highlightedTagIds.includes(tagId);
        const tagColorStyle = getPromptTagColorStyle(tag.color);

        return (
          <span
            key={tag.id}
            style={tagColorStyle}
            className={[
              'inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]',
              highlighted
                ? 'border-[color:var(--prompt-tag-color)] bg-[var(--surface-muted)] text-[var(--text)]'
                : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]',
            ].join(' ')}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-none bg-[var(--prompt-tag-color)]" aria-hidden="true" />
            {tag.label}
          </span>
        );
      })}
    </div>
  );
}

function ResultSnippet({ result }: { result: PromptSearchResult }) {
  const snippet = pickResultSnippet(result, 64);

  return (
    <p className="text-xs leading-5 text-[var(--text-muted)]">
      <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {snippet.field}
      </span>
      {snippet.leadingEllipsis && <span aria-hidden="true">...</span>}
      <HighlightedText text={snippet.text} indices={snippet.indices} />
      {snippet.trailingEllipsis && <span aria-hidden="true">...</span>}
    </p>
  );
}

function HighlightedText({ text, indices = [] }: { text: string; indices?: HighlightIndices }) {
  const segments = getHighlightedSegments(text, indices);
  let cursor = 0;
  const keyedSegments = segments.map((segment) => {
    const start = cursor;
    cursor += segment.text.length;
    return {
      ...segment,
      key: `${start}-${cursor}-${segment.highlighted ? 'highlight' : 'text'}`,
    };
  });

  return (
    <>
      {keyedSegments.map((segment) =>
        segment.highlighted ? (
          <mark key={segment.key} className="bg-[var(--highlight)] text-[var(--text)] decoration-transparent">
            {segment.text}
          </mark>
        ) : (
          <span key={segment.key}>{segment.text}</span>
        ),
      )}
    </>
  );
}

function getMatchedTagIds(result: PromptSearchResult): PromptTagId[] {
  const tagIds = new Set<PromptTagId>();

  for (const match of result.matches) {
    if (match.key !== 'tags') continue;

    const tagId =
      typeof match.refIndex === 'number'
        ? result.prompt.tags[match.refIndex]
        : result.prompt.tags.find((promptTagId) => promptTagId === match.value);

    if (tagId) {
      tagIds.add(tagId);
    }
  }

  return [...tagIds];
}

function PromptDetailDialog({
  prompt,
  searchResult,
  returnFocusTo,
  fallbackFocusTo = null,
  onClose,
}: {
  prompt: PromptEntry;
  searchResult?: PromptSearchResult | null;
  returnFocusTo: HTMLElement | null;
  fallbackFocusTo?: HTMLElement | null;
  onClose: () => void;
}) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const matchingSearchResult = searchResult?.prompt.id === prompt.id ? searchResult : undefined;
  const titleMatch = matchingSearchResult ? getMatchForKey(matchingSearchResult, 'title') : undefined;
  const summaryMatch = matchingSearchResult ? getMatchForKey(matchingSearchResult, 'summary') : undefined;
  const contextMatch = matchingSearchResult ? getMatchForKey(matchingSearchResult, 'context') : undefined;
  const promptMatch = matchingSearchResult ? getMatchForKey(matchingSearchResult, 'prompt') : undefined;
  const highlightedTagIds = matchingSearchResult ? getMatchedTagIds(matchingSearchResult) : [];

  useEffect(() => {
    headingRef.current?.focus();

    return () => {
      if (returnFocusTo?.isConnected) {
        returnFocusTo.focus();
        return;
      }

      if (fallbackFocusTo?.isConnected) {
        fallbackFocusTo.focus();
      }
    };
  }, [fallbackFocusTo, returnFocusTo]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement;

    if (!dialogRef.current?.contains(activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (!focusable.includes(activeElement as HTMLElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }

    if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[color:var(--overlay)] p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onKeyDown={handleKeyDown}
        className="flex max-h-full w-full max-w-[46rem] flex-col border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <div className="min-w-0">
            <h2
              ref={headingRef}
              id={headingId}
              tabIndex={-1}
              className={['text-base font-semibold', focusClass].join(' ')}
            >
              <HighlightedText text={prompt.title} indices={titleMatch?.indices} />
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              <HighlightedText text={prompt.summary} indices={summaryMatch?.indices} />
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close prompt details"
            className={['p-1 text-[var(--text-muted)] hover:text-[var(--text)]', focusClass].join(' ')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <PromptTags prompt={prompt} highlightedTagIds={highlightedTagIds} />
          <section className="text-sm text-[var(--text-muted)]">
            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Usage Context
            </h3>
            <p>
              <HighlightedText text={prompt.context} indices={contextMatch?.indices} />
            </p>
          </section>
          <section className="min-h-0">
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Prompt
            </h3>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap border border-[var(--border)] bg-[var(--surface-muted)] p-3 font-mono text-xs leading-5 text-[var(--text)]">
              <HighlightedText text={prompt.prompt} indices={promptMatch?.indices} />
            </pre>
          </section>
        </div>
        <div className="flex justify-end border-t border-[var(--border)] px-4 py-3">
          <CopyButton text={prompt.prompt} ariaLabel={`Copy ${prompt.title}`} idleLabel="Copy Prompt" />
        </div>
      </div>
    </div>
  );
}
