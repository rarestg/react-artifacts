import { Autocomplete } from '@base-ui/react/autocomplete';
import { Dialog } from '@base-ui/react/dialog';
import { Search } from 'lucide-react';
import { type CSSProperties, type ReactNode, useEffect, useId, useMemo, useReducer, useRef, useState } from 'react';

import { ArtifactDialog } from '../../components/ArtifactDialog';
import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { Button } from '../../components/Button';
import { CopyButton, type CopyButtonHandle } from '../../components/CopyButton';
import { FilterCheckbox } from '../../components/FilterCheckbox';
import { PageHeader } from '../../components/PageHeader';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Stepper } from '../../components/Stepper';
import { mergeClassNames } from '../../lib/classNames';
import { isEditableEventTarget } from '../../lib/isEditableEventTarget';
import { getPlatformShortcutHint } from '../../lib/keyboardShortcutHint';
import { ArtifactDialogPortal } from '../../ui/base-portals';
import { Grid } from '../../ui/layout';
import { focusRing, panel, popupOverlay, popupSurface } from '../../ui/recipes';
import { countResolvedGridColumns, getNextCardIndex } from './cardKeyNavigation';
import { initialPromptLibraryInteractionState, promptLibraryInteractionReducer } from './interactionState';
import {
  getDefaultPromptModifierOptionId,
  getDefaultPromptToggleOptionIds,
  getPromptTag,
  type PromptEntry,
  type PromptTagColorId,
  type PromptTagId,
  prompts,
  promptTags,
  renderPromptText,
} from './prompts';
import {
  filterPromptsByTags,
  getDisplayMatchesForFields,
  getHighlightedSegments,
  getMatchedPromptSearchVariant,
  getMatchForKey,
  getPromptHeaderDisplayMatches,
  type PromptSearchResult,
  pickResultSnippet,
  searchPrompts,
} from './search';

const rootClass = 'relative min-h-screen overflow-hidden bg-[var(--surface-muted)] text-[var(--text)]';
const shortcutKeyClass =
  'inline-flex h-5 min-w-5 items-center justify-center border border-[var(--border)] bg-[var(--surface)] px-1.5 font-mono text-[10px] font-semibold leading-none text-[var(--text-muted)]';
// The command glyph has more internal whitespace than Latin letters; size it optically so it balances with "K".
const commandGlyphClass = 'text-[13px]';

type HighlightIndices = readonly (readonly [number, number])[];

const EMPTY_HIGHLIGHTED_TAG_IDS: readonly PromptTagId[] = [];
const EMPTY_HIGHLIGHT_INDICES: HighlightIndices = [];

type PromptDetailSectionId = 'usage-context' | 'prompt';

type PromptTagColorStyle = CSSProperties & {
  '--prompt-tag-color': string;
};

function getPromptTagColorStyle(color: PromptTagColorId): PromptTagColorStyle {
  const colorToken = `var(--category-${color})`;

  return {
    '--prompt-tag-color': colorToken,
  };
}

