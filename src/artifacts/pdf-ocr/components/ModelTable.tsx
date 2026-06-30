import { ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { mergeClassNames } from '../../../lib/classNames';
import { estimateCost, formatCost, modelPricing } from '../core/cost';
import type { Controller } from '../useController';
import { bandClass, bandLabelClass, helperClass } from './primitives';

type SortKey = 'model' | 'in' | 'out' | 'est';
type Row = {
  name: string;
  input: number | null;
  output: number | null;
  estMid: number | null;
  combined: number | null;
};

const headCellClass = 'px-3 py-2 text-left font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]';

function relGlyph(combined: number | null, min: number, max: number): string {
  if (combined === null) return '—';
  if (max === min) return '$';
  const tier = (combined - min) / (max - min);
  return tier < 1 / 3 ? '$' : tier < 2 / 3 ? '$$' : '$$$';
}

export function ModelTable({ vm }: { vm: Controller }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'est', dir: 'asc' });

  const rows: Row[] = useMemo(
    () =>
      vm.models.map((modelInfo) => {
        const pricing = modelPricing(modelInfo.name);
        const est = vm.selectedCount > 0 ? estimateCost(modelInfo.name, vm.selectedCount, vm.mediaResolution) : null;
        const estMid =
          est?.priced && est.costLow !== null && est.costHigh !== null ? (est.costLow + est.costHigh) / 2 : null;
        return {
          name: modelInfo.name,
          input: pricing?.input ?? null,
          output: pricing?.output ?? null,
          estMid,
          combined: pricing ? pricing.input + pricing.output : null,
        };
      }),
    [vm.models, vm.selectedCount, vm.mediaResolution],
  );

  const pricedCombined = rows.map((row) => row.combined).filter((value): value is number => value !== null);
  const minCombined = pricedCombined.length ? Math.min(...pricedCombined) : 0;
  const maxCombined = pricedCombined.length ? Math.max(...pricedCombined) : 0;

  const sortedRows = useMemo(() => {
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sort.key === 'model') return a.name.localeCompare(b.name) * factor;
      const cellValue = (row: Row) => (sort.key === 'in' ? row.input : sort.key === 'out' ? row.output : row.estMid);
      const av = cellValue(a);
      const bv = cellValue(b);
      // Unpriced rows always sink to the bottom regardless of direction.
      if (av === null && bv === null) return a.name.localeCompare(b.name);
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av - bv) * factor;
    });
  }, [rows, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const Th = ({ label, sortKey, numeric }: { label: string; sortKey: SortKey; numeric?: boolean }) => {
    const active = sort.key === sortKey;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={headCellClass}
      >
        <button
          type="button"
          onClick={() => toggleSort(sortKey)}
          className={mergeClassNames(
            'inline-flex cursor-pointer items-center gap-1 hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
            active && 'text-[var(--text)]',
            numeric && 'flex-row-reverse',
          )}
        >
          {label}
          {active && (sort.dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
        </button>
      </th>
    );
  };

  const locked = vm.models.length === 0;

  return (
    <section className={mergeClassNames(bandClass, 'space-y-2')}>
      <div className="flex items-center justify-between gap-2">
        <span className={bandLabelClass}>3 · Model</span>
        {locked && (
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-[var(--text-subtle)]">
            <Lock className="h-3 w-3" aria-hidden="true" />
            locked
          </span>
        )}
      </div>
      <div className="overflow-x-auto border border-[var(--border)]">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead className="bg-[var(--surface-muted)] text-[10px]">
            <tr className="border-b border-[var(--border)]">
              <Th label="Model" sortKey="model" />
              <Th label="$/1M in" sortKey="in" numeric />
              <Th label="$/1M out" sortKey="out" numeric />
              <Th label="Est. cost" sortKey="est" numeric />
              <th scope="col" className={mergeClassNames(headCellClass, 'text-right')}>
                Rel
              </th>
            </tr>
          </thead>
          <tbody>
            {locked ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                  Test your key first — models and prices unlock once it works.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const selected = row.name === vm.model;
                return (
                  <tr
                    key={row.name}
                    onClick={() => vm.setModel(row.name)}
                    className={mergeClassNames(
                      'border-b border-[var(--border)] last:border-b-0',
                      selected ? 'bg-[var(--surface-muted)]' : 'hover:bg-[var(--surface-muted)]',
                    )}
                  >
                    <td
                      className={mergeClassNames(
                        'border-l-2 px-3 py-2',
                        selected ? 'border-l-[var(--accent)]' : 'border-l-transparent',
                      )}
                    >
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="pdf-ocr-model"
                          className="peer sr-only"
                          checked={selected}
                          onChange={() => vm.setModel(row.name)}
                        />
                        <span className="font-mono text-xs text-[var(--text)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)] peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-[color:var(--surface)]">
                          {row.name}
                        </span>
                      </label>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-[var(--text-muted)]">
                      {row.input === null ? '—' : row.input.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-[var(--text-muted)]">
                      {row.output === null ? '—' : row.output.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-[var(--text)]">
                      {row.estMid === null ? '—' : formatCost(row.estMid)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-[var(--text-muted)]">
                      {relGlyph(row.combined, minCombined, maxCombined)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className={helperClass}>
        {vm.selectedCount > 0
          ? `Est. cost uses your ${vm.selectedCount} selected page${vm.selectedCount === 1 ? '' : 's'} at ${vm.mediaResolution} detail.`
          : 'Load a PDF to see estimated cost per model.'}
      </p>
    </section>
  );
}
