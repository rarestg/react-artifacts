import { Loader2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Panel } from '../../../components/Panel';
import { panelHeaderRowClass, panelHeaderTitleClass } from '../../../components/panelHeaderClasses';
import { actualCost, estimateCost, formatCost, formatCostRange } from '../core/cost';
import type { Controller } from '../useController';
import { PageStateChip, PageStateMark, ProgressBar } from './primitives';

const spin = 'h-3 w-3 animate-spin motion-reduce:animate-none';
const sectionLabel = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]';
const numCell = 'px-3 py-1.5 text-right font-mono text-xs tabular-nums';
const thLeft = 'px-3 py-1.5 text-left font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]';
const thRight = 'px-3 py-1.5 text-right font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]';

function CountItem({ state, label, count }: { state: 'ok' | 'suspect' | 'failed'; label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-[var(--text)]">
      <PageStateMark state={state} />
      {label} {count}
    </span>
  );
}

/**
 * Sharp horizontal gauge: the whole track spans the estimate's LOW→HIGH range and the accent tick marks
 * where the actual landed within it, clamped to the rails. Decorative reinforcement only — the verdict
 * word and the cost numbers carry the meaning, so it is aria-hidden.
 */
function CostGauge({ low, high, actual }: { low: number; high: number; actual: number }) {
  const denom = high - low;
  const t = denom > 0 ? Math.min(1, Math.max(0, (actual - low) / denom)) : 0.5;
  return (
    <span
      aria-hidden="true"
      className="relative mx-1 inline-block h-2 w-16 shrink-0 border border-[var(--border)] bg-[var(--surface-strong)] align-[-1px]"
    >
      <span
        className="absolute inset-y-0 w-[1.5px] -translate-x-1/2 bg-[var(--accent)]"
        style={{ left: `${t * 100}%` }}
      />
    </span>
  );
}

/**
 * Compact per-page duration sparkline. Bars are bucketed to a fixed cell count when there are more pages
 * than cells (so a 100-page run stays ~32 bars), heights normalize against the slowest page with a min
 * floor so quick pages stay visible. Decorative (aria-hidden); the numeric summary is the accessible text.
 */
function Sparkline({ values }: { values: number[] }) {
  const CELLS = 32;
  const bars =
    values.length <= CELLS
      ? values
      : Array.from({ length: CELLS }, (_, b) => {
          const start = Math.floor((b * values.length) / CELLS);
          const end = Math.max(Math.floor(((b + 1) * values.length) / CELLS), start + 1);
          const slice = values.slice(start, end);
          return slice.reduce((sum, v) => sum + v, 0) / slice.length;
        });
  const max = Math.max(...bars);
  // Stable per-position id keeps the key off the raw map index (lint) — this list never reorders.
  const cells = bars.map((v, i) => ({ id: `bar-${i}`, height: max > 0 ? Math.max(10, (v / max) * 100) : 100 }));
  return (
    <span aria-hidden="true" className="inline-flex h-6 items-end gap-px align-middle">
      {cells.map((cell) => (
        <span key={cell.id} className="w-1 shrink-0 bg-[var(--text-subtle)]" style={{ height: `${cell.height}%` }} />
      ))}
    </span>
  );
}

