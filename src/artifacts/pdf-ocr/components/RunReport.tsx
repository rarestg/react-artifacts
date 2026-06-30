import { Loader2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { actualCost, estimateCost, formatCost, formatCostRange } from '../core/cost';
import type { Controller } from '../useController';
import { PageStateChip, PageStateMark, ProgressBar } from './primitives';

const spin = 'h-3 w-3 animate-spin motion-reduce:animate-none';
const sectionLabel = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]';
const numCell = 'px-3 py-1.5 text-right font-mono text-xs tabular-nums';

function CountItem({ state, label, count }: { state: 'ok' | 'suspect' | 'failed'; label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-[var(--text)]">
      <PageStateMark state={state} />
      {label} {count}
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
      ? vm.counts.inFlight > 0
        ? `· ${vm.counts.inFlight} in flight`
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

  // Flagged rows: resolving pages while retrying, otherwise the suspect/failed results.
  const showFlagged = vm.activeRunKind !== 'initial' && (vm.flaggedPages.length > 0 || vm.retrying);
  const flaggedRows =
    vm.retrying && vm.activeRetry
      ? vm.activeRetry.pages.map((page) => ({ page, kind: 'retrying' as const }))
      : vm.state.results
          .filter((result) => result.error || result.warning)
          .map((result) => ({
            page: result.pageNumber,
            kind: (result.error ? 'failed' : 'suspect') as 'failed' | 'suspect',
            reason: result.error ?? result.warning ?? '',
            cost: actualCost(result.model ?? snap.model, result.inputTokens ?? 0, result.outputTokens ?? 0),
          }));

  const totalPages = vm.ledgerRows.reduce((sum, row) => sum + row.billedPages, 0);
  const totalTokens = vm.ledgerRows.reduce((sum, row) => sum + row.inputTokens + row.outputTokens, 0);

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Run report</h2>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="space-y-1">
          <ProgressBar value={completed} max={total} tone={vm.running ? 'accent' : 'neutral'} label="OCR progress" />
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
        </div>

        <div className="space-y-1">
          <p className="text-sm tabular-nums text-[var(--text)]">
            Est. {estText} · {actualLabel} {actualText}
            {verdict && <span className="text-[var(--text-muted)]"> ({verdict})</span>}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Actual includes retries and failed attempts that reached the API.
            {vm.hasCost && !vm.allPriced && ' Some models aren’t in the price table — priced subtotal only.'}
          </p>
        </div>

        {timing && (
          <p className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
            per-page: avg {timing.avg.toFixed(1)}s · fastest {timing.fastest.toFixed(1)}s · slowest{' '}
            {timing.slowest.toFixed(1)}s
          </p>
        )}

        {vm.activeRunKind === 'initial' && (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="danger" size="sm" onClick={vm.cancel}>
              Cancel — keep done
            </Button>
            <span className="text-xs text-[var(--text-muted)]">keeps finished pages</span>
          </div>
        )}

        {showFlagged && (
          <div className="space-y-1.5">
            <div className={sectionLabel}>Flagged</div>
            <div className="overflow-x-auto border border-[var(--border)]">
              <table className="w-full min-w-[28rem] border-collapse text-xs">
                <thead className="bg-[var(--surface-muted)]">
                  <tr className="border-b border-[var(--border)]">
                    <th
                      scope="col"
                      className="px-3 py-1.5 text-left font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]"
                    >
                      Page
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-1.5 text-left font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]"
                    >
                      State
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-1.5 text-left font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]"
                    >
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedRows.map((row) => (
                    <tr key={row.page} className="border-b border-[var(--border)] last:border-b-0 align-top">
                      <td className="px-3 py-1.5 font-mono tabular-nums text-[var(--text)]">{row.page}</td>
                      <td className="whitespace-nowrap px-3 py-1.5">
                        {row.kind === 'retrying' ? (
                          <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
                            <Loader2 className={spin} aria-hidden="true" />
                            re-OCR-ing
                          </span>
                        ) : (
                          <PageStateChip state={row.kind} />
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-[var(--text-muted)]">
                        {row.kind === 'retrying'
                          ? `re-OCR-ing on ${vm.activeRetry?.model ?? ''}`
                          : `${row.reason}${row.cost !== null ? ` · ${formatCost(row.cost)}` : ''}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <div className={sectionLabel}>Per model · work performed</div>
          <div className="overflow-x-auto border border-[var(--border)]">
            <table className="w-full min-w-[26rem] border-collapse text-xs">
              <thead className="bg-[var(--surface-muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th
                    scope="col"
                    className="px-3 py-1.5 text-left font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]"
                  >
                    Model
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-1.5 text-right font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]"
                  >
                    Pages
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-1.5 text-right font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]"
                  >
                    Tokens
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-1.5 text-right font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]"
                  >
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
    </div>
  );
}