export default function PromptLibrary() {
  const [selectedTags, setSelectedTags] = useState<PromptTagId[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [{ searchOpen, activePrompt, activeSearchResult, activeSearchQuery }, dispatchInteraction] = useReducer(
    promptLibraryInteractionReducer,
    initialPromptLibraryInteractionState,
  );
  const detailReturnFocusRef = useRef<HTMLElement | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const searchShortcutHint = getPlatformShortcutHint('K');
  const visiblePrompts = useMemo(() => filterPromptsByTags(prompts, selectedTags), [selectedTags]);
  const searchResults = useMemo(() => searchPrompts(visiblePrompts, searchQuery), [searchQuery, visiblePrompts]);

  const openPromptDetail = (prompt: PromptEntry, opener: HTMLElement | null) => {
    detailReturnFocusRef.current = opener;
    dispatchInteraction({ type: 'open-prompt-detail', prompt });
  };

  const closePromptDetail = () => {
    dispatchInteraction({ type: 'close-prompt-detail' });
  };

  const openSearchPalette = () => {
    dispatchInteraction({ type: 'set-search-open', open: true });
  };

  const selectSearchResult = (result: PromptSearchResult) => {
    detailReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dispatchInteraction({ type: 'select-search-result', result, query: searchQuery });
  };

  const toggleTag = (tag: PromptTagId, checked: boolean) => {
    setSelectedTags((current) => (checked ? [...current, tag] : current.filter((selected) => selected !== tag)));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || !(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== 'k') return;

      event.preventDefault();
      dispatchInteraction({ type: 'toggle-search-open' });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Vim-style card navigation (h/j/k/l) plus c-to-copy. Detached while the search
  // palette or the detail dialog is open so overlay typing is never intercepted.
  useEffect(() => {
    if (searchOpen || activePrompt) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableEventTarget(event.target)) return;

      const focusedCard = document.activeElement?.closest('[data-prompt-card]') ?? null;

      if (event.key === 'c') {
        if (event.repeat) return;
        const copyButton = focusedCard?.querySelector<HTMLButtonElement>('[data-prompt-card-copy]');
        if (!copyButton) return;
        event.preventDefault();
        copyButton.click();
        return;
      }

      if (event.key !== 'h' && event.key !== 'j' && event.key !== 'k' && event.key !== 'l') return;

      // Cards re-order and disappear under tag filters, so derive the list per keypress.
      const titleButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-prompt-card-title]')];
      const currentIndex = focusedCard ? titleButtons.findIndex((button) => focusedCard.contains(button)) : -1;
      const grid = titleButtons[0]?.closest('[data-prompt-card]')?.parentElement;
      const columnCount = grid ? countResolvedGridColumns(getComputedStyle(grid).gridTemplateColumns) : 1;
      const nextIndex = getNextCardIndex(event.key, currentIndex, titleButtons.length, columnCount);
      if (nextIndex === null) return;

      event.preventDefault();
      titleButtons[nextIndex]?.focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, activePrompt]);

  return (
    <ArtifactThemeRoot className={rootClass}>
      <div className="flex min-h-screen flex-col">
        <PageHeader
          title="Prompt Library"
          subtitle={`${visiblePrompts.length} of ${prompts.length} prompts`}
          actions={
            <Button
              ref={searchButtonRef}
              aria-label={`Search (${searchShortcutHint.label})`}
              aria-keyshortcuts="Meta+K Control+K"
              onClick={openSearchPalette}
              className="active:bg-[var(--surface-strong)]"
            >
              <Search className="size-4" aria-hidden="true" />
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
            </Button>
          }
        />

        <main className="flex flex-1 flex-col gap-4 p-4">
          <section
            className={mergeClassNames('flex flex-wrap items-center gap-2 p-3', panel.default)}
            aria-label="Prompt tags"
          >
            {promptTags.map((tag) => {
              const checked = selectedTags.includes(tag.id);
              const count = filterPromptsByTags(prompts, [
                ...selectedTags.filter((selected) => selected !== tag.id),
                tag.id,
              ]).length;

              return (
                <FilterCheckbox
                  key={tag.id}
                  checked={checked}
                  onCheckedChange={(nextChecked) => toggleTag(tag.id, nextChecked)}
                  label={tag.label}
                  count={count}
                  tone={tag.color}
                />
              );
            })}
          </section>

          {visiblePrompts.length ? (
            <Grid min="18rem" className="gap-3">
              {visiblePrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} onOpen={(opener) => openPromptDetail(prompt, opener)} />
              ))}
            </Grid>
          ) : (
            <section className={mergeClassNames('p-6 text-sm text-[var(--text-muted)]', panel.default)}>
              No prompts match the selected tags.
            </section>
          )}
        </main>
      </div>

      {activePrompt && (
        <PromptDetailDialog
          key={activePrompt.id}
          prompt={activePrompt}
          searchResult={activeSearchResult}
          searchQuery={activeSearchQuery}
          searchOpen={searchOpen}
          returnFocusTo={detailReturnFocusRef.current}
          fallbackFocusTo={searchButtonRef.current}
          onClose={closePromptDetail}
        />
      )}

      <PromptCommandPalette
        open={searchOpen}
        onOpenChange={(open) => dispatchInteraction({ type: 'set-search-open', open })}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        results={searchResults}
        onSelectResult={selectSearchResult}
      />
    </ArtifactThemeRoot>
  );
}

