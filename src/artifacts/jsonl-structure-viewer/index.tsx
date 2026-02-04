import JsonView from '@uiw/react-json-view';
import { darkTheme } from '@uiw/react-json-view/dark';
import { lightTheme } from '@uiw/react-json-view/light';
import { Columns2, Columns3, RectangleVertical } from 'lucide-react';
import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import Checkbox from './components/Checkbox';
import CopyButton, { type CopyButtonHandle } from './components/CopyButton';
import PathList from './components/PathList';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { defaultTruncation, sampleInput } from './lib/constants';
import { applyFilter, applyStructureOnly, truncateValue } from './lib/filtering';
import { formatCompactNumber } from './lib/formatNumber';
import { formatOutput, getItemCount, getOutputStats } from './lib/formatOutput';
import { formatBadge, parseInput } from './lib/parseInput';
import { buildDescendantMap, buildPaths, buildTree, computeEffectiveSelection, flattenTree } from './lib/pathTree';
import { computeResizePlan, type ResizeRect, toResizeRect } from './lib/resizePlan';
import { headerActionClass, panelHeaderRowClass, panelHeaderSubtitleClass } from './lib/ui';
import type { LayoutMode, OutputFormat } from './types';

import './theme.css';

const STORAGE_PREFIX = 'jsonl-structure-viewer-v2';
const LEGACY_STORAGE_PREFIX = 'jsonl-structure-viewer';
const debounceDelay = 300;
const THREE_COLUMN_MIN_WIDTH = 1140;
const TWO_COLUMN_MIN_WIDTH = 900;
const RESIZE_HANDLE_HIT = 16;
const RESIZE_MIN_HEIGHT = 240;
const DEBUG_RESIZE = import.meta.env.DEV;

type OutputView = 'raw' | 'highlighted';

function formatErrorsReport(errors: { line: number; message: string; preview: string }[]) {
  return errors.map((error) => `Line ${error.line}: ${error.message} | ${error.preview}`).join('\n');
}

const formatCount = (value: number, singular: string) => `${value} ${value === 1 ? singular : `${singular}s`}`;
const formatCountCompact = (value: number, singular: string) =>
  `${formatCompactNumber(value)} ${value === 1 ? singular : `${singular}s`}`;

const formatStatsLine = (characters: number, tokens: number, truncated?: number) => {
  const parts = [`${formatCompactNumber(characters)} chars`, `~${formatCountCompact(tokens, 'token')}`];
  if (typeof truncated === 'number') {
    parts.push(`${formatCount(truncated, 'string')} truncated`);
  }
  return parts.join(' | ');
};

const logResize = (...args: unknown[]) => {
  if (!DEBUG_RESIZE) return;
  // eslint-disable-next-line no-console
  console.log('[resize-debug]', ...args);
};

const getResizeRect = (element: HTMLElement | null): ResizeRect | null => {
  if (!element) return null;
  return toResizeRect(element.getBoundingClientRect());
};

const isResizeHandleDoubleClick = (event: ReactMouseEvent<HTMLElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const offsetX = rect.right - event.clientX;
  const offsetY = rect.bottom - event.clientY;
  const hit = offsetX >= 0 && offsetX <= RESIZE_HANDLE_HIT && offsetY >= 0 && offsetY <= RESIZE_HANDLE_HIT;
  logResize('handle hit test', {
    target: event.currentTarget.tagName,
    clientX: event.clientX,
    clientY: event.clientY,
    rect: {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    },
    offsetX,
    offsetY,
    hit,
  });
  return hit;
};

