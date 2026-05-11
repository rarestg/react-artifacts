import { Columns2, RectangleVertical } from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { CopyButton } from '../../components/CopyButton';
import {
  panelHeaderActionClass as headerActionClass,
  panelHeaderMetaClass,
  panelHeaderRowClass,
  panelHeaderTextClass,
  panelHeaderTitleClass,
} from '../../components/panelHeaderClasses';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Toggle } from '../../components/Toggle';
import { mergeClassNames } from '../../lib/classNames';
import { useLocalStorageState } from '../../lib/useLocalStorageState';

// ---------------------------------------------------------------------------
// Transform functions (pure, testable)
// ---------------------------------------------------------------------------

type Direction = 'unescape' | 'escape';
type PanelLayoutMode = 'one-column' | 'two-column';
type TextRange = { start: number; end: number };

const dashBreakTokenPattern = /--|—/g;
const sentenceBreakMarker = '\uE000';

function isSpaceOrTab(character: string): boolean {
  return character === ' ' || character === '\t';
}

function hasNonWhitespaceBeforeOnLine(text: string, index: number): boolean {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const char = text[cursor];
    if (char === '\n' || char === '\r') return false;
    if (char !== ' ' && char !== '\t') return true;
  }

  return false;
}

function hasNonWhitespaceAfterOnLine(text: string, index: number): boolean {
  for (let cursor = index; cursor < text.length; cursor += 1) {
    const char = text[cursor];
    if (char === '\n' || char === '\r') return false;
    if (char !== ' ' && char !== '\t') return true;
  }

  return false;
}

function isEligibleDashBreak(text: string, start: number, end: number): boolean {
  const leftNeighbor = start > 0 ? text[start - 1] : '';
  const rightNeighbor = end < text.length ? text[end] : '';
  if (!isSpaceOrTab(leftNeighbor) || !isSpaceOrTab(rightNeighbor)) {
    return false;
  }

  const token = text.slice(start, end);

  if (token === '--') {
    const prevChar = start > 1 ? text[start - 2] : '';
    const nextChar = end + 1 < text.length ? text[end + 1] : '';
    if (prevChar === '-' || nextChar === '-') {
      return false;
    }
  }

  return hasNonWhitespaceBeforeOnLine(text, start) && hasNonWhitespaceAfterOnLine(text, end);
}

function findDashBreakRanges(text: string): TextRange[] {
  const ranges: TextRange[] = [];

  for (const match of text.matchAll(dashBreakTokenPattern)) {
    if (typeof match.index !== 'number') continue;
    const start = match.index;
    const end = start + match[0].length;
    if (!isEligibleDashBreak(text, start, end)) continue;
    ranges.push({ start, end });
  }

  return ranges;
}

function capitalizeSentenceStart(segment: string): string {
  const prefixMatch = segment.match(/^[\s"'`([{<“‘]*/);
  const prefixLength = prefixMatch?.[0].length ?? 0;
  const tokenMatch = segment.slice(prefixLength).match(/^[A-Za-z][A-Za-z0-9_-]*/);
  if (!tokenMatch) return segment;

  const token = tokenMatch[0];
  const tokenStart = prefixLength;
  const tokenEnd = tokenStart + token.length;
  const firstChar = token[0];
  const shouldSkipCapitalization =
    token.includes('_') ||
    token.includes('-') ||
    segment.slice(tokenEnd).startsWith('://') ||
    /[A-Z]/.test(token.slice(1));

  if (!/[a-z]/.test(firstChar) || shouldSkipCapitalization) {
    return segment;
  }

  return `${segment.slice(0, tokenStart)}${firstChar.toUpperCase()}${segment.slice(tokenStart + 1)}`;
}

function finalizeDashSentenceBreaks(text: string): string {
  if (!text.includes(sentenceBreakMarker)) return text;

  const segments = text.split(sentenceBreakMarker);
  let result = segments[0];

  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index];
    result = result.replace(/[ \t]+$/, '');
    result += '.';

    if (!segment) continue;

    if (!/^[\r\n]/.test(segment)) {
      result += ' ';
    }

    result += capitalizeSentenceStart(segment);
  }

  return result;
}