function PromptCard({ prompt, onOpen }: { prompt: PromptEntry; onOpen: (opener: HTMLElement) => void }) {
  return (
    <article data-prompt-card="" className={mergeClassNames('flex min-h-56 flex-col gap-4 p-4', panel.default)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <button
          type="button"
          data-prompt-card-title=""
          onClick={(event) => onOpen(event.currentTarget)}
          className={mergeClassNames(
            'min-w-0 cursor-pointer text-left text-sm font-semibold text-[var(--text)] underline-offset-2 transition-colors hover:underline active:text-[var(--text-muted)] motion-reduce:transition-none',
            focusRing,
          )}
        >
          {prompt.title}
        </button>
        <CopyButton
          text={renderPromptText(prompt)}
          ariaLabel={`Copy ${prompt.title}`}
          idleLabel="Copy"
          dataAttributes={{ 'data-prompt-card-copy': '' }}
        />
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
  onSelectResult,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  results: readonly PromptSearchResult[];
  onSelectResult: (result: PromptSearchResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <ArtifactDialogPortal>
        <Dialog.Backdrop className={mergeClassNames('fixed inset-0 z-40', popupOverlay)} />
        <Dialog.Viewport className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
          <Dialog.Popup
            aria-label="Search prompts"
            initialFocus={() => inputRef.current}
            className={mergeClassNames(
              popupSurface,
              'pointer-events-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-[42rem] flex-col overflow-hidden',
            )}
          >
            <Dialog.Title className="sr-only">Search prompts</Dialog.Title>
            <Dialog.Description className="sr-only">
              Search the curated prompt library and open a prompt to copy or review.
            </Dialog.Description>
            <Autocomplete.Root
              open
              inline
              value={query}
              onValueChange={onQueryChange}
              items={results}
              filter={null}
              itemToStringValue={(result) => result.prompt.title}
              autoHighlight="always"
              keepHighlight
            >
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
                <Search className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                <Autocomplete.Input
                  ref={inputRef}
                  aria-label="Search prompts"
                  placeholder="Search prompts..."
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
                />
              </div>
              <Autocomplete.Empty>
                <div className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">No prompts found.</div>
              </Autocomplete.Empty>
              <Autocomplete.List aria-label="Prompt results" className="min-h-0 overflow-y-auto p-2 data-[empty]:p-0">
                {results.map((result) => (
                  <Autocomplete.Item
                    key={result.prompt.id}
                    value={result}
                    onClick={() => onSelectResult(result)}
                    className={
                      'cursor-pointer border border-transparent p-3 text-left outline-none data-[highlighted]:border-[var(--border-strong)] data-[highlighted]:bg-[var(--surface-muted)]'
                    }
                  >
                    <PromptSearchResultItem result={result} query={query} />
                  </Autocomplete.Item>
                ))}
              </Autocomplete.List>
            </Autocomplete.Root>
          </Dialog.Popup>
        </Dialog.Viewport>
      </ArtifactDialogPortal>
    </Dialog.Root>
  );
}

function PromptSearchResultItem({ result, query }: { result: PromptSearchResult; query: string }) {
  const { titleIndices, summaryIndices } = getPromptHeaderDisplayMatches(result, query);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-[var(--text)]">
          <HighlightedText text={result.prompt.title} indices={titleIndices} />
        </h3>
        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
          <HighlightedText text={result.prompt.summary} indices={summaryIndices} />
        </p>
      </div>
      <ResultSnippet result={result} query={query} />
      <PromptTags prompt={result.prompt} highlightedTagIds={getMatchedTagIds(result)} />
    </div>
  );
}

function PromptTags({
  prompt,
  highlightedTagIds = EMPTY_HIGHLIGHTED_TAG_IDS,
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
            className={mergeClassNames(
              'inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]',
              highlighted
                ? 'border-[color:var(--prompt-tag-color)] bg-[var(--surface-muted)] text-[var(--text)]'
                : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]',
            )}
          >
            <span className="size-1.5 shrink-0 rounded-none bg-[var(--prompt-tag-color)]" aria-hidden="true" />
            {tag.label}
          </span>
        );
      })}
    </div>
  );
}

