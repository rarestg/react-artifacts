import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'default' | 'primary' | 'ghost';
type ButtonSize = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type PanelVariant = 'default' | 'muted' | 'dashed';

type PanelProps = {
  children: ReactNode;
  variant?: PanelVariant;
  className?: string;
};

type TagVariant = 'base' | 'muted' | 'solid';

type TagProps = {
  children: ReactNode;
  variant?: TagVariant;
  className?: string;
};

const buttonVariants: Record<ButtonVariant, string> = {
  default:
    'border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-strong)]',
  primary:
    'border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-contrast)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]',
  ghost:
    'border border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-strong)]',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-9 px-3 text-sm',
};

export function Button({ variant = 'default', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={[
        'inline-flex items-center gap-2 font-medium transition-colors motion-reduce:transition-none cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

export function Panel({ children, variant = 'default', className }: PanelProps) {
  const variants: Record<PanelVariant, string> = {
    default: 'border border-[var(--border)] bg-[var(--surface)]',
    muted: 'bg-[var(--surface-muted)]',
    dashed: 'border border-dashed border-[var(--border-strong)] bg-[var(--surface)]',
  };

  return <div className={[variants[variant], className].filter(Boolean).join(' ')}>{children}</div>;
}

export function Tag({ children, variant = 'base', className }: TagProps) {
  const variants: Record<TagVariant, string> = {
    base: 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
    muted: 'border-transparent bg-[var(--surface-muted)] text-[var(--text-muted)]',
    solid: 'border-transparent bg-[var(--primary)] text-[var(--primary-contrast)]',
  };

  return (
    <span
      className={['inline-flex items-center px-2 py-0.5 text-[11px] font-medium', variants[variant], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
