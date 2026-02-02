import { Columns2, Columns3 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import Checkbox from './components/Checkbox';
import CopyButton, { type CopyButtonHandle } from './components/CopyButton';
import PathList from './components/PathList';
import StatusTag from './components/StatusTag';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { defaultTruncation, sampleInput } from './lib/constants';
import { applyFilter, applyStructureOnly, truncateValue } from './lib/filtering';
import { formatOutput, getItemCount, getOutputStats } from './lib/formatOutput';
import { formatBadge, parseInput } from './lib/parseInput';
import { buildDescendantMap, buildPaths, buildTree, computeEffectiveSelection, flattenTree } from './lib/pathTree';
import type { LayoutMode, OutputFormat } from './types';

import './theme.css';

const STORAGE_PREFIX = 'jsonl-structure-viewer';
const debounceDelay = 300;

function formatErrorsReport(errors: { line: number; message: string; preview: string }[]) {
  return errors.map((error) => `Line ${error.line}: ${error.message} | ${error.preview}`).join('\n');
}

export default function JsonlStructureViewer() {
  const [input, setInput] = useState(sampleInput);
  const [truncateAt, setTruncateAt] = useLocalStorageState(`${STORAGE_PREFIX}-truncate-at`, defaultTruncation);
  const [wrapOutput, setWrapOutput] = useLocalStorageState(`${STORAGE_PREFIX}-wrap-output`, false);
  const [layoutMode, setLayoutMode] = useLocalStorageState<LayoutMode>(`${STORAGE_PREFIX}-layout`, 'two-column');
  const [outputFormat, setOutputFormat] = useLocalStorageState<OutputFormat>(
    `${STORAGE_PREFIX}-output-format`,
    'pretty',
  );
  const [structureOnly, setStructureOnly] = useLocalStorageState(`${STORAGE_PREFIX}-structure-only`, false);
  const [onlyLeaves, setOnlyLeaves] = useLocalStorageState(`${STORAGE_PREFIX}-only-leaves`, false);
  const [searchQuery, setSearchQuery] = useLocalStorageState(`${STORAGE_PREFIX}-path-search`, '');
  const [showHelp, setShowHelp] = useLocalStorageState(`${STORAGE_PREFIX}-help`, false);

  const [selection, setSelection] = useLocalStorageState<Record<string, boolean>>(`${STORAGE_PREFIX}-selection`, {});
  const [expandedPaths, setExpandedPaths] = useLocalStorageState<Record<string, boolean>>(
    `${STORAGE_PREFIX}-expanded`,
    {},
  );

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const copyButtonRef = useRef<CopyButtonHandle>(null);

  const debouncedInput = useDebouncedValue(input, debounceDelay);
  const parsed = useMemo(() => parseInput(debouncedInput.value), [debouncedInput.value]);

  const tree = useMemo(() => {
    if (!parsed.data) return null;
    const paths = buildPaths(parsed.data);
    return buildTree(paths);
  }, [parsed.data]);

  const flatNodes = useMemo(() => (tree ? flattenTree(tree) : []), [tree]);
  const descendantMap = useMemo(() => (tree ? buildDescendantMap(tree) : {}), [tree]);

  useEffect(() => {
    if (!tree) {
      setSelection({});
      return;
    }
    setSelection((prev) => {
      const next: Record<string, boolean> = {};
      flatNodes.forEach((node) => {
        next[node.path] = prev[node.path] ?? true;
      });
      return next;
    });
    setExpandedPaths((prev) => {
      const next: Record<string, boolean> = {};
      flatNodes.forEach((node) => {
        if (prev[node.path]) next[node.path] = true;
      });
      return next;
    });
  }, [tree, flatNodes, setSelection, setExpandedPaths]);

  const effectiveSelection = useMemo(() => computeEffectiveSelection(tree, selection), [tree, selection]);

  const filtered = useMemo(() => {
    if (!parsed.data) return null;
    return applyFilter(parsed.data, [], effectiveSelection);
  }, [parsed.data, effectiveSelection]);

  const structured = useMemo(() => {
    if (!filtered) return null;
    return structureOnly ? applyStructureOnly(filtered) : filtered;
  }, [filtered, structureOnly]);

  const truncated = useMemo(() => {
    if (!structured) return { value: null, truncated: 0 };
    if (structureOnly) return { value: structured, truncated: 0 };
    return truncateValue(structured, truncateAt);
  }, [structured, structureOnly, truncateAt]);

  const output = useMemo(() => {
    if (!parsed.data) return '';
    return formatOutput(truncated.value, parsed.format, outputFormat);
  }, [parsed.data, truncated.value, parsed.format, outputFormat]);

  const outputStats = useMemo(() => getOutputStats(output), [output]);
  const itemCount = useMemo(() => getItemCount(parsed.data, parsed.format), [parsed.data, parsed.format]);
  const tokenEstimate = useMemo(() => Math.max(0, Math.round(outputStats.characters / 4)), [outputStats.characters]);

  const handleToggleSubtree = (path: string, nextValue: boolean) => {
    const targets = [path, ...(descendantMap[path] ?? [])];
    setSelection((prev) => {
      const next = { ...prev };
      targets.forEach((target) => {
        next[target] = nextValue;
      });
      return next;
    });
  };

  const handleSelectAll = (value: boolean) => {
    setSelection((prev) => {
      const next = { ...prev };
      flatNodes.forEach((node) => {
        next[node.path] = value;
      });
      return next;
    });
  };

  const handleInvertSelection = () => {
    setSelection((prev) => {
      const next = { ...prev };
      flatNodes.forEach((node) => {
        next[node.path] = !(prev[node.path] ?? true);
      });
      return next;
    });
  };

  const handleResetFilters = () => {
    handleSelectAll(true);
    setSearchQuery('');
    setOnlyLeaves(false);
    setExpandedPaths({});
  };

  const handleExpandAll = () => {
    setExpandedPaths(() => {
      const next: Record<string, boolean> = {};
      flatNodes.forEach((node) => {
        if (node.children.length > 0) {
          next[node.path] = true;
        }
      });
      return next;
    });
  };

  const handleCollapseAll = () => {
    setExpandedPaths({});
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        debouncedInput.flush();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copyButtonRef.current?.copy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debouncedInput]);

  const hasOutput = output.length > 0;
  const parsingLabel = debouncedInput.isPending ? 'Parsing...' : 'Up to date';

  const errorsReport = parsed.errors.length ? formatErrorsReport(parsed.errors) : '';
  const errorReserveLabel = 'Invalid JSONL. Each line must be valid JSON.';
  const layoutReserveLabel = '3 Col';
  const outputModeReserveLabel = 'Structure Only';
  const wrapReserveLabel = 'Off';

  const inputPanel = (
    <section className={['min-w-0 flex flex-col gap-6 lg:flex-[1.4] lg:min-h-0'].filter(Boolean).join(' ')}>
      <div
        className={['min-w-0 flex flex-1 flex-col border border-[var(--border)] bg-[var(--surface)] lg:min-h-0']
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] px-4 py-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Input</div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
              {parsed.error ? (
                <span className="border border-[var(--danger)] bg-[var(--danger-weak)] px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--danger)]">
                  {parsed.error || errorReserveLabel}
                </span>
              ) : (
                <span>Auto-detect: {formatBadge(parsed.format)}</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setInput('')}
              className="border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] hover:bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setInput(sampleInput)}
              className="border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] hover:bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
            >
              Load Sample
            </button>
            <div className="border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]">
              {parsingLabel}
            </div>
          </div>
        </div>
        <div className={['flex flex-1 flex-col gap-4 px-4 py-4 min-h-0'].filter(Boolean).join(' ')}>
          <div className="min-h-0 flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              wrap={wrapOutput ? 'soft' : 'off'}
              spellCheck={false}
              rows={10}
              className={`h-full w-full resize-none overflow-auto border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 font-mono text-xs text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] ${
                wrapOutput ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
              }`}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Truncation
                </div>
                <div className="text-xs text-[var(--text-muted)]">Strings longer than this are shortened.</div>
              </div>
              <input
                type="number"
                min={10}
                max={200}
                value={truncateAt}
                onChange={(event) => setTruncateAt(Number(event.target.value) || defaultTruncation)}
                className="h-9 w-20 shrink-0 border border-[var(--border)] bg-[var(--surface)] px-2 text-sm font-mono text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
              />
            </div>
            <Checkbox
              checked={structureOnly}
              onChange={(event) => setStructureOnly(event.target.checked)}
              layout="between"
              className="min-w-0 border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2"
              label={
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Structure Only
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">Replace values with type labels.</div>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {parsed.errors.length > 0 && (
        <div className="flex flex-col border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
                JSONL Errors
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {parsed.errors.length} line{parsed.errors.length === 1 ? '' : 's'} failed to parse.
              </div>
            </div>
            <CopyButton text={errorsReport} idleLabel="Copy Report" className="px-2" />
          </div>
          <div className="flex flex-col gap-2 px-4 py-4 text-xs text-[var(--text-muted)]">
            {parsed.errors.map((error) => (
              <div
                key={`${error.line}-${error.message}`}
                className="flex flex-col gap-2 border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--danger)]">
                  Line {error.line}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">{error.message}</div>
                <div className="font-mono text-[11px] text-[var(--text)]">{error.preview}</div>
              </div>
            ))}
            <div className="text-[11px] text-[var(--text-muted)]">
              Hint: JSONL expects one JSON object per line without pretty-printing.
            </div>
          </div>
        </div>
      )}
    </section>
  );

  const pathPanel = (
    <section className="min-w-0 flex flex-col gap-6 lg:flex-[0.9] lg:min-h-0">
      <PathList
        tree={tree}
        flatNodes={flatNodes}
        selection={selection}
        effectiveSelection={effectiveSelection}
        expandedPaths={expandedPaths}
        onToggleExpand={(path) =>
          setExpandedPaths((prev) => {
            const next = { ...prev };
            if (prev[path]) {
              delete next[path];
              return next;
            }
            next[path] = true;
            return next;
          })
        }
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onTogglePath={(path, nextValue) => setSelection((prev) => ({ ...prev, [path]: nextValue }))}
        onToggleSubtree={handleToggleSubtree}
        onSelectAll={handleSelectAll}
        onInvert={handleInvertSelection}
        onResetFilters={handleResetFilters}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchInputRef={searchInputRef}
        onlyLeaves={onlyLeaves}
        onOnlyLeavesChange={setOnlyLeaves}
      />
    </section>
  );

  const outputPanel = (
    <section
      className={[
        'min-w-0 flex flex-col gap-6 lg:flex-1 lg:min-h-0',
        layoutMode === 'two-column' ? 'lg:self-stretch' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={['flex flex-1 flex-col border border-[var(--border)] bg-[var(--surface)] lg:min-h-0']
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Output</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {itemCount} item{itemCount === 1 ? '' : 's'} - {outputStats.lines} line
              {outputStats.lines === 1 ? '' : 's'}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton
              ref={copyButtonRef}
              text={output}
              idleLabel="Copy Output"
              className="px-2"
              disabled={!hasOutput}
            />
          </div>
        </div>
        <div className={['flex flex-1 flex-col gap-4 px-4 py-4 min-h-0'].filter(Boolean).join(' ')}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOutputFormat('pretty')}
                aria-pressed={outputFormat === 'pretty'}
                className={`border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] ${
                  outputFormat === 'pretty'
                    ? 'border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--text)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]'
                }`}
              >
                Pretty
              </button>
              <button
                type="button"
                onClick={() => setOutputFormat('compact')}
                aria-pressed={outputFormat === 'compact'}
                className={`border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] ${
                  outputFormat === 'compact'
                    ? 'border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--text)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            <span className="mr-2">Output mode:</span>
            <span className="inline-flex flex-wrap items-center gap-2">
              <StatusTag
                label="Full Values"
                reserveLabel={outputModeReserveLabel}
                active={!structureOnly}
                helper="Full values output"
              />
              <StatusTag
                label="Structure Only"
                reserveLabel={outputModeReserveLabel}
                active={structureOnly}
                helper="Structure-only output"
              />
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {truncated.truncated} string{truncated.truncated === 1 ? '' : 's'} truncated - {outputStats.characters}{' '}
            chars | ~{tokenEstimate} tokens
          </div>
          <div
            className={['min-w-0 flex-1 min-h-0 border border-[var(--border)] bg-[var(--surface-muted)]']
              .filter(Boolean)
              .join(' ')}
          >
            <pre
              className={`h-full min-w-0 overflow-auto p-3 text-xs leading-relaxed text-[var(--text)] ${
                wrapOutput ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
              }`}
            >
              {output || 'Waiting for valid JSON...'}
            </pre>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            Output updates after {debounceDelay}ms. Use Cmd/Ctrl+Enter to parse immediately.
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="jsonl-structure-theme h-screen overflow-hidden bg-[var(--surface-muted)] text-[var(--text)] flex flex-col">
      <div className="mx-auto flex w-full max-w-none flex-1 min-h-0 flex-col gap-6 overflow-auto px-6 py-10 lg:px-8 xl:px-10">
        <header className="flex flex-col gap-3 border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[var(--text-muted)]">
            JSON Structure Viewer
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold">JSONL Structure Viewer</h1>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Layout
                </span>
                <fieldset
                  aria-label="Layout mode"
                  className="inline-flex border border-[var(--border-strong)] divide-x divide-[var(--border)]"
                >
                  <button
                    type="button"
                    aria-pressed={layoutMode === 'two-column'}
                    onClick={() => setLayoutMode('two-column')}
                    className={[
                      'h-8 px-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none',
                      'inline-flex items-center gap-1.5',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
                      'relative focus-visible:z-10',
                      layoutMode === 'two-column'
                        ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="relative inline-grid">
                      <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                        {layoutReserveLabel}
                      </span>
                      <span className="col-start-1 row-start-1">2 Col</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={layoutMode === 'three-column'}
                    onClick={() => setLayoutMode('three-column')}
                    className={[
                      'h-8 px-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none',
                      'inline-flex items-center gap-1.5',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
                      'relative focus-visible:z-10',
                      layoutMode === 'three-column'
                        ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <Columns3 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="relative inline-grid">
                      <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                        {layoutReserveLabel}
                      </span>
                      <span className="col-start-1 row-start-1">3 Col</span>
                    </span>
                  </button>
                </fieldset>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Word Wrap
                </span>
                <fieldset
                  aria-label="Word wrap"
                  className="inline-flex border border-[var(--border-strong)] divide-x divide-[var(--border)]"
                >
                  <button
                    type="button"
                    aria-pressed={wrapOutput}
                    onClick={() => setWrapOutput(true)}
                    className={[
                      'h-8 px-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
                      'relative focus-visible:z-10',
                      wrapOutput
                        ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className="relative inline-grid">
                      <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                        {wrapReserveLabel}
                      </span>
                      <span className="col-start-1 row-start-1">On</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={!wrapOutput}
                    onClick={() => setWrapOutput(false)}
                    className={[
                      'h-8 px-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
                      'relative focus-visible:z-10',
                      !wrapOutput
                        ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className="relative inline-grid">
                      <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                        {wrapReserveLabel}
                      </span>
                      <span className="col-start-1 row-start-1">Off</span>
                    </span>
                  </button>
                </fieldset>
              </div>
            </div>
          </div>
          <p className="max-w-3xl text-sm text-[var(--text-muted)]">
            Explore JSON arrays, single objects, or JSONL streams. Trim long strings, filter by path, and copy a
            structure-first view without the noise.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Shortcuts
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="border border-[var(--border)] px-2 py-0.5 font-mono">Cmd/Ctrl+Enter</span>
                <span>Parse now</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="border border-[var(--border)] px-2 py-0.5 font-mono">Cmd/Ctrl+Shift+F</span>
                <span>Search paths</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="border border-[var(--border)] px-2 py-0.5 font-mono">Cmd/Ctrl+L</span>
                <span>Focus input</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="border border-[var(--border)] px-2 py-0.5 font-mono">Cmd/Ctrl+Shift+C</span>
                <span>Copy output</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp((prev) => !prev)}
              className="border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] hover:bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
            >
              {showHelp ? 'Hide Help' : 'Show Help'}
            </button>
          </div>
          {showHelp && (
            <div className="flex flex-col gap-2 border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-xs text-[var(--text-muted)]">
              <div className="font-semibold uppercase tracking-[0.2em] text-[10px] text-[var(--text-muted)]">
                How to use
              </div>
              <div>
                Paste JSON, JSON arrays, or JSONL. Use the path filters to include or exclude fields, then copy the
                trimmed output. Toggle Structure Only for a schema-like view.
              </div>
            </div>
          )}
        </header>

        <div
          className={`grid grid-cols-1 gap-6 flex-1 min-h-0 lg:grid-rows-[minmax(0,1fr)] ${
            layoutMode === 'three-column'
              ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]'
              : 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]'
          }`}
        >
          {layoutMode === 'three-column' ? (
            <>
              {inputPanel}
              {pathPanel}
              {outputPanel}
            </>
          ) : (
            <>
              <div className="min-w-0 flex flex-col gap-6 lg:flex-1 lg:min-h-0">
                {inputPanel}
                {pathPanel}
              </div>
              {outputPanel}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
