import { AlertTriangle, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { ListboxSelect } from '../../../components/ListboxSelect';
import { panelHeaderRowClass, panelHeaderTitleClass } from '../../../components/panelHeaderClasses';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { mergeClassNames } from '../../../lib/classNames';
import { panel } from '../../../ui/recipes';
import { estimateCost, formatCost, formatCostRange, modelPricing } from '../core/cost';
import type { MediaResolution } from '../core/types';
import type { Controller } from '../useController';
import { bandLabelClass, formatMmSs, helperClass } from './primitives';

const DETAIL_OPTIONS: { value: MediaResolution; label: string }[] = [
  { value: 'low', label: 'low' },
  { value: 'medium', label: 'med' },
  { value: 'high', label: 'high' },
];
const DETAIL_SHORT: Record<MediaResolution, string> = { low: 'low', medium: 'med', high: 'high' };

/** Mid-point USD of an estimate range, or null when the model isn't priced. */
function midCost(model: string, pages: number, detail: MediaResolution): number | null {
  if (!model || pages === 0) return null;
  const est = estimateCost(model, pages, detail);
  return est.priced && est.costLow !== null && est.costHigh !== null ? (est.costLow + est.costHigh) / 2 : null;
}

export function RetryPanel({ vm }: { vm: Controller }) {
  const retryCount = vm.retryPages.length;
  const flaggedCount = vm.flaggedPages.length;
  const retryDetail = vm.retryDetail;

  // Model dropdown ordered cheapest→priciest by combined (input+output) per-1M list price, unpriced last,
  // deterministic name tiebreak (mirrors core/gemini pickSmarterModel). Each row carries a right-aligned
  // cost to re-OCR the CURRENT retry set on THAT model at the CURRENT detail; recomputes on detail/count
  // change. Selection stays value-based, so the reorder never shifts which model is chosen. Hints are
  // hidden when there's nothing to re-OCR; unpriced models show no hint (never a bogus number).
  const modelOptions = useMemo(() => {
    const combined = (name: string): number | null => {
      const pricing = modelPricing(name);
      return pricing ? pricing.input + pricing.output : null;
    };
    return [...vm.models]
      .sort((a, b) => {
        const pa = combined(a.name);
        const pb = combined(b.name);
        if (pa === null && pb === null) return a.name.localeCompare(b.name);
        if (pa === null) return 1;
        if (pb === null) return -1;
        return pa - pb || a.name.localeCompare(b.name);
      })
      .map((modelInfo) => {
        const mid = midCost(modelInfo.name, retryCount, retryDetail);
        return { value: modelInfo.name, label: modelInfo.name, hint: mid === null ? undefined : formatCost(mid) };
      });
  }, [vm.models, retryCount, retryDetail]);

  // Per-detail cost on the current retry model (same shape as SettingsPanel). All three details share the
  // one model, so they are all-priced or all-unpriced together — the filter yields 3 cells or none.
  const detailHints = DETAIL_OPTIONS.map((option) => {
    const mid = midCost(vm.retryModel, retryCount, option.value);
    return { label: option.label, cost: mid === null ? null : formatCost(mid) };
  }).filter((entry) => entry.cost !== null);

  const estLine = (() => {
    if (retryCount === 0) return '';
    const pages = `${retryCount} page${retryCount === 1 ? '' : 's'}`;
    const est = vm.retryEstimate;
    if (est?.priced && est.costLow !== null && est.costHigh !== null) {
      return `Est. retry cost: ${formatCostRange(est.costLow, est.costHigh)} · ${pages} · ${DETAIL_SHORT[retryDetail]} detail`;
    }
    return `Est. retry cost: unpriced model · ${pages}`;
  })();

  return (
    <section className={panel.default}>
      <div className={panelHeaderRowClass}>
        <h2 className={panelHeaderTitleClass}>Re-OCR</h2>
      </div>

      <div className="space-y-3 px-4 py-4">
        <p className="text-sm text-[var(--text)]">
          {vm.counts.failed} failed, {vm.counts.suspect} suspect. Re-OCR them, or any pages you choose.
        </p>
        <p className={helperClass}>
          Retry uses the original run’s concurrency, timeout, retries, and prompt. Pages, model, and image detail can
          change.
        </p>

        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <Input
            label="Pages"
            aria-label="Pages to re-OCR"
            value={vm.retrySpec}
            disabled={vm.retrying}
            inputClassName="font-mono"
            onChange={(event) => vm.setRetrySpec(event.currentTarget.value)}
            className="min-w-[12rem] flex-1"
          />
          {flaggedCount > 0 && (
            <Button variant="ghost" size="sm" disabled={vm.retrying} onClick={vm.resetRetryToFlagged}>
              Reset retry defaults
            </Button>
          )}
        </div>

        {vm.retryIgnoredTokens.length > 0 && vm.runSnapshot && (
          // Advisory only — surfaces tokens silently dropped from the retry spec; never blocks the re-OCR.
          <p className={mergeClassNames(helperClass, 'flex items-start gap-1.5')}>
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warning)]" aria-hidden="true" />
            <span className="min-w-0 break-words">
              Ignored: <span className="font-mono">{vm.retryIgnoredTokens.join(', ')}</span>{' '}
              {`(not in 1–${vm.runSnapshot.pageCount}).`}
            </span>
          </p>
        )}

        <p className="text-xs tabular-nums text-[var(--text-muted)]">
          {retryCount > 0
            ? `Will re-OCR ${retryCount} page${retryCount === 1 ? '' : 's'}: ${vm.retryPages.join(', ')}`
            : 'Enter pages to re-OCR.'}
        </p>

        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="flex min-w-[12rem] max-w-[18rem] flex-1 flex-col gap-1">
            <span className={bandLabelClass}>Re-OCR model</span>
            {vm.retrying ? (
              <div className="flex h-9 items-center justify-between gap-2 border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-[var(--text-muted)]">
                <span className="min-w-0 truncate font-mono text-xs">{vm.retryModel}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.1em]">locked</span>
              </div>
            ) : (
              <ListboxSelect
                value={vm.retryModel}
                options={modelOptions}
                onChange={vm.setRetryModel}
                ariaLabel="Re-OCR model"
                selectedLabel="Selected"
                listboxClassName="z-30"
              />
            )}
          </div>
          <div className="flex min-w-[11rem] flex-col gap-1">
            <span className={bandLabelClass}>Image detail</span>
            <SegmentedControl
              ariaLabel="Re-OCR image detail"
              value={retryDetail}
              onValueChange={vm.setRetryDetail}
              options={DETAIL_OPTIONS}
              disabled={vm.retrying}
              fullWidth
            />
            {detailHints.length > 0 && (
              <div className="grid grid-cols-3 text-center text-[11px] tabular-nums text-[var(--text-muted)]">
                {detailHints.map((entry) => (
                  <span key={entry.label} className="whitespace-nowrap px-1">
                    {entry.cost}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="min-h-4 text-xs tabular-nums text-[var(--text-muted)]">{estLine}</p>

          {vm.retrying ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 font-mono text-xs tabular-nums text-[var(--text-muted)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Re-OCR-ing… {vm.state.completed}/{vm.state.total} · {formatMmSs(vm.attemptElapsedMs)}
              </span>
              <Button variant="danger" size="sm" onClick={vm.cancel}>
                Cancel re-OCR
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" disabled={retryCount === 0} onClick={vm.reOcr}>
                Re-OCR {retryCount} page{retryCount === 1 ? '' : 's'}
              </Button>
              {retryCount === 0 && <span className="text-xs text-[var(--text-muted)]">Enter at least one page.</span>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
