import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { ListboxSelect } from '../../../components/ListboxSelect';
import { mergeClassNames } from '../../../lib/classNames';
import type { Controller } from '../useController';
import { bandClass, bandLabelClass, formatMmSs, helperClass } from './primitives';

export function RetryPanel({ vm }: { vm: Controller }) {
  const modelOptions = useMemo(
    () => vm.models.map((modelInfo) => ({ value: modelInfo.name, label: modelInfo.name })),
    [vm.models],
  );
  const retryCount = vm.retryPages.length;
  const flaggedCount = vm.flaggedPages.length;

  return (
    <section className={mergeClassNames(bandClass, 'space-y-3 border-t border-[var(--border)]')}>
      <div className={bandLabelClass}>Re-OCR</div>
      <p className="text-sm text-[var(--text)]">
        {vm.counts.failed} failed, {vm.counts.suspect} suspect — re-OCR them, or any pages you choose.
      </p>
      <p className={helperClass}>Retry uses original run settings; only model and pages change.</p>

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
          <Button
            variant="ghost"
            size="sm"
            disabled={vm.retrying}
            onClick={vm.resetRetryToFlagged}
            className="px-0 text-[var(--text-muted)]"
          >
            Reset to flagged ({flaggedCount})
          </Button>
        )}
      </div>

      <p className="text-xs tabular-nums text-[var(--text-muted)]">
        {retryCount > 0
          ? `Will re-OCR ${retryCount} page${retryCount === 1 ? '' : 's'}: ${vm.retryPages.join(', ')}`
          : 'Enter pages to re-OCR.'}
      </p>

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="flex w-full max-w-[18rem] flex-col gap-1">
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
            />
          )}
        </div>

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
    </section>
  );
}
