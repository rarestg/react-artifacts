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

/* Popup / overlay surfaces (Base UI overlays such as Dialog). */

// Opaque, bordered, square, no shadow — the sharp-minimal popup surface.
export const popupSurface =
  'rounded-none border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] shadow-none';

// Scrim behind modal overlays.
export const popupOverlay = 'bg-[var(--overlay)]';

/* Collection overlays (Base UI Select popup, and future Menu/Combobox popups). */

// Positioner: stacking context for the portaled popup; the surface itself carries the skin.
export const collectionPositioner = 'z-50 outline-none';

// Popup: the sharp popup surface sized to its trigger, scrolling long lists.
export const collectionPopup = mergeClassNames(
  popupSurface,
  'max-h-64 w-[var(--anchor-width)] overflow-y-auto py-1 outline-none',
);

// Collection option. Keyboard/hover highlight (a surface tint) stays on a separate channel from
// selection (an accent border plus a check indicator via itemIndicator), so the two never mask
// each other and the selected cue is never color-only.
export const itemBase =
  'flex cursor-pointer items-center gap-2 border-l-2 border-l-transparent px-3 py-2 text-left text-sm text-[var(--text)] outline-none ' +
  'data-[highlighted]:bg-[var(--surface-muted)] ' +
  'data-[selected]:border-l-[var(--accent)] ' +
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50';

// Selection cue cluster (check + label), shown only on the selected option.
export const itemIndicator = 'flex shrink-0 items-center gap-1 text-[var(--accent)]';

/* Checkbox (Base UI Checkbox.Root box + Checkbox.Indicator). */

type CheckboxSize = 'sm' | 'md';

// Box shell: square, bordered, token-toned by Base UI's data-checked/data-unchecked state. Root is the
// focusable element now (not a hidden peer input), so focus + interaction cues live on the box itself.
const checkboxBox =
  'flex shrink-0 items-center justify-center border rounded-none transition-colors motion-reduce:transition-none focus:outline-none ' +
  'data-[checked]:bg-[var(--checkbox-on-bg)] data-[checked]:border-[color:var(--checkbox-on-border)] ' +
  'data-[unchecked]:bg-[var(--checkbox-off-bg)] data-[unchecked]:border-[color:var(--checkbox-off-border)]';

const checkboxBoxSize: Record<CheckboxSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
};

// Hover/press cues, dropped when disabled (mirroring controlRecipe's !disabled gate).
const checkboxBoxInteractive =
  'data-[unchecked]:hover:border-[color:var(--border-strong)] data-[unchecked]:active:bg-[var(--surface-pressed)] ' +
  'data-[checked]:active:bg-[var(--checkbox-on-bg)]';

// Focus ring drawn on the box itself (focusTarget="box"); container mode rings a sibling overlay instead.
const checkboxBoxFocus =
  'focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]';

export function checkboxBoxRecipe({
  size,
  focusTarget,
  disabled,
  className,
}: {
  size: CheckboxSize;
  focusTarget: 'box' | 'container';
  disabled?: boolean;
  className?: string;
}) {
  return mergeClassNames(
    checkboxBox,
    checkboxBoxSize[size],
    // Container mode exposes the box as a `peer` so a sibling overlay can track its :focus-visible.
    focusTarget === 'box' ? checkboxBoxFocus : 'peer',
    !disabled && checkboxBoxInteractive,
    className,
  );
}

// Indicator wrapper: paired with Checkbox.Indicator's keepMounted so the check mark only fades via
// opacity across state changes (UI note #007) instead of unmounting mid-transition.
export const checkboxIndicator =
  'flex items-center justify-center transition-opacity motion-reduce:transition-none ' +
  'data-[unchecked]:opacity-0 data-[checked]:opacity-100';

/* Toggle (Base UI Checkbox.Root skinned as a sharp square switch: track + sliding knob). */

// Track shell: the `.sharp-toggle` geometry (index.css) plus token tones from Base UI's
// data-checked/data-unchecked. Mirrors checkboxBoxRecipe — Root is the focusable element now, so
// focus + interaction cues live on the track itself. The knob's slide + tone key off the track's
// data-checked via a descendant rule in index.css.
const toggleTrack =
  'sharp-toggle transition-colors motion-reduce:transition-none focus:outline-none ' +
  'data-[checked]:border-[color:var(--toggle-track-on-border)] data-[checked]:bg-[var(--toggle-track-on-bg)] ' +
  'data-[unchecked]:border-[color:var(--toggle-track-off-border)] data-[unchecked]:bg-[var(--toggle-track-off-bg)]';

// Hover/press cues, dropped when disabled (mirroring checkboxBoxRecipe's !disabled gate).
const toggleTrackInteractive =
  'data-[unchecked]:hover:border-[color:var(--border-strong)] data-[unchecked]:active:bg-[var(--surface-pressed)] ' +
  'data-[checked]:active:bg-[var(--primary-active)]';

// Focus ring on the track itself (focusTarget="track"); container mode rings a sibling overlay instead.
const toggleTrackFocus =
  'focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]';

export function toggleTrackRecipe({
  focusTarget,
  disabled,
  className,
}: {
  focusTarget: 'track' | 'container';
  disabled?: boolean;
  className?: string;
}) {
  return mergeClassNames(
    toggleTrack,
    // Container mode exposes the track as a `peer` so a sibling overlay can track its :focus-visible.
    focusTarget === 'track' ? toggleTrackFocus : 'peer',
    !disabled && toggleTrackInteractive,
    className,
  );
}

/* Segmented control (Base UI ToggleGroup single-select + Toggle items). */

type SegmentedTone = 'neutral' | 'accent';
type SegmentedSize = 'compact' | 'default';

// Item shell: bordered, sharp, token focus ring. Structural layout (min-w-0, shrink-0, flex-1,
// -ml-px, z-index) and cursor stay inline at the call site; per UI note #001 the single separator
// source is the child border overlap (-ml-px), never a parent gap/divide.
export const segmentedControl = {
  item:
    'inline-flex items-center justify-center border transition-colors motion-reduce:transition-none rounded-none ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
  size: {
    compact: 'h-6 px-2 text-xs font-medium',
    default: 'h-8 px-2 text-xs font-medium',
  } satisfies Record<SegmentedSize, string>,
  selected: {
    neutral: 'border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--text)]',
    accent: 'border-[color:var(--accent)] bg-[var(--accent-weak)] text-[var(--accent-text)]',
  } satisfies Record<SegmentedTone, string>,
  inactive: {
    neutral: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
    accent: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
  } satisfies Record<SegmentedTone, string>,
  // Hover/press cues for inactive, enabled items only.
  inactiveInteractive: {
    neutral: 'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)]',
    accent: 'hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)] active:bg-[var(--surface-pressed)]',
  } satisfies Record<SegmentedTone, string>,
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