const expandHeightWithoutScroll = (
  element: HTMLElement,
  minHeight: number,
  panel: HTMLElement | null,
  grid: HTMLElement | null,
  content: HTMLElement | null,
  panelContent: HTMLElement | null,
) => {
  const root = document.documentElement;
  const body = document.body;
  const panelRect = getResizeRect(panel);
  const gridRect = getResizeRect(grid);
  const contentRect = getResizeRect(content);
  const panelContentRect = getResizeRect(panelContent);
  const elementRect = toResizeRect(element.getBoundingClientRect());
  const panelContentIsLast = panel && panelContent ? panel.lastElementChild === panelContent : false;
  const plan = computeResizePlan({
    windowInnerHeight: window.innerHeight,
    elementRect,
    panelRect,
    gridRect,
    contentRect,
    panelContentRect,
    panelContentIsLast,
    minHeight,
  });
  logResize('expand start', {
    windowInnerHeight: window.innerHeight,
    rootScrollHeight: root.scrollHeight,
    bodyScrollHeight: body?.scrollHeight,
    viewportSlack: plan.viewportSlack,
    gridSlack: plan.gridSlack,
    panelSlack: plan.panelSlack,
    internalSlack: plan.internalSlack,
    slack: plan.slack,
    safeSlack: plan.safeSlack,
    currentHeight: plan.currentHeight,
    minHeight,
    inlineHeight: element.style.height || '(none)',
    viewportSlackBase: plan.viewportSlackBase,
    contentRect: contentRect
      ? {
          top: contentRect.top,
          bottom: contentRect.bottom,
          height: contentRect.height,
        }
      : null,
    panelRect: panelRect
      ? {
          top: panelRect.top,
          bottom: panelRect.bottom,
          height: panelRect.height,
        }
      : null,
    panelContentRect: panelContentRect
      ? {
          top: panelContentRect.top,
          bottom: panelContentRect.bottom,
          height: panelContentRect.height,
        }
      : null,
    panelContentIsLast,
    gridRect: gridRect
      ? {
          top: gridRect.top,
          bottom: gridRect.bottom,
          height: gridRect.height,
        }
      : null,
    elementRect: {
      top: elementRect.top,
      bottom: elementRect.bottom,
      height: elementRect.height,
    },
  });
  if (!plan.shouldExpand) {
    logResize('expand skipped (no slack)');
    return;
  }
  element.style.height = `${plan.nextHeight}px`;
  const after = element.getBoundingClientRect();
  logResize('expand applied', {
    nextHeight: plan.nextHeight,
    afterHeight: after.height,
    rootScrollHeight: root.scrollHeight,
    bodyScrollHeight: body?.scrollHeight,
  });
};

