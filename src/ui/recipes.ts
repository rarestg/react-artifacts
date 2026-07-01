import { mergeClassNames } from '../lib/classNames';

/**
 * Sharp-minimal skin recipes.
 *
 * Single source of truth for the Tailwind class strings that encode the
 * sharp-minimal aesthetic shared by the native UI primitives. Each recipe holds
 * a primitive's own shell geometry plus its token-bearing state classes; purely
 * structural layout that carries no design token stays inline at the call site.
 */

/* Control shell (Button, and future Base UI controls that share the shell). */

export type ControlVariant = 'default' | 'primary' | 'ghost' | 'danger';
export type ControlSize = 'sm' | 'md' | 'lg';

export const controlBase =
  'inline-flex items-center justify-center gap-2 font-medium transition-colors motion-reduce:transition-none rounded-none ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]';

export const controlVariant: Record<ControlVariant, { base: string; interactive: string }> = {
  default: {
    base: 'border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]',
    interactive:
      'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] active:border-[var(--border-strong)]',
  },
  primary: {
    base: 'border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-contrast)]',
    interactive: 'hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]',
  },
  ghost: {
    base: 'border border-transparent bg-transparent text-[var(--text-muted)]',
    interactive: 'hover:bg-[var(--surface-strong)] active:bg-[var(--surface-pressed)]',
  },
  danger: {
    base: 'border border-[color:var(--danger)] bg-[var(--surface)] text-[var(--danger)]',
    interactive: 'hover:bg-[var(--danger-weak)] active:bg-[var(--danger-weak)]',
  },
};

export const controlSize: Record<ControlSize, string> = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-4 text-sm',
};

export function controlRecipe({
  variant,
  size,
  disabled,
  className,
}: {
  variant: ControlVariant;
  size: ControlSize;
  disabled?: boolean;
  className?: string;
}) {
  return mergeClassNames(
    controlBase,
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    controlVariant[variant].base,
    !disabled && controlVariant[variant].interactive,
    controlSize[size],
    className,
  );
}

/* Panel surfaces. */

export type PanelVariant = 'default' | 'muted' | 'dashed';

export const panel: Record<PanelVariant, string> = {
  default: 'border border-[var(--border)] bg-[var(--surface)]',
  muted: 'bg-[var(--surface-muted)]',
  dashed: 'border border-dashed border-[var(--border-strong)] bg-[var(--surface)]',
};

/* Dense tool-panel header row. */

export const panelHeader = {
  row: 'flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3',
  text: 'flex min-w-0 flex-col gap-1',
  title: 'text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]',
  meta: 'flex flex-wrap items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]',
  actions: 'flex flex-wrap items-center gap-2 min-w-0 basis-full sm:basis-auto',
  action:
    'cursor-pointer px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--surface)]',
};

/* Inline badge (Tag). */

export type TagVariant = 'base' | 'muted' | 'solid';

export const badge: { base: string; variant: Record<TagVariant, string> } = {
  base: 'inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-none',
  variant: {
    base: 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
    muted: 'border border-transparent bg-[var(--surface-strong)] text-[var(--text-muted)]',
    solid: 'border border-transparent bg-[var(--primary)] text-[var(--primary-contrast)]',
  },
};

/* Status tag (active/inactive skin). */

export const status = {
  root: 'inline-flex items-center gap-2 border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] leading-none transition-[background-color,color,border-color] motion-reduce:transition-none',
  rootActive: 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]',
  rootInactive: 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]',
  iconActive: 'text-[var(--text)]',
  iconInactive: 'text-[var(--text-muted)]',
  dot: 'h-2 w-2 shrink-0 border',
  dotActive: 'border-[color:var(--success)] bg-[var(--success)]',
  dotInactive: 'border-[var(--border-strong)] bg-transparent',
};

/* Text input field skin. */

export const inputBase = {
  label: 'block text-xs font-medium text-[var(--text-muted)]',
  field:
    'h-9 w-full border bg-[var(--surface)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] ' +
    'focus:outline-none focus-visible:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
  fieldError: 'border-[color:var(--danger)]',
  fieldDefault: 'border-[var(--border)]',
  fieldDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  helper: 'text-xs text-[var(--text-muted)]',
  error: 'text-xs text-[var(--danger)]',
};
