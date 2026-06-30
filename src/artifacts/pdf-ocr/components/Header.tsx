import { AlertTriangle, Check, Loader2, X } from 'lucide-react';
import { mergeClassNames } from '../../../lib/classNames';
import { formatCost } from '../core/cost';
import type { Controller } from '../useController';
import { type ChipTone, formatMmSs, StateChip } from './primitives';

const spinnerClass = 'h-3 w-3 animate-spin motion-reduce:animate-none';

function headerStatus(vm: Controller): { label: string; tone: ChipTone; icon?: React.ReactNode } {
  if (vm.activeRunKind === 'retry')
    return { label: 'Re-OCR-ing', tone: 'warning', icon: <Loader2 className={spinnerClass} /> };
  if (vm.activeRunKind === 'initial')
    return { label: 'Running', tone: 'accent', icon: <Loader2 className={spinnerClass} /> };
  switch (vm.state.status) {
    case 'done':
      if (vm.counts.failed > 0) return { label: 'Done', tone: 'danger', icon: <X className="h-3 w-3" /> };
      if (vm.counts.suspect > 0) return { label: 'Done', tone: 'warning', icon: <AlertTriangle className="h-3 w-3" /> };
      return { label: 'Done', tone: 'success', icon: <Check className="h-3 w-3" /> };
    case 'cancelled':
      return { label: 'Cancelled', tone: 'neutral' };
    case 'error':
      return { label: 'Error', tone: 'danger', icon: <X className="h-3 w-3" /> };
    default:
      return vm.file && vm.test.status === 'ok'
        ? { label: 'Ready', tone: 'neutral' }
        : { label: 'Idle', tone: 'neutral' };
  }
}

/** A small square key/doc indicator: filled when satisfied, outlined when not. */
function LaneFact({ filled, children }: { filled: boolean; children: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-[var(--text-muted)]">
      <span
        aria-hidden="true"
        className={mergeClassNames(
          'h-2 w-2 shrink-0 border',
          filled ? 'border-[color:var(--success)] bg-[var(--success)]' : 'border-[var(--border-strong)] bg-transparent',
        )}
      />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

export function Header({ vm }: { vm: Controller }) {
  const status = headerStatus(vm);
  const keyVerified = vm.test.status === 'ok';
  const showCost = vm.state.status !== 'idle' && vm.hasCost;

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="text-sm font-semibold tracking-tight text-[var(--text)]">PDF OCR</h1>
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <LaneFact filled={keyVerified}>{keyVerified ? 'Key OK' : 'No key'}</LaneFact>
          <LaneFact filled={!!vm.file}>{vm.file ? `${vm.file.name} · ${vm.file.pageCount}p` : 'no file'}</LaneFact>
          {showCost && (
            <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
              {formatCost(vm.actualTotal)}
              {vm.allPriced ? '' : '+'}
            </span>
          )}
          <StateChip label={status.label} reserveLabel="Re-OCR-ing" tone={status.tone} icon={status.icon} />
          <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">{formatMmSs(vm.jobElapsedMs)}</span>
        </div>
      </div>
    </header>
  );
}
