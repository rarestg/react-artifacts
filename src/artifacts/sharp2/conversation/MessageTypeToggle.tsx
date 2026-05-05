import { Check } from 'lucide-react';
import type { ChangeEventHandler } from 'react';
import { mergeClassNames } from '../../../lib/classNames';

export type MessageTypeToggleProps = {
  label: string;
  count: number;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  color: string;
};

export function MessageTypeToggle({ label, count, checked, onChange, color }: MessageTypeToggleProps) {
  return (
    <label className="relative flex items-center gap-2 cursor-pointer select-none py-1 px-2 hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] transition-colors motion-reduce:transition-none">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[1px] ring-2 ring-[var(--ring)] ring-offset-1 ring-offset-[color:var(--surface)] opacity-0 peer-focus-visible:opacity-100"
      />
      <span
        className={mergeClassNames(
          'w-3.5 h-3.5 shrink-0 border flex items-center justify-center transition-colors motion-reduce:transition-none',
          checked ? `${color} border-current` : 'bg-[var(--surface)] border-[var(--border-strong)]',
        )}
      >
        {checked && <Check className="w-2.5 h-2.5 text-[var(--surface)]" />}
      </span>
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className="text-[10px] font-medium text-[var(--text-subtle)] bg-[var(--surface-strong)] px-1.5 py-0.5 tabular-nums">
        {count}
      </span>
    </label>
  );
}