function replaceDashBreaksWithPeriods(text: string): string {
  if (!text) return text;
  const ranges = findDashBreakRanges(text);
  if (!ranges.length) return text;

  let transformed = '';
  let lastIndex = 0;

  for (const range of ranges) {
    let start = range.start;
    let end = range.end;

    while (start > lastIndex && (text[start - 1] === ' ' || text[start - 1] === '\t')) {
      start -= 1;
    }
    while (end < text.length && (text[end] === ' ' || text[end] === '\t')) {
      end += 1;
    }

    transformed += text.slice(lastIndex, start);
    transformed = transformed.replace(/[ \t]+$/, '');

    const lastChar = transformed[transformed.length - 1];
    transformed += lastChar === '.' || lastChar === '!' || lastChar === '?' ? ' ' : sentenceBreakMarker;
    lastIndex = end;
  }

  transformed += text.slice(lastIndex);
  return finalizeDashSentenceBreaks(transformed);
}

function buildContextHighlightRanges(ranges: TextRange[], textLength: number, contextChars = 2): TextRange[] {
  if (!ranges.length) return [];

  const merged: TextRange[] = [];

  ranges.forEach((range) => {
    const start = Math.max(0, range.start - contextChars);
    const end = Math.min(textLength, range.end + contextChars);
    const previous = merged[merged.length - 1];

    if (!previous || start > previous.end) {
      merged.push({ start, end });
      return;
    }

    previous.end = Math.max(previous.end, end);
  });

  return merged;
}