export default function JsonlStructureViewer() {
  const [input, setInput] = useState(sampleInput);
  const [truncateAt, setTruncateAt] = useLocalStorageState(`${STORAGE_PREFIX}-truncate-at`, defaultTruncation);
  const [wrapOutput, setWrapOutput] = useLocalStorageState(`${STORAGE_PREFIX}-wrap-output`, false);
  const [layoutMode, setLayoutMode] = useLocalStorageState<LayoutMode>(`${STORAGE_PREFIX}-layout`, 'two-column');
  const [outputFormat, setOutputFormat] = useLocalStorageState<OutputFormat>(
    `${STORAGE_PREFIX}-output-format`,
    'pretty',
  );
  const [outputView, setOutputView] = useLocalStorageState<OutputView>(`${STORAGE_PREFIX}-output-view`, 'highlighted');
  const [showDataTypes, setShowDataTypes] = useLocalStorageState(`${STORAGE_PREFIX}-show-types`, false);
  const [showObjectSize, setShowObjectSize] = useLocalStorageState(`${STORAGE_PREFIX}-show-sizes`, false);
  const [enableInlineClipboard, setEnableInlineClipboard] = useLocalStorageState(
    `${STORAGE_PREFIX}-enable-clipboard`,
    false,
  );
  const [structureOnly, setStructureOnly] = useLocalStorageState(`${STORAGE_PREFIX}-structure-only`, false);
  const [onlyLeaves, setOnlyLeaves] = useLocalStorageState(`${STORAGE_PREFIX}-only-leaves`, false);
  const [searchQuery, setSearchQuery] = useLocalStorageState(`${STORAGE_PREFIX}-path-search`, '');
  const [showHelp, setShowHelp] = useLocalStorageState(`${STORAGE_PREFIX}-help`, false);
  const [containerWidth, setContainerWidth] = useState(() => {
    if (typeof window === 'undefined') return THREE_COLUMN_MIN_WIDTH;
    return window.innerWidth;
  });
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  const [selection, setSelection] = useLocalStorageState<Record<string, boolean>>(`${STORAGE_PREFIX}-selection`, {});
  const [expandedPaths, setExpandedPaths] = useLocalStorageState<Record<string, boolean>>(
    `${STORAGE_PREFIX}-expanded`,
    {},
  );

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const copyButtonRef = useRef<CopyButtonHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelsGridRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titlePanelRef = useRef<HTMLElement>(null);
  const inputPanelRef = useRef<HTMLElement>(null);
  const inputCardRef = useRef<HTMLDivElement>(null);
  const pathPanelRef = useRef<HTMLElement>(null);
  const outputPanelRef = useRef<HTMLElement>(null);
  const outputCardRef = useRef<HTMLDivElement>(null);
  const outputResizeRef = useRef<HTMLDivElement>(null);
  const hasLoggedLayoutRef = useRef(false);
  const hasLoggedOutputRef = useRef(false);
  const logPanelMetrics = useCallback((reason: string) => {
    const logPanel = (label: string, element: HTMLElement | null) => {
      if (!element) {
        logResize('panel missing', { label });
        return;
      }
      const rect = element.getBoundingClientRect();
      logResize('panel size', {
        label,
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
      });
    };

    const root = document.documentElement;
    const body = document.body;

    logResize(reason, {
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight,
      rootClientWidth: root.clientWidth,
      rootClientHeight: root.clientHeight,
      rootScrollWidth: root.scrollWidth,
      rootScrollHeight: root.scrollHeight,
      bodyScrollWidth: body?.scrollWidth,
      bodyScrollHeight: body?.scrollHeight,
      containerWidth: containerRef.current?.getBoundingClientRect().width ?? null,
    });
    logPanel('title', titlePanelRef.current);
    logPanel('input', inputPanelRef.current);
    logPanel('path', pathPanelRef.current);
    logPanel('output', outputPanelRef.current);
  }, []);

  const debouncedInput = useDebouncedValue(input, debounceDelay);
  const flushRef = useRef(debouncedInput.flush);
  useEffect(() => {
    flushRef.current = debouncedInput.flush;
  }, [debouncedInput.flush]);
  const parsed = useMemo(() => parseInput(debouncedInput.value), [debouncedInput.value]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storage = window.localStorage;
    const legacyPrefix = `${LEGACY_STORAGE_PREFIX}-`;
    const currentPrefix = `${STORAGE_PREFIX}-`;
    Object.keys(storage).forEach((key) => {
      if (key.startsWith(legacyPrefix) && !key.startsWith(currentPrefix)) {
        storage.removeItem(key);
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handle = window.requestAnimationFrame(() => {
      logPanelMetrics('page load');
    });

    return () => window.cancelAnimationFrame(handle);
  }, [logPanelMetrics]);

  useEffect(() => {
    if (!DEBUG_RESIZE) return;
    const inputElement = inputRef.current;
    const outputElement = outputResizeRef.current;
    if (!inputElement && !outputElement) return;
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement;
        const label = target === inputElement ? 'input textarea' : target === outputElement ? 'output pane' : 'unknown';
        logResize('element resize', {
          label,
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      });
    });

    if (inputElement) observer.observe(inputElement);
    if (outputElement) observer.observe(outputElement);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timeout: number | null = null;
    let raf: number | null = null;

    const handleResize = () => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => {
        if (raf) {
          window.cancelAnimationFrame(raf);
        }
        raf = window.requestAnimationFrame(() => {
          logPanelMetrics('window resize');
        });
      }, 1000);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeout) {
        window.clearTimeout(timeout);
      }
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
    };
  }, [logPanelMetrics]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const updateTheme = () => {
      setIsDarkTheme(root.classList.contains('dark'));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const element = containerRef.current;
    if (!element) return;
    const update = () => {
      const width = element.getBoundingClientRect().width;
      setContainerWidth(width);
      logResize('container resize', { width: Math.round(width) });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

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
        next[node.key] = prev[node.key] ?? true;
      });
      return next;
    });
    setExpandedPaths((prev) => {
      const next: Record<string, boolean> = {};
      flatNodes.forEach((node) => {
        if (prev[node.key]) next[node.key] = true;
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

  const isJsonl = parsed.format === 'jsonl';
  const effectiveOutputFormat = isJsonl ? 'compact' : outputFormat;

  const outputForCopy = useMemo(() => {
    if (!parsed.data) return '';
    return formatOutput(truncated.value, parsed.format, effectiveOutputFormat);
  }, [parsed.data, truncated.value, parsed.format, effectiveOutputFormat]);

  const outputForDisplay = useMemo(() => {
    if (!parsed.data) return '';
    if (outputView === 'raw' && isJsonl && outputFormat === 'pretty') {
      return JSON.stringify(truncated.value, null, 2);
    }
    return outputForCopy;
  }, [parsed.data, outputView, isJsonl, outputFormat, truncated.value, outputForCopy]);

  // Stats reflect the copy payload, not the current view rendering, to keep them stable across toggles.
  const outputStats = useMemo(() => getOutputStats(outputForCopy), [outputForCopy]);
  // Input stats are based on raw input (no trim/debounce) to match user expectations for the source text.
  const inputStats = useMemo(() => {
    if (!input) return { characters: 0, lines: 0 };
    return { characters: input.length, lines: input.split('\n').length };
  }, [input]);
  const itemCount = useMemo(() => getItemCount(parsed.data, parsed.format), [parsed.data, parsed.format]);
  const tokenEstimate = useMemo(() => Math.max(0, Math.round(outputStats.characters / 4)), [outputStats.characters]);
  const inputTokenEstimate = useMemo(() => Math.max(0, Math.round(inputStats.characters / 4)), [inputStats.characters]);
  const layoutWidth = Math.round(containerWidth);
  const canUseThreeColumns = layoutWidth >= THREE_COLUMN_MIN_WIDTH;
  const canUseTwoColumns = layoutWidth >= TWO_COLUMN_MIN_WIDTH;
  const headerStacked = !canUseTwoColumns;
  const visibleLayoutMode = !canUseTwoColumns
    ? 'one-column'
    : canUseThreeColumns
      ? layoutMode
      : layoutMode === 'three-column'
        ? 'two-column'
        : layoutMode;
  const headerGridClass = ['grid gap-6', headerStacked ? 'grid-cols-1' : 'grid-cols-[minmax(0,1fr)_auto]']
    .filter(Boolean)
    .join(' ');
  const headerControlsClass = ['flex flex-col gap-2 min-w-0', headerStacked ? 'items-start w-full' : 'items-end w-auto']
    .filter(Boolean)
    .join(' ');
  const headerControlGroupClass = [
    'min-w-0',
    headerStacked ? 'w-auto max-w-full' : 'w-auto',
    'flex flex-wrap items-center gap-2',
    !headerStacked ? 'justify-end' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const headerControlsRowClass = [
    'min-w-0',
    headerStacked ? 'flex flex-wrap items-center gap-2 w-full' : 'flex flex-col items-end gap-2 w-auto',
  ]
    .filter(Boolean)
    .join(' ');
  const headerHelpButtonClass = [
    'border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]',
    'hover:bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
    headerStacked ? 'ml-auto' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const headerStatusClass = [headerActionClass, 'cursor-default', 'hover:bg-[var(--surface)]']
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (!hasLoggedLayoutRef.current) {
      hasLoggedLayoutRef.current = true;
      return;
    }
    logResize('layout mode change', {
      layoutMode,
      visibleLayoutMode,
      canUseTwoColumns,
      canUseThreeColumns,
      layoutWidth,
    });
  }, [layoutMode, visibleLayoutMode, canUseTwoColumns, canUseThreeColumns, layoutWidth]);

  useEffect(() => {
    if (!hasLoggedOutputRef.current) {
      hasLoggedOutputRef.current = true;
      return;
    }
    logResize('output view change', {
      outputView,
      outputFormat,
      effectiveOutputFormat,
      isJsonl,
    });
  }, [outputView, outputFormat, effectiveOutputFormat, isJsonl]);

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
        next[node.key] = value;
      });
      return next;
    });
  };

  const handleInvertSelection = () => {
    setSelection((prev) => {
      const next = { ...prev };
      flatNodes.forEach((node) => {
        next[node.key] = !(prev[node.key] ?? true);
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
          next[node.key] = true;
        }
      });
      return next;
    });
  };

  const handleCollapseAll = () => {
    setExpandedPaths({});
  };

  const handleResizeDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>, panel: HTMLElement | null, panelContent: HTMLElement | null) => {
      logResize('dblclick handler', { button: event.button, detail: event.detail });
      if (event.button !== 0) {
        logResize('dblclick ignored (non-left button)');
        return;
      }
      if (!isResizeHandleDoubleClick(event)) {
        logResize('dblclick ignored (outside handle)');
        return;
      }
      event.preventDefault();
      expandHeightWithoutScroll(
        event.currentTarget,
        RESIZE_MIN_HEIGHT,
        panel,
        panelsGridRef.current,
        contentRef.current,
        panelContent,
      );
    },
    [],
  );

  const clampTruncation = (value: number) => {
    if (!Number.isFinite(value)) return defaultTruncation;
    return Math.min(200, Math.max(0, Math.floor(value)));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        flushRef.current();
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
  }, []);

  const hasOutput = outputForCopy.length > 0;
  const parsingLabel = debouncedInput.isPending ? 'Parsing...' : 'Up to date';
  const parsingReserveLabel = 'Up to date';
  const inputMetaLine = formatStatsLine(inputStats.characters, inputTokenEstimate);
  const outputMetaLine = formatStatsLine(outputStats.characters, tokenEstimate, truncated.truncated);
  const outputItemsLabel = formatCount(itemCount, 'item');
  const outputLinesLabel = formatCount(outputStats.lines, 'line');

  const errorsReport = parsed.errors.length ? formatErrorsReport(parsed.errors) : '';
  const errorReserveLabel = 'Invalid JSONL. Each line must be valid JSON.';
  const layoutReserveLabel = '3';
  const outputFormatReserveLabel = 'Compact';
  const outputViewReserveLabel = 'Highlighted';
  const wrapReserveLabel = 'Off';
  const jsonViewTheme = isDarkTheme ? darkTheme : lightTheme;

  const inputPanel = (
    <section ref={inputPanelRef} className={['min-w-0 flex flex-col gap-6'].filter(Boolean).join(' ')}>
      <div
        ref={inputCardRef}
        className={['min-w-0 flex flex-col border border-[var(--border)] bg-[var(--surface)]']
          .filter(Boolean)
          .join(' ')}
      >
        <div className={panelHeaderRowClass}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Input</div>
            <div className={panelHeaderSubtitleClass}>
              {parsed.error ? (
                <span className="border border-[var(--danger)] bg-[var(--danger-weak)] px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--danger)]">
                  {parsed.error || errorReserveLabel}
                </span>
              ) : (
                <span>Auto-detect: {formatBadge(parsed.format)}</span>
              )}
              <span>{`· ${inputMetaLine}`}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 min-w-0 basis-full sm:basis-auto">
            <button type="button" onClick={() => setInput('')} className={headerActionClass}>
              Clear
            </button>
            <button type="button" onClick={() => setInput(sampleInput)} className={headerActionClass}>
              Load Sample
            </button>
            <div className={headerStatusClass}>
              <span className="relative inline-grid">
                <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                  {parsingReserveLabel}
                </span>
                <span className="col-start-1 row-start-1">{parsingLabel}</span>
              </span>
            </div>
          </div>
        </div>
        <div className={['flex flex-col gap-4 px-4 py-4'].filter(Boolean).join(' ')}>
          <div className="min-w-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              wrap={wrapOutput ? 'soft' : 'off'}
              spellCheck={false}
              rows={10}
              onDoubleClick={(event) => handleResizeDoubleClick(event, inputPanelRef.current, inputCardRef.current)}
              className={`w-full min-h-[240px] resize-y overflow-auto border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 font-mono text-xs text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] ${
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
                min={0}
                max={200}
                value={truncateAt}
                onChange={(event) => {
                  const raw = event.target.value;
                  setTruncateAt(raw === '' ? defaultTruncation : clampTruncation(Number(raw)));
                }}
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
          <div className={panelHeaderRowClass}>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
                JSONL Errors
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {parsed.errors.length} line{parsed.errors.length === 1 ? '' : 's'} failed to parse.
              </div>
            </div>
            <CopyButton text={errorsReport} idleLabel="Copy Report" className={headerActionClass} />
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
    <section ref={pathPanelRef} className="min-w-0 flex flex-col gap-6 lg:flex-[0.9]">
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
      ref={outputPanelRef}
      className={['min-w-0 flex flex-col gap-6', visibleLayoutMode === 'two-column' ? 'lg:self-stretch' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <div
        ref={outputCardRef}
        className={['flex flex-col border border-[var(--border)] bg-[var(--surface)]'].filter(Boolean).join(' ')}
      >
        <div className={panelHeaderRowClass}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Output</div>
            <div className={panelHeaderSubtitleClass}>
              <span>{`${outputItemsLabel} · ${outputLinesLabel}`}</span>
              <span>{`· ${outputMetaLine}`}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 min-w-0 basis-full sm:basis-auto">
            <CopyButton
              ref={copyButtonRef}
              text={outputForCopy}
              idleLabel="Copy Output"
              className={headerActionClass}
              disabled={!hasOutput}
            />
          </div>
        </div>
        <div className={['flex flex-col gap-4 px-4 py-4'].filter(Boolean).join(' ')}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                View
              </span>
              <fieldset
                aria-label="Output view"
                className="inline-flex border border-[var(--border-strong)] bg-[var(--border)] gap-px"
              >
                <button
                  type="button"
                  aria-pressed={outputView === 'raw'}
                  onClick={() => setOutputView('raw')}
                  className={[
                    'h-8 px-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
                    'relative focus-visible:z-10',
                    outputView === 'raw'
                      ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="relative inline-grid">
                    <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                      {outputViewReserveLabel}
                    </span>
                    <span className="col-start-1 row-start-1">Raw</span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={outputView === 'highlighted'}
                  onClick={() => setOutputView('highlighted')}
                  className={[
                    'h-8 px-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
                    'relative focus-visible:z-10',
                    outputView === 'highlighted'
                      ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="relative inline-grid">
                    <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                      {outputViewReserveLabel}
                    </span>
                    <span className="col-start-1 row-start-1">Highlighted</span>
                  </span>
                </button>
              </fieldset>
            </div>
            {outputView === 'raw' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Format
                </span>
                <fieldset
                  aria-label="Output format"
                  className="inline-flex border border-[var(--border-strong)] bg-[var(--border)] gap-px"
                >
                  <button
                    type="button"
                    onClick={() => setOutputFormat('pretty')}
                    aria-pressed={outputFormat === 'pretty'}
                    className={[
                      'h-8 px-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
                      'relative focus-visible:z-10',
                      outputFormat === 'pretty'
                        ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className="relative inline-grid">
                      <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                        {outputFormatReserveLabel}
                      </span>
                      <span className="col-start-1 row-start-1">Pretty</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputFormat('compact')}
                    aria-pressed={outputFormat === 'compact'}
                    className={[
                      'h-8 px-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
                      'relative focus-visible:z-10',
                      outputFormat === 'compact'
                        ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className="relative inline-grid">
                      <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                        {outputFormatReserveLabel}
                      </span>
                      <span className="col-start-1 row-start-1">Compact</span>
                    </span>
                  </button>
                </fieldset>
              </div>
            )}
            {outputView === 'highlighted' && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Options
                </span>
                <Checkbox
                  checked={showDataTypes}
                  onChange={(event) => setShowDataTypes(event.target.checked)}
                  label="Types"
                  className="text-[10px] uppercase tracking-[0.2em]"
                />
                <Checkbox
                  checked={showObjectSize}
                  onChange={(event) => setShowObjectSize(event.target.checked)}
                  label="Sizes"
                  className="text-[10px] uppercase tracking-[0.2em]"
                />
                <Checkbox
                  checked={enableInlineClipboard}
                  onChange={(event) => setEnableInlineClipboard(event.target.checked)}
                  label="Clipboard"
                  className="text-[10px] uppercase tracking-[0.2em]"
                />
              </div>
            )}
          </div>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: support double-click on native resize handle */}
          <div
            ref={outputResizeRef}
            className={[
              'min-w-0 min-h-[240px] h-[clamp(240px,40vh,520px)] border border-[var(--border)] bg-[var(--surface-muted)] resize-y overflow-auto',
            ]
              .filter(Boolean)
              .join(' ')}
            onDoubleClick={(event) => handleResizeDoubleClick(event, outputPanelRef.current, outputCardRef.current)}
          >
            {outputView === 'highlighted' && parsed.data ? (
              <JsonView
                value={truncated.value as object}
                displayDataTypes={showDataTypes}
                displayObjectSize={showObjectSize}
                enableClipboard={enableInlineClipboard}
                shortenTextAfterLength={0}
                highlightUpdates={false}
                style={{ ...jsonViewTheme, whiteSpace: wrapOutput ? 'pre-wrap' : 'pre' }}
                className={`min-w-0 p-3 text-xs leading-relaxed ${wrapOutput ? 'break-words' : ''}`}
              />
            ) : (
              <pre
                className={`min-w-0 p-3 text-xs leading-relaxed text-[var(--text)] ${
                  wrapOutput ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                }`}
              >
                {outputForDisplay || 'Waiting for valid JSON...'}
              </pre>
            )}
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            Output updates after {debounceDelay}ms. Use Cmd/Ctrl+Enter to parse immediately.
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <ArtifactThemeRoot
      ref={containerRef}
      className="jsonl-structure-theme min-h-screen bg-[var(--surface-muted)] text-[var(--text)] flex flex-col"
    >
      <div ref={contentRef} className="mx-auto flex w-full max-w-none flex-col gap-6 px-6 py-10 lg:px-8 xl:px-10">
        <header
          ref={titlePanelRef}
          className="flex flex-col gap-3 border border-[var(--border)] bg-[var(--surface)] p-6"
        >
          <div className={headerGridClass}>
            <div className="min-w-0 flex flex-col gap-2">
              <h1 className="m-0 text-3xl font-semibold leading-tight">JSONL Structure Viewer</h1>
              <p className="m-0 max-w-3xl text-sm text-[var(--text-muted)]">
                Explore JSON arrays, single objects, or JSONL streams. Trim long strings, filter by path, and copy a
                structure-first view without the noise.
              </p>
            </div>
            <div className={headerControlsClass}>
              {canUseTwoColumns && (
                <div className={headerControlGroupClass}>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Layout
                  </span>
                  <fieldset
                    aria-label="Layout mode"
                    className="inline-flex border border-[var(--border-strong)] bg-[var(--border)] gap-px"
                  >
                    <button
                      type="button"
                      aria-pressed={visibleLayoutMode === 'one-column'}
                      onClick={() => setLayoutMode('one-column')}
                      className={[
                        'h-8 px-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none',
                        'inline-flex items-center gap-1.5',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
                        'relative focus-visible:z-10',
                        visibleLayoutMode === 'one-column'
                          ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                          : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span className="relative inline-grid">
                        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                          {layoutReserveLabel}
                        </span>
                        <span className="col-start-1 row-start-1">1</span>
                      </span>
                      <RectangleVertical className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-pressed={visibleLayoutMode === 'two-column'}
                      onClick={() => setLayoutMode('two-column')}
                      className={[
                        'h-8 px-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none',
                        'inline-flex items-center gap-1.5',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
                        'relative focus-visible:z-10',
                        visibleLayoutMode === 'two-column'
                          ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                          : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span className="relative inline-grid">
                        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                          {layoutReserveLabel}
                        </span>
                        <span className="col-start-1 row-start-1">2</span>
                      </span>
                      <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {canUseThreeColumns && (
                      <button
                        type="button"
                        aria-pressed={visibleLayoutMode === 'three-column'}
                        onClick={() => setLayoutMode('three-column')}
                        className={[
                          'h-8 px-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none',
                          'inline-flex items-center gap-1.5',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
                          'relative focus-visible:z-10',
                          visibleLayoutMode === 'three-column'
                            ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                            : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <span className="relative inline-grid">
                          <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                            {layoutReserveLabel}
                          </span>
                          <span className="col-start-1 row-start-1">3</span>
                        </span>
                        <Columns3 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </fieldset>
                </div>
              )}
              <div className={headerControlsRowClass}>
                <div className={headerControlGroupClass}>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Word Wrap
                  </span>
                  <fieldset
                    aria-label="Word wrap"
                    className="inline-flex border border-[var(--border-strong)] bg-[var(--border)] gap-px"
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
                <button type="button" onClick={() => setShowHelp((prev) => !prev)} className={headerHelpButtonClass}>
                  {showHelp ? 'Hide Help' : 'Show Help'}
                </button>
              </div>
            </div>
          </div>
          {showHelp && (
            <div className="flex flex-col gap-3 border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-xs text-[var(--text-muted)]">
              <div className="flex flex-col gap-2">
                <div className="font-semibold uppercase tracking-[0.2em] text-[10px] text-[var(--text-muted)]">
                  How to use
                </div>
                <div>
                  Paste JSON, JSON arrays, or JSONL. Use the path filters to include or exclude fields, then copy the
                  trimmed output. Toggle Structure Only for a schema-like view.
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Shortcuts
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]">
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
              </div>
            </div>
          )}
        </header>

        <div
          ref={panelsGridRef}
          className={`grid grid-cols-1 gap-6 ${
            visibleLayoutMode === 'three-column'
              ? 'lg:grid-cols-[minmax(0,10fr)_minmax(0,9fr)_minmax(0,9fr)]'
              : visibleLayoutMode === 'two-column'
                ? 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start'
                : ''
          }`}
        >
          {visibleLayoutMode === 'two-column' ? (
            <>
              <div className="min-w-0 flex flex-col gap-6 lg:self-start">
                {inputPanel}
                {outputPanel}
              </div>
              {pathPanel}
            </>
          ) : (
            <>
              {inputPanel}
              {pathPanel}
              {outputPanel}
            </>
          )}
        </div>
      </div>
    </ArtifactThemeRoot>
  );
}
