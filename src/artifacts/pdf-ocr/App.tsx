import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { Button } from '../../components/Button';
import { mergeClassNames } from '../../lib/classNames';
import { ApiKeyPanel } from './components/ApiKeyPanel';
import { Dropzone } from './components/Dropzone';
import { Header } from './components/Header';
import { ModelTable } from './components/ModelTable';
import { bandClass, bandLabelClass, helperClass } from './components/primitives';
import { ResultView } from './components/ResultView';
import { RetryPanel } from './components/RetryPanel';
import { RunReport } from './components/RunReport';
import { SettingsPanel } from './components/SettingsPanel';
import { formatCost, formatCostRange } from './core/cost';
import { type Controller, type RunSnapshot, useController } from './useController';

function selectionLabel(snap: RunSnapshot): string {
  const { selectedPages, selectedCount, pageCount } = snap;
  if (selectedCount === 0) return `0 of ${pageCount} pages`;
  if (selectedCount === pageCount) return `${selectedCount} of ${pageCount} pages`;
  const first = selectedPages[0];
  const last = selectedPages[selectedCount - 1];
  if (selectedCount > 1 && selectedCount === last - first + 1) return `pages ${first}–${last} of ${pageCount}`;
  return `${selectedCount} of ${pageCount} pages`;
}

function RunRow({ vm }: { vm: Controller }) {
  const count = vm.selectedCount;
  const reserve = `Convert ${vm.file?.pageCount ?? 0} pages`;
  const estPriced = vm.estimate?.priced && vm.estimate.costLow !== null && vm.estimate.costHigh !== null;
  return (
    <section className={mergeClassNames(bandClass, 'space-y-2')}>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={!vm.canConvert} onClick={vm.convert}>
          <span className="relative inline-grid">
            <span
              aria-hidden="true"
              className="col-start-1 row-start-1 whitespace-nowrap opacity-0 pointer-events-none"
            >
              {reserve}
            </span>
            <span className="col-start-1 row-start-1 whitespace-nowrap">
              Convert {count} page{count === 1 ? '' : 's'}
            </span>
          </span>
        </Button>
        {!vm.canConvert ? (
          <span className="text-xs text-[var(--text-muted)]">{vm.convertReason}</span>
        ) : (
          estPriced && (
            <span className="text-xs tabular-nums text-[var(--text-muted)]">
              OCR {count} page{count === 1 ? '' : 's'} · est{' '}
              {formatCostRange(vm.estimate?.costLow as number, vm.estimate?.costHigh as number)}
            </span>
          )
        )}
      </div>
    </section>
  );
}

function SetupSummary({ vm }: { vm: Controller }) {
  const snap = vm.runSnapshot;
  if (!snap) return null;
  return (
    <section className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border border-[var(--border)] px-4 py-3">
      <span className="inline-flex min-w-0 items-center gap-2 text-xs tabular-nums text-[var(--text)]">
        <span className={bandLabelClass}>Setup</span>
        <span className="min-w-0 truncate font-mono">
          {snap.fileName} · {snap.model} · {selectionLabel(snap)} · conc {snap.concurrency}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {vm.running && <span className="text-xs text-[var(--text-muted)]">Settings are locked while a job runs.</span>}
        <Button variant="ghost" size="sm" disabled={vm.running} onClick={vm.editSetup}>
          Edit
        </Button>
      </span>
    </section>
  );
}

function LargeJobHint({ vm }: { vm: Controller }) {
  const estPriced = vm.estimate?.priced && vm.estimate.costLow !== null && vm.estimate.costHigh !== null;
  return (
    <p className="flex items-start gap-2 border-l-2 border-[color:var(--warning)] bg-[var(--warning-weak)] px-3 py-2 text-xs text-[var(--warning-text)]">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="tabular-nums">
        Large job: {vm.selectedCount} pages — this can take a while at concurrency {vm.concurrency}
        {estPriced && `, est ${formatCostRange(vm.estimate?.costLow as number, vm.estimate?.costHigh as number)}`}.
      </span>
    </p>
  );
}

function JobErrorCallout({ vm, onDismiss }: { vm: Controller; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 border border-[color:var(--danger)] bg-[var(--danger-weak)] px-4 py-3 text-[var(--danger-text)]">
      <X className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">Run stopped — {vm.state.error}</p>
        <p className="text-xs">
          Pages completed before the failure are kept below. Re-test your key, then Edit and Convert again to finish the
          rest.
        </p>
      </div>
      <Button variant="ghost" size="sm" className="shrink-0" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  );
}

function LifetimeTally({ vm }: { vm: Controller }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-[var(--text-muted)]">
      <span>
        Lifetime on this device: {formatCost(vm.lifetime.totalCostUsd)} across {vm.lifetime.totalPages} pages ·{' '}
        {vm.lifetime.totalPdfs} conversions
      </span>
      {confirming ? (
        <span className="inline-flex items-center gap-2">
          <span className="text-[var(--text-muted)]">Clear tally?</span>
          <Button
            variant="ghost"
            size="sm"
            className="px-1 text-[var(--danger)]"
            onClick={() => {
              vm.resetLifetime();
              setConfirming(false);
            }}
          >
            Confirm
          </Button>
          <Button variant="ghost" size="sm" className="px-1" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </span>
      ) : (
        <Button variant="ghost" size="sm" className="px-1" onClick={() => setConfirming(true)}>
          reset
        </Button>
      )}
    </div>
  );
}

export default function PdfOcrApp() {
  const vm = useController();
  const [dismissedError, setDismissedError] = useState<string | null>(null);

  // Only after the initial run settles (or while a retry runs) — never mid-initial-run, which would abort it.
  const showRetry = !!vm.runSnapshot && (vm.retrying || (!vm.running && vm.flaggedPages.length > 0));
  const showError = !!vm.state.error && vm.state.error !== dismissedError;

  return (
    <ArtifactThemeRoot className="min-h-screen bg-[var(--surface-muted)] text-[var(--text)]">
      <div className="flex min-h-screen flex-col">
        <Header vm={vm} />
        <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">
          {vm.setupCollapsed ? (
            <SetupSummary vm={vm} />
          ) : (
            <div className="divide-y divide-[var(--border)] border border-[var(--border)]">
              <ApiKeyPanel vm={vm} />
              <Dropzone vm={vm} />
              <ModelTable vm={vm} />
              <SettingsPanel vm={vm} />
              <RunRow vm={vm} />
            </div>
          )}

          {!vm.setupCollapsed && vm.selectedCount > 50 && <LargeJobHint vm={vm} />}

          {showError && <JobErrorCallout vm={vm} onDismiss={() => setDismissedError(vm.state.error)} />}

          {vm.runSnapshot && <RunReport vm={vm} />}

          {showRetry && <RetryPanel vm={vm} />}

          {vm.runSnapshot && <ResultView vm={vm} />}

          <LifetimeTally vm={vm} />
        </main>

        <footer className="border-t border-[var(--border)]">
          <div className="mx-auto w-full max-w-3xl px-4 py-3">
            <p className={helperClass}>
              Your key and PDF stay in this browser — only the OCR requests are sent to Google.
            </p>
          </div>
        </footer>
      </div>
    </ArtifactThemeRoot>
  );
}