function renderDashHighlights(text: string, ranges: TextRange[]): ReactNode {
  if (!ranges.length) return text;
  const highlightRanges = buildContextHighlightRanges(ranges, text.length);
  if (!highlightRanges.length) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;

  highlightRanges.forEach((range) => {
    if (range.start > cursor) {
      parts.push(text.slice(cursor, range.start));
    }

    parts.push(
      <span
        key={`${range.start}-${range.end}`}
        className="bg-[var(--warning-weak)] text-[var(--warning)] font-semibold"
      >
        {text.slice(range.start, range.end)}
      </span>,
    );

    cursor = range.end;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

/** Single-pass unescape handling JSON escape sequences + special whitespace. */
function unescapeText(text: string): string {
  return text
    .replace(/\\(["\\/bfnrt]|u[0-9a-fA-F]{4})/g, (_match, seq: string) => {
      switch (seq) {
        case 'n':
          return '\n';
        case 't':
          return '\t';
        case 'r':
          return '\r';
        case '"':
          return '"';
        case '\\':
          return '\\';
        case '/':
          return '/';
        case 'b':
          return '\b';
        case 'f':
          return '\f';
        default:
          if (seq.startsWith('u')) {
            return String.fromCharCode(Number.parseInt(seq.slice(1), 16));
          }
          return _match;
      }
    })
    .replace(/[\u00a0\u2007\u2009\u200a\u202f]/g, ' ');
}

/** Escape text for embedding in a JSON-style string. */
function escapeText(text: string): string {
  return JSON.stringify(text).slice(1, -1);
}

function getStats(text: string) {
  if (!text) return { chars: 0, lines: 0 };
  return { chars: text.length, lines: text.split('\n').length };
}

const formatCompact = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
};

const formatStatsLine = (chars: number, lines: number) =>
  `${formatCompact(chars)} chars · ${lines} ${lines === 1 ? 'line' : 'lines'}`;

// ---------------------------------------------------------------------------
// Local class strings
// ---------------------------------------------------------------------------

const panelBodyToolbarClass =
  'flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--border)] px-4 py-2';

const MESSAGE_PANEL_MIN_WIDTH = 400;
const MESSAGE_PANEL_GAP = 16;
const MESSAGE_TWO_COLUMN_MIN_WIDTH = MESSAGE_PANEL_MIN_WIDTH * 2 + MESSAGE_PANEL_GAP;
const MESSAGE_LAYOUT_STORAGE_KEY = 'message-unescaper-layout';

function getElementContentWidth(element: HTMLElement): number {
  const styles = window.getComputedStyle(element);
  const borderX = (Number.parseFloat(styles.borderLeftWidth) || 0) + (Number.parseFloat(styles.borderRightWidth) || 0);
  const paddingX = (Number.parseFloat(styles.paddingLeft) || 0) + (Number.parseFloat(styles.paddingRight) || 0);

  return Math.max(0, element.getBoundingClientRect().width - borderX - paddingX);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MessageUnescaper() {
  const mainRef = useRef<HTMLElement>(null);
  const inputLabelId = useId();
  const showDashBreaksDescriptionId = useId();
  const replaceDashBreaksDescriptionId = useId();
  const [preferredPanelLayout, setPreferredPanelLayout] = useLocalStorageState<PanelLayoutMode>(
    MESSAGE_LAYOUT_STORAGE_KEY,
    'two-column',
  );
  const [mainContentWidth, setMainContentWidth] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('unescape');
  const [wrapOutput, setWrapOutput] = useState(true);
  const [showDashBreaks, setShowDashBreaks] = useState(false);
  const [replaceDashBreaks, setReplaceDashBreaks] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const element = mainRef.current;
    if (!element) return;

    setMainContentWidth(getElementContentWidth(element));
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setMainContentWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const baseOutput = useMemo(() => {
    if (!input) return '';
    return direction === 'unescape' ? unescapeText(input) : escapeText(input);
  }, [input, direction]);

  const dashBreakRanges = useMemo(() => findDashBreakRanges(baseOutput), [baseOutput]);
  const dashBreakCount = dashBreakRanges.length;
  const output = useMemo(
    () => (replaceDashBreaks ? replaceDashBreaksWithPeriods(baseOutput) : baseOutput),
    [baseOutput, replaceDashBreaks],
  );
  const outputDisplay = useMemo(() => {
    if (!showDashBreaks || replaceDashBreaks || !dashBreakRanges.length) {
      return output;
    }

    return renderDashHighlights(output, dashBreakRanges);
  }, [dashBreakRanges, output, replaceDashBreaks, showDashBreaks]);

  const replaceDashBreaksActionLabel = replaceDashBreaks
    ? 'Undo period replacement'
    : 'Replace dash breaks with periods';
  const replaceDashBreaksDisabledLabel = !output
    ? 'Enter text to enable dash replacement'
    : !replaceDashBreaks && dashBreakCount === 0
      ? 'No dash breaks found to replace'
      : '';
  const replaceDashBreaksTooltip = replaceDashBreaksDisabledLabel || replaceDashBreaksActionLabel;
  const showDashBreaksDisabled = dashBreakCount === 0;
  const showDashBreaksTooltip = !output
    ? 'Enter text to detect dash breaks'
    : showDashBreaksDisabled
      ? 'No dash breaks found to highlight'
      : 'Highlight detected dash breaks in output';
  const replaceDashBreaksDisabled = !output || (!replaceDashBreaks && dashBreakCount === 0);

  const inputStats = useMemo(() => getStats(input), [input]);
  const outputStats = useMemo(() => getStats(output), [output]);
  const canUseTwoColumnLayout = mainContentWidth !== null && mainContentWidth >= MESSAGE_TWO_COLUMN_MIN_WIDTH;
  const visiblePanelLayout: PanelLayoutMode = canUseTwoColumnLayout ? preferredPanelLayout : 'one-column';

  return (
    <ArtifactThemeRoot className="flex min-h-screen flex-col bg-[var(--surface-muted)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-semibold">Message Unescaper</h1>
            <p className="mt-1 max-w-3xl text-xs text-[var(--text-muted)]">
              Convert escaped sequences to characters, or re-escape text for strings.
            </p>
          </div>
          <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-x-4 gap-y-2">
            {canUseTwoColumnLayout && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Layout
                </span>
                <SegmentedControl
                  ariaLabel="Panel layout"
                  value={visiblePanelLayout}
                  onValueChange={setPreferredPanelLayout}
                  size="default"
                  tone="accent"
                  options={[
                    {
                      value: 'one-column',
                      label: '1',
                      ariaLabel: 'One column layout',
                      reserveLabel: '2',
                      icon: <RectangleVertical className="size-3.5" aria-hidden="true" />,
                    },
                    {
                      value: 'two-column',
                      label: '2',
                      ariaLabel: 'Two column layout',
                      reserveLabel: '2',
                      icon: <Columns2 className="size-3.5" aria-hidden="true" />,
                    },
                  ]}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Wrap
              </span>
              <SegmentedControl
                ariaLabel="Word wrap"
                value={wrapOutput ? 'on' : 'off'}
                onValueChange={(nextValue) => setWrapOutput(nextValue === 'on')}
                size="default"
                tone="accent"
                options={[
                  { value: 'on', label: 'On' },
                  { value: 'off', label: 'Off' },
                ]}
              />
            </div>
          </div>
        </div>
      </header>

      <main
        ref={mainRef}
        className={mergeClassNames(
          'grid flex-1 grid-cols-1 gap-4 p-4',
          visiblePanelLayout === 'two-column' && 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)]',
        )}
      >
        {/* Input */}
        <section className="min-w-0 flex flex-col">
          <div className="flex flex-col border border-[var(--border)] bg-[var(--surface)]">
            <div className={panelHeaderRowClass}>
              <div className={panelHeaderTextClass}>
                <div id={inputLabelId} className={panelHeaderTitleClass}>
                  Input
                </div>
                <div className={panelHeaderMetaClass}>
                  <span>{formatStatsLine(inputStats.chars, inputStats.lines)}</span>
                </div>
              </div>
              <button type="button" onClick={() => setInput('')} disabled={!input} className={headerActionClass}>
                Clear
              </button>
            </div>
            <div className={panelBodyToolbarClass}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Mode
                </span>
                <SegmentedControl
                  ariaLabel="Direction"
                  value={direction}
                  onValueChange={setDirection}
                  size="compact"
                  tone="accent"
                  options={[
                    { value: 'unescape', label: 'Unescape' },
                    { value: 'escape', label: 'Escape' },
                  ]}
                />
              </div>
            </div>
            <div className="p-4">
              <textarea
                aria-labelledby={inputLabelId}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={direction === 'unescape' ? 'Paste escaped text here...' : 'Paste text to escape here...'}
                spellCheck={false}
                wrap={wrapOutput ? 'soft' : 'off'}
                rows={16}
                className={mergeClassNames(
                  'block w-full min-h-[320px] resize-y overflow-auto border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 font-mono text-xs text-[var(--text)]',
                  'placeholder:text-[var(--text-subtle)]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
                  wrapOutput ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
                )}
              />
            </div>
          </div>
        </section>

        {/* Output */}
        <section className="min-w-0 flex flex-col">
          <div className="flex flex-col border border-[var(--border)] bg-[var(--surface)]">
            <div className={panelHeaderRowClass}>
              <div className={panelHeaderTextClass}>
                <div className={panelHeaderTitleClass}>Output</div>
                <div className={panelHeaderMetaClass}>
                  <span>{formatStatsLine(outputStats.chars, outputStats.lines)}</span>
                  <span>{`· ${dashBreakCount} ${dashBreakCount === 1 ? 'dash break' : 'dash breaks'}`}</span>
                </div>
              </div>
              <CopyButton text={output} idleLabel="Copy Output" disabled={!output} />
            </div>
            <div className={panelBodyToolbarClass}>
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                <Toggle
                  label="Show dash breaks"
                  checked={showDashBreaks}
                  onCheckedChange={setShowDashBreaks}
                  disabled={showDashBreaksDisabled}
                  title={showDashBreaksTooltip}
                  aria-describedby={showDashBreaksDescriptionId}
                  labelClassName="text-xs"
                />
                <span id={showDashBreaksDescriptionId} className="sr-only">
                  {showDashBreaksTooltip}
                </span>
                <Toggle
                  label="Replace with periods"
                  checked={replaceDashBreaks}
                  onCheckedChange={setReplaceDashBreaks}
                  disabled={replaceDashBreaksDisabled}
                  title={replaceDashBreaksTooltip}
                  aria-describedby={replaceDashBreaksDescriptionId}
                  labelClassName="text-xs"
                />
                <span id={replaceDashBreaksDescriptionId} className="sr-only">
                  {replaceDashBreaksTooltip}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="w-full min-h-[320px] max-h-[80vh] overflow-auto border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2">
                {output ? (
                  <pre
                    className={mergeClassNames(
                      'font-mono text-xs text-[var(--text)] leading-relaxed',
                      wrapOutput ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
                    )}
                  >
                    {outputDisplay}
                  </pre>
                ) : (
                  <span className="text-xs text-[var(--text-subtle)]">
                    {direction === 'unescape'
                      ? 'Unescaped output will appear here...'
                      : 'Escaped output will appear here...'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </ArtifactThemeRoot>
  );
}
