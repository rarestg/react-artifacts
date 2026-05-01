import { Search, X } from 'lucide-react';
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';

import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { Checkbox } from '../../components/Checkbox';
import { CopyButton } from '../../components/CopyButton';
import { getPromptTag, type PromptEntry, type PromptTagId, prompts, promptTags } from './prompts';
import { filterPromptsByTags } from './search';

const rootClass = 'relative min-h-screen overflow-hidden bg-[var(--surface-muted)] text-[var(--text)]';
const panelClass = 'border border-[var(--border)] bg-[var(--surface)]';
const focusClass =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]';

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export default function PromptLibrary() {
  const [selectedTags, setSelectedTags] = useState<PromptTagId[]>([]);
  const [activePrompt, setActivePrompt] = useState<PromptEntry | null>(null);
  const detailReturnFocusRef = useRef<HTMLElement | null>(null);

  const visiblePrompts = useMemo(() => filterPromptsByTags(prompts, selectedTags), [selectedTags]);

  const openPromptDetail = (prompt: PromptEntry, opener: HTMLElement | null) => {
    detailReturnFocusRef.current = opener;
    setActivePrompt(prompt);
  };

  const toggleTag = (tag: PromptTagId, checked: boolean) => {
    setSelectedTags((current) => (checked ? [...current, tag] : current.filter((selected) => selected !== tag)));
  };

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
              type="button"
              disabled
              title="Command search is added in the next task"
              className={[
                'inline-flex h-9 items-center gap-2 border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3 text-sm font-medium text-[var(--text)]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                focusClass,
              ].join(' ')}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
              <span className="border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                Ctrl K
              </span>
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4">
          <section className={['flex flex-wrap items-center gap-2 p-3', panelClass].join(' ')} aria-label="Prompt tags">
            {promptTags.map((tag) => {
              const checked = selectedTags.includes(tag.id);
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
                  suffix={<span className="font-mono text-[10px] text-[var(--text-muted)] tabular-nums">{count}</span>}
                  className={[
                    'border px-2 text-xs',
                    checked
                      ? 'border-[var(--accent)] bg-[var(--accent-weak)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]',
                  ].join(' ')}
                  labelClassName="text-xs"
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
          returnFocusTo={detailReturnFocusRef.current}
          onClose={() => setActivePrompt(null)}
        />
      )}
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

        return (
          <span
            key={tag.id}
            className={[
              'border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]',
              highlighted
                ? 'border-[var(--accent)] bg-[var(--accent-weak)] text-[var(--text)]'
                : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]',
            ].join(' ')}
          >
            {tag.label}
          </span>
        );
      })}
    </div>
  );
}

function PromptDetailDialog({
  prompt,
  returnFocusTo,
  fallbackFocusTo = null,
  onClose,
}: {
  prompt: PromptEntry;
  returnFocusTo: HTMLElement | null;
  fallbackFocusTo?: HTMLElement | null;
  onClose: () => void;
}) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

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
              {prompt.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{prompt.summary}</p>
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
          <PromptTags prompt={prompt} />
          <section className="text-sm text-[var(--text-muted)]">
            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Usage Context
            </h3>
            <p>{prompt.context}</p>
          </section>
          <section className="min-h-0">
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Prompt
            </h3>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap border border-[var(--border)] bg-[var(--surface-muted)] p-3 font-mono text-xs leading-5 text-[var(--text)]">
              {prompt.prompt}
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
