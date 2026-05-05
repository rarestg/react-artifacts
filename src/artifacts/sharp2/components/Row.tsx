import type { MouseEventHandler, ReactNode } from 'react';

type RowProps = {
  children: ReactNode;
  selected?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

export function Row({ children, selected, onClick, className }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'flex w-full cursor-pointer items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-[background-color] motion-reduce:transition-none',
        'focus:outline-none focus-visible:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
        'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)]',
        selected ? 'border-l-[var(--accent)] bg-[var(--surface-muted)]' : 'border-l-transparent',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}