function ResultSnippet({ result, query }: { result: PromptSearchResult; query: string }) {
  const snippet = pickResultSnippet(result, 64, query);

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

function HighlightedText({ text, indices = EMPTY_HIGHLIGHT_INDICES }: { text: string; indices?: HighlightIndices }) {
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
  const promptTagIds = new Set(result.prompt.tags);

  for (const match of result.matches) {
    if (match.key !== 'tags') continue;

    const matchedValue = match.value;
    const tagId =
      typeof match.refIndex === 'number'
        ? result.prompt.tags[match.refIndex]
        : typeof matchedValue === 'string' && promptTagIds.has(matchedValue as PromptTagId)
          ? (matchedValue as PromptTagId)
          : undefined;

    if (tagId) {
      tagIds.add(tagId);
    }
  }

  return [...tagIds];
}

function PromptDetailSection({
  sectionId,
  title,
  controls,
  children,
  bodyClassName,
}: {
  sectionId: PromptDetailSectionId;
  title: string;
  controls?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}) {
  const titleId = useId();

  return (
    <section data-prompt-detail-section={sectionId} aria-labelledby={titleId} className="min-w-0 flex flex-col gap-2">
      <div
        data-prompt-detail-section-header=""
        className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2"
      >
        <h3 id={titleId} className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {title}
        </h3>
        {controls && (
          <div data-prompt-detail-section-controls="" className="flex min-w-0 flex-wrap items-center gap-2">
            {controls}
          </div>
        )}
      </div>
      <div data-prompt-detail-section-body="" className={mergeClassNames('min-w-0', bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

function PromptModifierControl({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex min-w-0 items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</span>
      <SegmentedControl
        ariaLabel={label}
        value={value}
        onValueChange={onValueChange}
        options={options}
        size="compact"
      />
    </div>
  );
}

function PromptToggleModifierControl({
  label,
  selectedOptionIds,
  onOptionChange,
  options,
}: {
  label: string;
  selectedOptionIds: readonly string[];
  onOptionChange: (optionId: string, checked: boolean) => void;
  options: readonly { id: string; label: string }[];
}) {
  const selectedOptionIdSet = new Set(selectedOptionIds);

  return (
    <>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</span>
      <fieldset className="m-0 flex min-w-0 flex-wrap items-center gap-1.5 border-0 p-0" aria-label={label}>
        {options.map((option) => (
          <FilterCheckbox
            key={option.id}
            checked={selectedOptionIdSet.has(option.id)}
            onCheckedChange={(checked) => onOptionChange(option.id, checked)}
            label={option.label}
            tone="metadata"
            borderStyle="neutral"
            className="h-6"
          />
        ))}
      </fieldset>
    </>
  );
}

export function PromptDetailContent({
  prompt,
  renderedPrompt,
  selectedModifierOptionId,
  onModifierOptionChange,
  selectedNumberInputValue,
  onNumberInputChange = () => undefined,
  selectedToggleOptionIds = getDefaultPromptToggleOptionIds(prompt),
  onToggleOptionChange,
  highlightedTagIds = EMPTY_HIGHLIGHTED_TAG_IDS,
  contextIndices,
  promptIndices,
}: {
  prompt: PromptEntry;
  renderedPrompt: string;
  selectedModifierOptionId?: string;
  onModifierOptionChange: (optionId: string) => void;
  selectedNumberInputValue?: number;
  onNumberInputChange?: (value: number) => void;
  selectedToggleOptionIds?: readonly string[];
  onToggleOptionChange?: (optionId: string, checked: boolean) => void;
  highlightedTagIds?: readonly PromptTagId[];
  contextIndices?: HighlightIndices;
  promptIndices?: HighlightIndices;
}) {
  const modifierOptions = prompt.modifier?.options.map((option) => ({
    value: option.id,
    label: option.label,
  }));
  const modifierControl =
    prompt.modifier && modifierOptions ? (
      <PromptModifierControl
        label={prompt.modifier.label}
        value={selectedModifierOptionId ?? prompt.modifier.defaultOptionId}
        onValueChange={onModifierOptionChange}
        options={modifierOptions}
      />
    ) : undefined;
  const numberInputControl = prompt.numberInput ? (
    <Stepper
      label={prompt.numberInput.label}
      value={selectedNumberInputValue ?? prompt.numberInput.defaultValue}
      min={prompt.numberInput.min}
      max={prompt.numberInput.max}
      step={prompt.numberInput.step}
      onValueChange={onNumberInputChange}
      size="compact"
      labelPosition="start"
    />
  ) : undefined;
  const toggleModifierOptions = prompt.toggleModifier?.options.map((option) => ({
    id: option.id,
    label: option.label,
  }));
  const toggleModifierControl =
    prompt.toggleModifier && toggleModifierOptions && onToggleOptionChange ? (
      <PromptToggleModifierControl
        label={prompt.toggleModifier.label}
        selectedOptionIds={selectedToggleOptionIds}
        onOptionChange={onToggleOptionChange}
        options={toggleModifierOptions}
      />
    ) : undefined;
  const promptControls =
    modifierControl || numberInputControl || toggleModifierControl ? (
      <>
        {modifierControl}
        {numberInputControl}
        {toggleModifierControl}
      </>
    ) : undefined;

  return (
    <>
      <PromptTags prompt={prompt} highlightedTagIds={highlightedTagIds} />
      <PromptDetailSection
        sectionId="usage-context"
        title="Usage Context"
        bodyClassName="text-sm text-[var(--text-muted)]"
      >
        <p>
          <HighlightedText text={prompt.context} indices={contextIndices} />
        </p>
      </PromptDetailSection>
      <PromptDetailSection sectionId="prompt" title="Prompt" controls={promptControls} bodyClassName="min-h-0">
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap border border-[var(--border)] bg-[var(--surface-muted)] p-3 font-mono text-xs leading-5 text-[var(--text)]">
          <HighlightedText text={renderedPrompt} indices={promptIndices} />
        </pre>
      </PromptDetailSection>
    </>
  );
}

function PromptDetailDialog({
  prompt,
  searchResult,
  searchQuery,
  searchOpen,
  returnFocusTo,
  fallbackFocusTo = null,
  onClose,
}: {
  prompt: PromptEntry;
  searchResult?: PromptSearchResult | null;
  searchQuery: string;
  searchOpen: boolean;
  returnFocusTo: HTMLElement | null;
  fallbackFocusTo?: HTMLElement | null;
  onClose: () => void;
}) {
  const footerCopyRef = useRef<CopyButtonHandle>(null);
  const defaultModifierOptionId = getDefaultPromptModifierOptionId(prompt);
  const defaultNumberInputValue = prompt.numberInput?.defaultValue;
  const defaultToggleOptionIds = useMemo(() => getDefaultPromptToggleOptionIds(prompt), [prompt]);
  const matchingSearchResult = searchResult?.prompt.id === prompt.id ? searchResult : undefined;
  const matchedPromptVariant = matchingSearchResult
    ? getMatchedPromptSearchVariant(matchingSearchResult, searchQuery)
    : undefined;
  const initialModifierOptionId = matchedPromptVariant?.optionId ?? defaultModifierOptionId;
  const [selectedModifierOptionId, setSelectedModifierOptionId] = useState(initialModifierOptionId);
  const [selectedNumberInputValue, setSelectedNumberInputValue] = useState(defaultNumberInputValue);
  const [selectedToggleOptionIds, setSelectedToggleOptionIds] = useState(defaultToggleOptionIds);
  const renderedPrompt = renderPromptText(prompt, selectedModifierOptionId, {
    numberInputValue: selectedNumberInputValue,
    enabledToggleOptionIds: selectedToggleOptionIds,
  });
  const titleMatch = matchingSearchResult ? getMatchForKey(matchingSearchResult, 'title') : undefined;
  const summaryMatch = matchingSearchResult ? getMatchForKey(matchingSearchResult, 'summary') : undefined;
  const contextMatch = matchingSearchResult ? getMatchForKey(matchingSearchResult, 'context') : undefined;
  const promptFuseIndices =
    renderedPrompt === matchedPromptVariant?.text ? matchedPromptVariant.fuseIndices : undefined;
  const [titleDisplayMatch, summaryDisplayMatch, contextDisplayMatch, promptDisplayMatch] = matchingSearchResult
    ? getDisplayMatchesForFields(
        [
          { field: 'title', text: prompt.title, fuseIndices: titleMatch?.indices },
          { field: 'summary', text: prompt.summary, fuseIndices: summaryMatch?.indices },
          { field: 'context', text: prompt.context, fuseIndices: contextMatch?.indices },
          { field: 'prompt', text: renderedPrompt, fuseIndices: promptFuseIndices },
          { field: 'tags', text: prompt.tags.join(' ') },
        ],
        searchQuery,
      )
    : [];
  const titleIndices = titleDisplayMatch?.indices;
  const summaryIndices = summaryDisplayMatch?.indices;
  const contextIndices = contextDisplayMatch?.indices;
  const promptIndices = promptDisplayMatch?.indices;
  const highlightedTagIds = matchingSearchResult ? getMatchedTagIds(matchingSearchResult) : EMPTY_HIGHLIGHTED_TAG_IDS;

  useEffect(() => {
    setSelectedModifierOptionId(initialModifierOptionId);
  }, [initialModifierOptionId]);

  useEffect(() => {
    setSelectedNumberInputValue(defaultNumberInputValue);
  }, [defaultNumberInputValue]);

  useEffect(() => {
    setSelectedToggleOptionIds(defaultToggleOptionIds);
  }, [defaultToggleOptionIds]);

  // c copies the rendered prompt via the footer button so its feedback and
  // aria-live announcement stay visible. Detached while the search palette is
  // stacked on top; the editable guard keeps the Stepper's number input usable.
  useEffect(() => {
    if (searchOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'c' || event.repeat) return;
      if (event.defaultPrevented || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableEventTarget(event.target)) return;

      event.preventDefault();
      footerCopyRef.current?.copy();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const handleToggleOptionChange = (optionId: string, checked: boolean) => {
    setSelectedToggleOptionIds((current) =>
      checked
        ? current.includes(optionId)
          ? current
          : [...current, optionId]
        : current.filter((selectedOptionId) => selectedOptionId !== optionId),
    );
  };

  return (
    <ArtifactDialog
      open={Boolean(prompt)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={<HighlightedText text={prompt.title} indices={titleIndices} />}
      description={<HighlightedText text={prompt.summary} indices={summaryIndices} />}
      footer={
        <CopyButton
          ref={footerCopyRef}
          text={renderedPrompt}
          ariaLabel={`Copy ${prompt.title}`}
          idleLabel="Copy Prompt"
        />
      }
      closeLabel="Close prompt details"
      placement="viewport"
      align="center"
      contentClassName="max-w-[46rem]"
      bodyClassName="flex flex-col gap-4"
      footerClassName="flex justify-end"
      returnFocusTo={returnFocusTo}
      fallbackFocusTo={fallbackFocusTo}
    >
      <PromptDetailContent
        prompt={prompt}
        renderedPrompt={renderedPrompt}
        selectedModifierOptionId={selectedModifierOptionId}
        onModifierOptionChange={setSelectedModifierOptionId}
        selectedNumberInputValue={selectedNumberInputValue}
        onNumberInputChange={setSelectedNumberInputValue}
        selectedToggleOptionIds={selectedToggleOptionIds}
        onToggleOptionChange={handleToggleOptionChange}
        highlightedTagIds={highlightedTagIds}
        contextIndices={contextIndices}
        promptIndices={promptIndices}
      />
    </ArtifactDialog>
  );
}
