import { AlertTriangle, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { mergeClassNames } from '../../../lib/classNames';
import { estimateCost, formatCost } from '../core/cost';
import { DEFAULT_PROMPT, type MediaResolution } from '../core/types';
import type { Controller } from '../useController';
import { bandClass, bandLabelClass, focusRing, helperClass, Stepper } from './primitives';

const DETAIL_OPTIONS: { value: MediaResolution; label: string }[] = [
  { value: 'low', label: 'low' },
  { value: 'medium', label: 'med' },
  { value: 'high', label: 'high' },
];

const DETAIL_SHORT: Record<MediaResolution, string> = { low: 'low', medium: 'med', high: 'high' };

export function SettingsPanel({ vm }: { vm: Controller }) {
  const pagesLabel = (() => {
    const trimmed = vm.pageSpec.trim().toLowerCase();
    return trimmed === '' || trimmed === 'all' ? 'all pages' : vm.pageSpec.trim();
  })();
  const summary = `${vm.concurrency} parallel · ${DETAIL_SHORT[vm.mediaResolution]} · ${vm.timeoutSec}s · ${pagesLabel}`;

  const detailHint = (resolution: MediaResolution): string | null => {
    if (!vm.model || vm.selectedCount === 0) return null;
    const est = estimateCost(vm.model, vm.selectedCount, resolution);
    return est.priced && est.costLow !== null && est.costHigh !== null
      ? formatCost((est.costLow + est.costHigh) / 2)
      : null;
  };
  const detailHints = DETAIL_OPTIONS.map((option) => ({ label: option.label, cost: detailHint(option.value) })).filter(
    (entry) => entry.cost !== null,
  );

  const promptChanged = vm.prompt !== DEFAULT_PROMPT;

  return (
    <section className={mergeClassNames(bandClass, 'space-y-3')}>
      <button
        type="button"
        aria-expanded={vm.settingsOpen}
        onClick={() => vm.setSettingsOpen(!vm.settingsOpen)}
        className={mergeClassNames('flex w-full items-center justify-between gap-3 text-left', focusRing)}
      >
        <span className={bandLabelClass}>4 · Settings</span>
        <span className="inline-flex items-center gap-2 text-xs tabular-nums text-[var(--text-muted)]">
          <span className="min-w-0 truncate">{summary}</span>
          {vm.settingsOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
        </span>
      </button>

      {vm.settingsOpen && (
        <div className="space-y-4">
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]">
            <Stepper
              label="Parallel pages"
              value={vm.concurrency}
              min={1}
              max={128}
              onChange={vm.setConcurrency}
              maxButton
              helperText="Higher = faster, but may trigger rate-limit backoff."
            />
            <div className="flex flex-col gap-1">
              <span className={bandLabelClass}>Image detail</span>
              <SegmentedControl
                ariaLabel="Image detail"
                value={vm.mediaResolution}
                onValueChange={vm.setMediaResolution}
                options={DETAIL_OPTIONS}
                fullWidth
              />
              {detailHints.length ? (
                <div className="grid grid-cols-3 text-center text-[11px] tabular-nums text-[var(--text-muted)]">
                  {detailHints.map((entry) => (
                    <span key={entry.label} className="whitespace-nowrap px-1">
                      {entry.cost}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={helperClass}>Higher detail reads dense scans better, at more tokens.</p>
              )}
            </div>
            <Stepper
              label="Page timeout"
              value={vm.timeoutSec}
              min={5}
              max={300}
              step={5}
              onChange={vm.setTimeoutSec}
              suffix="s"
            />
            <div className="flex flex-col gap-1">
              <Input
                label="Pages"
                value={vm.pageSpec}
                placeholder="all"
                inputClassName="font-mono"
                onChange={(event) => vm.setPageSpec(event.currentTarget.value)}
                helperText="e.g. 1-5, 8, 12-20 — or “all”."
              />
              {vm.ignoredTokens.length > 0 && vm.file && (
                <p className={mergeClassNames(helperClass, 'flex items-start gap-1.5')}>
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warning)]" aria-hidden="true" />
                  <span className="min-w-0 break-words">
                    Ignored: <span className="font-mono">{vm.ignoredTokens.join(', ')}</span>{' '}
                    {`(not in 1–${vm.file.pageCount}).`}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              aria-expanded={vm.advancedOpen}
              onClick={() => vm.setAdvancedOpen(!vm.advancedOpen)}
              className={mergeClassNames(
                'inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-[var(--text)]',
                focusRing,
              )}
            >
              {vm.advancedOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Advanced — OCR prompt
            </button>
            {vm.advancedOpen && (
              <div className="space-y-2">
                <textarea
                  aria-label="OCR prompt"
                  value={vm.prompt}
                  onChange={(event) => vm.setPrompt(event.currentTarget.value)}
                  rows={8}
                  className={mergeClassNames(
                    'w-full resize-y border border-[var(--border)] bg-[var(--surface-muted)] p-3 font-mono text-xs leading-relaxed text-[var(--text)]',
                    focusRing,
                  )}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!promptChanged}
                  onClick={() => vm.setPrompt(DEFAULT_PROMPT)}
                >
                  Reset to default prompt
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
