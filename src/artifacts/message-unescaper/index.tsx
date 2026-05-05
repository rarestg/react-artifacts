import { RedoDot, UndoDot } from 'lucide-react';
import { type ReactNode, useId, useMemo, useState } from 'react';
import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { CopyButton } from '../../components/CopyButton';
import StatusTag from '../../components/StatusTag';
import { mergeClassNames } from '../../lib/classNames';

// ---------------------------------------------------------------------------
// Transform functions (pure, testable)
// ---------------------------------------------------------------------------

type Direction = 'unescape' | 'escape';
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
// Shared class strings (matching JSONL viewer patterns)
// ---------------------------------------------------------------------------

const panelHeaderRowClass =
  'flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3';

const panelHeaderSubtitleClass = 'flex flex-wrap items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]';

const headerActionClass =
  'px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:bg-[var(--surface)]';

const segmentBase =
  'h-8 px-3 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] relative focus-visible:z-10';

const segmentActive = 'bg-[var(--accent-weak)] text-[var(--accent)]';
const segmentInactive = 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MessageUnescaper() {
  const inputLabelId = useId();
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('unescape');
  const [wrapOutput, setWrapOutput] = useState(true);
  const [showDashBreaks, setShowDashBreaks] = useState(false);
  const [replaceDashBreaks, setReplaceDashBreaks] = useState(false);

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

  const inputStats = useMemo(() => getStats(input), [input]);
  const outputStats = useMemo(() => getStats(output), [output]);

  return (
    <ArtifactThemeRoot className="min-h-screen bg-[var(--surface-muted)] text-[var(--text)] flex flex-col">
      <div className="mx-auto flex w-full max-w-none flex-col gap-6 px-6 py-10 lg:px-8 xl:px-10">
        {/* Header */}
        <header className="flex flex-col gap-3 border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0 flex flex-col gap-2">
              <h1 className="m-0 text-3xl font-semibold leading-tight">Message Unescaper</h1>
              <p className="m-0 max-w-3xl text-sm text-[var(--text-muted)]">
                Convert escaped sequences to their actual characters, or re-escape text for embedding in strings.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {/* Direction toggle */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Mode
                </span>
                <fieldset
                  aria-label="Direction"
                  className="inline-flex border border-[var(--border-strong)] bg-[var(--border)] gap-px"
                >
                  <button
                    type="button"
                    aria-pressed={direction === 'unescape'}
                    onClick={() => setDirection('unescape')}
                    className={mergeClassNames(segmentBase, direction === 'unescape' ? segmentActive : segmentInactive)}
                  >
                    <span className="relative inline-grid">
                      <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                        Unescape
                      </span>
                      <span className="col-start-1 row-start-1">Unescape</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={direction === 'escape'}
                    onClick={() => setDirection('escape')}
                    className={mergeClassNames(segmentBase, direction === 'escape' ? segmentActive : segmentInactive)}
                  >
                    <span className="relative inline-grid">
                      <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                        Unescape
                      </span>
                      <span className="col-start-1 row-start-1">Escape</span>
                    </span>
                  </button>
                </fieldset>
              </div>
              {/* Word wrap toggle */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Wrap
                </span>
                <fieldset
                  aria-label="Word wrap"
                  className="inline-flex border border-[var(--border-strong)] bg-[var(--border)] gap-px"
                >
                  <button
                    type="button"
                    aria-pressed={wrapOutput}
                    onClick={() => setWrapOutput(true)}
                    className={mergeClassNames(segmentBase, wrapOutput ? segmentActive : segmentInactive)}
                  >
                    <span className="relative inline-grid">
                      <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                        Off
                      </span>
                      <span className="col-start-1 row-start-1">On</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={!wrapOutput}
                    onClick={() => setWrapOutput(false)}
                    className={mergeClassNames(segmentBase, !wrapOutput ? segmentActive : segmentInactive)}
                  >
                    <span className="relative inline-grid">
                      <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                        Off
                      </span>
                      <span className="col-start-1 row-start-1">Off</span>
                    </span>
                  </button>
                </fieldset>
              </div>
            </div>
          </div>
        </header>

        {/* Panels */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input */}
          <section className="min-w-0 flex flex-col">
            <div className="flex flex-col border border-[var(--border)] bg-[var(--surface)]">
              <div className={panelHeaderRowClass}>
                <div>
                  <div
                    id={inputLabelId}
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]"
                  >
                    Input
                  </div>
                  <div className={panelHeaderSubtitleClass}>
                    <span>{formatStatsLine(inputStats.chars, inputStats.lines)}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setInput('')} disabled={!input} className={headerActionClass}>
                  Clear
                </button>
              </div>
              <div className="px-4 py-4">
                <textarea
                  aria-labelledby={inputLabelId}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={direction === 'unescape' ? 'Paste escaped text here...' : 'Paste text to escape here...'}
                  spellCheck={false}
                  wrap={wrapOutput ? 'soft' : 'off'}
                  rows={16}
                  className={mergeClassNames(
                    'w-full min-h-[320px] resize-y overflow-auto border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 font-mono text-xs text-[var(--text)]',
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
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
                    Output
                  </div>
                  <div className={panelHeaderSubtitleClass}>
                    <span>{formatStatsLine(outputStats.chars, outputStats.lines)}</span>
                    <span>{`· ${dashBreakCount} ${dashBreakCount === 1 ? 'dash break' : 'dash breaks'}`}</span>
                  </div>
                </div>
                <CopyButton text={output} idleLabel="Copy Output" disabled={!output} />
              </div>
              <div className="px-4 py-4">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2" title={showDashBreaksTooltip}>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Show Dash Breaks
                    </span>
                    <fieldset
                      aria-label={showDashBreaksTooltip}
                      className="inline-flex border border-[var(--border-strong)] bg-[var(--border)] gap-px"
                    >
                      <button
                        type="button"
                        aria-pressed={showDashBreaks}
                        onClick={() => setShowDashBreaks(true)}
                        disabled={showDashBreaksDisabled}
                        className={mergeClassNames(
                          segmentBase,
                          showDashBreaks ? segmentActive : segmentInactive,
                          'disabled:opacity-40 disabled:pointer-events-none',
                        )}
                      >
                        <span className="relative inline-grid">
                          <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                            Off
                          </span>
                          <span className="col-start-1 row-start-1">On</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={!showDashBreaks}
                        onClick={() => setShowDashBreaks(false)}
                        disabled={showDashBreaksDisabled}
                        className={mergeClassNames(
                          segmentBase,
                          !showDashBreaks ? segmentActive : segmentInactive,
                          'disabled:opacity-40 disabled:pointer-events-none',
                        )}
                      >
                        <span className="relative inline-grid">
                          <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
                            Off
                          </span>
                          <span className="col-start-1 row-start-1">Off</span>
                        </span>
                      </button>
                    </fieldset>
                  </div>
                  <div title={replaceDashBreaksTooltip}>
                    <button
                      type="button"
                      onClick={() => setReplaceDashBreaks((prev) => !prev)}
                      disabled={!output || (!replaceDashBreaks && dashBreakCount === 0)}
                      aria-label={replaceDashBreaksTooltip}
                      aria-pressed={replaceDashBreaks}
                      className={
                        'inline-flex cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)] disabled:opacity-40 disabled:pointer-events-none'
                      }
                    >
                      <StatusTag
                        label="Replace With Periods"
                        reserveLabel="Replace With Periods"
                        active={replaceDashBreaks}
                        icon={
                          replaceDashBreaks ? (
                            <UndoDot className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <RedoDot className="h-3.5 w-3.5" aria-hidden="true" />
                          )
                        }
                      />
                    </button>
                  </div>
                </div>
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
        </div>
      </div>
    </ArtifactThemeRoot>
  );
}