export function RunReport({ vm }: { vm: Controller }) {
  const snap = vm.runSnapshot;
  if (!snap) return null;

  const { completed, total } = vm.state;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const notStarted = Math.max(0, snap.selectedCount - completed);

  const suffix =
    vm.activeRunKind === 'retry'
      ? 're-OCR pages'
      : vm.activeRunKind === 'initial'
        ? `${pct}%`
        : vm.state.status === 'error' || vm.state.status === 'cancelled'
          ? 'stopped'
          : `${pct}%`;
  const annotation =
    vm.activeRunKind === 'initial'
      ? vm.activity.inFlight > 0
        ? `· ${vm.activity.inFlight} in flight`
        : ''
      : vm.activeRunKind === 'retry'
        ? `· resolving ${vm.state.total}`
        : vm.state.status === 'error' || vm.state.status === 'cancelled'
          ? `· ${notStarted} not started`
          : '';

  // Cost: estimate from the immutable snapshot; actual from the live per-model ledger.
  const est = estimateCost(snap.model, snap.selectedCount, snap.mediaResolution);
  const estPriced = est.priced && est.costLow !== null && est.costHigh !== null;
  const estText = estPriced ? formatCostRange(est.costLow as number, est.costHigh as number) : 'unpriced model';
  const actualText = vm.hasCost ? formatCost(vm.actualTotal) : '—';
  const actualLabel = vm.running ? 'Actual so far' : vm.hasCost && !vm.allPriced ? 'Priced subtotal' : 'Actual';
  let verdict = '';
  if (vm.state.status === 'done' && vm.allPriced && estPriced && vm.hasCost) {
    const mid = ((est.costLow as number) + (est.costHigh as number)) / 2;
    const ratio = Math.round((vm.actualTotal / mid - 1) * 100);
    verdict =
      vm.actualTotal > (est.costHigh as number)
        ? `+${ratio}% over`
        : vm.actualTotal < (est.costLow as number)
          ? `${ratio}% under`
          : 'on target';
  }

  const timings = vm.state.results.filter((result) => !result.error && result.elapsedMs > 0).map((r) => r.elapsedMs);
  const timing =
    timings.length > 0
      ? {
          avg: timings.reduce((sum, value) => sum + value, 0) / timings.length / 1000,
          fastest: Math.min(...timings) / 1000,
          slowest: Math.max(...timings) / 1000,
        }
      : null;

  // Flagged: while retrying we show the resolving pages one-per-row; once settled we GROUP the
  // suspect/failed results by (state + reason) so 11 identical timeouts collapse to a single row.
  // Presentation-only — the retry source stays vm.flaggedPages, untouched.
  const showFlagged = vm.activeRunKind !== 'initial' && (vm.flaggedPages.length > 0 || vm.retrying);
  const flaggedGroups = (() => {
    const groups = new Map<
      string,
      {
        kind: 'failed' | 'suspect';
        reason: string;
        pages: number[];
        cost: number;
        anyPriced: boolean;
        anyUnpriced: boolean;
      }
    >();
    for (const result of vm.state.results) {
      if (!result.error && !result.warning) continue;
      const kind: 'failed' | 'suspect' = result.error ? 'failed' : 'suspect';
      const reason = (result.error ?? result.warning ?? '').trim() || 'No detail';
      const key = `${kind}|${reason}`;
      const cost = actualCost(result.model ?? snap.model, result.inputTokens ?? 0, result.outputTokens ?? 0);
      let group = groups.get(key);
      if (!group) {
        group = { kind, reason, pages: [], cost: 0, anyPriced: false, anyUnpriced: false };
        groups.set(key, group);
      }
      group.pages.push(result.pageNumber);
      if (cost === null) group.anyUnpriced = true;
      else {
        group.cost += cost;
        group.anyPriced = true;
      }
    }
    return [...groups.values()]
      .map((group) => ({ ...group, pages: group.pages.sort((a, b) => a - b) }))
      .sort((a, b) => b.pages.length - a.pages.length);
  })();
  const PAGE_LIST_CAP = 12;

  const totalPages = vm.ledgerRows.reduce((sum, row) => sum + row.billedPages, 0);
  const totalTokens = vm.ledgerRows.reduce((sum, row) => sum + row.inputTokens + row.outputTokens, 0);

  return (
    <Panel>
      <div className={panelHeaderRowClass}>
        <h2 className={panelHeaderTitleClass}>Run report</h2>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="space-y-1">
          <ProgressBar
            value={completed}
            max={total}
            tone={vm.running ? 'accent' : 'neutral'}
            active={vm.running}
            label="OCR progress"
          />
          <div className="flex items-center justify-between font-mono text-xs tabular-nums text-[var(--text-muted)]">
            <span>
              {completed} / {total}
            </span>
            <span>{suffix}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <CountItem state="ok" label="ok" count={vm.counts.ok} />
          <CountItem state="suspect" label="suspect" count={vm.counts.suspect} />
          <CountItem state="failed" label="failed" count={vm.counts.failed} />
          {annotation && <span className="text-xs tabular-nums text-[var(--text-muted)]">{annotation}</span>}
          {vm.running && vm.activity.retrying > 0 && (
            // Auto 429/503 back-off — distinct from the manual "re-OCR-ing"; never color-alone (spinner + label).
            <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-[var(--warning)]">
              <Loader2 className={spin} aria-hidden="true" />
              {vm.activity.retrying} backing off
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm tabular-nums text-[var(--text)]">
            Est. {estText} · {actualLabel} {actualText}
            {estPriced && vm.hasCost && (
              <CostGauge low={est.costLow as number} high={est.costHigh as number} actual={vm.actualTotal} />
            )}
            {verdict && <span className="text-[var(--text-muted)]"> ({verdict})</span>}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Actual includes retries and failed attempts that reached the API.
            {vm.hasCost && !vm.allPriced && ' Some models aren’t in the price table (priced subtotal only).'}
          </p>
        </div>

        {timing && (
          <div className="flex flex-wrap items-center gap-2">
            <Sparkline values={timings} />
            <span className="text-sm tabular-nums text-[var(--text)]">
              Per page avg {timing.avg.toFixed(1)}s{' '}
              <span className="text-[var(--text-muted)]">
                ({timing.fastest.toFixed(1)}–{timing.slowest.toFixed(1)}s)
              </span>
            </span>
          </div>
        )}

        {vm.activeRunKind === 'initial' && (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="danger" size="sm" onClick={vm.cancel}>
              Cancel (keep done)
            </Button>
            <span className="text-xs text-[var(--text-muted)]">keeps finished pages</span>
          </div>
        )}

        {showFlagged && (
          <div className="space-y-1.5">
            <div className={sectionLabel}>Flagged</div>
            <div className="overflow-x-auto border border-[var(--border)]">
              {vm.retrying && vm.activeRetry ? (
                // Transient retrying view — one row per resolving page (unchanged shape).
                <table className="w-full min-w-[28rem] border-collapse text-xs">
                  <thead className="bg-[var(--surface-muted)]">
                    <tr className="border-b border-[var(--border)]">
                      <th scope="col" className={thLeft}>
                        Page
                      </th>
                      <th scope="col" className={thLeft}>
                        State
                      </th>
                      <th scope="col" className={thLeft}>
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vm.activeRetry.pages.map((page) => (
                      <tr key={page} className="border-b border-[var(--border)] last:border-b-0 align-top">
                        <td className="px-3 py-1.5 font-mono tabular-nums text-[var(--text)]">{page}</td>
                        <td className="whitespace-nowrap px-3 py-1.5">
                          <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
                            <Loader2 className={spin} aria-hidden="true" />
                            re-OCR-ing
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-[var(--text-muted)]">
                          re-OCR-ing on {vm.activeRetry?.model ?? ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                // Settled view — grouped by (state + reason): one row per distinct failure.
                <table className="w-full min-w-[32rem] border-collapse text-xs">
                  <thead className="bg-[var(--surface-muted)]">
                    <tr className="border-b border-[var(--border)]">
                      <th scope="col" className={thLeft}>
                        State
                      </th>
                      <th scope="col" className={thLeft}>
                        Note
                      </th>
                      <th scope="col" className={thLeft}>
                        Pages
                      </th>
                      <th scope="col" className={thRight}>
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {flaggedGroups.map((group) => {
                      const shown = group.pages.slice(0, PAGE_LIST_CAP);
                      const more = group.pages.length - shown.length;
                      const costLabel = group.anyPriced
                        ? `${formatCost(group.cost)}${group.anyUnpriced ? '+' : ''}`
                        : '—';
                      return (
                        <tr
                          key={`${group.kind}|${group.reason}`}
                          className="border-b border-[var(--border)] last:border-b-0 align-top"
                        >
                          <td className="whitespace-nowrap px-3 py-1.5">
                            <PageStateChip state={group.kind} />
                          </td>
                          <td className="px-3 py-1.5 text-[var(--text)]">{group.reason}</td>
                          <td className="px-3 py-1.5 text-[var(--text-muted)]">
                            <span className="font-mono tabular-nums text-[var(--text)]">{group.pages.length}</span>{' '}
                            {group.pages.length === 1 ? 'page' : 'pages'}
                            <span className="ml-2 font-mono tabular-nums">
                              {shown.join(', ')}
                              {more > 0 && `, +${more} more`}
                            </span>
                          </td>
                          <td className={`${numCell} text-[var(--text)]`}>{costLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <div className={sectionLabel}>Per model · work performed</div>
          <div className="overflow-x-auto border border-[var(--border)]">
            <table className="w-full min-w-[26rem] border-collapse text-xs">
              <thead className="bg-[var(--surface-muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th scope="col" className={thLeft}>
                    Model
                  </th>
                  <th scope="col" className={thRight}>
                    Pages
                  </th>
                  <th scope="col" className={thRight}>
                    Tokens
                  </th>
                  <th scope="col" className={thRight}>
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {vm.ledgerRows.map((row) => (
                  <tr key={row.model} className="border-b border-[var(--border)]">
                    <td className="px-3 py-1.5 font-mono text-[var(--text)]">{row.model}</td>
                    <td className={`${numCell} text-[var(--text)]`}>{row.billedPages}</td>
                    <td className={`${numCell} text-[var(--text-muted)]`}>
                      {(row.inputTokens + row.outputTokens).toLocaleString()}
                    </td>
                    <td className={`${numCell} text-[var(--text)]`}>
                      {row.cost === null ? '—' : formatCost(row.cost)}
                    </td>
                  </tr>
                ))}
                {vm.ledgerRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-center text-[var(--text-muted)]">
                      No billed work yet.
                    </td>
                  </tr>
                )}
                {vm.ledgerRows.length > 1 && (
                  <tr className="border-t-2 border-[var(--border-strong)] font-semibold">
                    <td className="px-3 py-1.5 text-[var(--text)]">total</td>
                    <td className={`${numCell} text-[var(--text)]`}>{totalPages}</td>
                    <td className={`${numCell} text-[var(--text)]`}>{totalTokens.toLocaleString()}</td>
                    <td className={`${numCell} text-[var(--text)]`}>
                      {vm.hasCost ? `${formatCost(vm.actualTotal)}${vm.allPriced ? '' : '+'}` : '—'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--text-subtle)]">Pages = work performed, may exceed doc pages.</p>
        </div>
      </div>
    </Panel>
  );
}
