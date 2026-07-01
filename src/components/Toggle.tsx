import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { type ReactNode, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { toggleTrackRecipe } from '../ui/recipes';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type ToggleProps = {
  label: string;
  reserveLabel?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  focusTarget?: 'track' | 'container';
  title?: string;
  'aria-describedby'?: string;
  className?: string;
  labelClassName?: string;
  trackClassName?: string;
  knobClassName?: string;
  suffix?: ReactNode;
};

export function Toggle({
  label,
  reserveLabel,
  checked,
  onCheckedChange,
  disabled = false,
  focusTarget = 'track',
  title,
  'aria-describedby': ariaDescribedBy,
  className,
  labelClassName,
  trackClassName,
  knobClassName,
  suffix,
}: ToggleProps) {
  const rootRef = useRef<HTMLLabelElement>(null);
  const resolvedReserveLabel = reserveLabel ?? label;

  useArtifactThemeGuard('Toggle', rootRef);

  // Base UI's documented pattern: a native <label> wraps Checkbox.Root so the whole row toggles and
  // provides the accessible name. Root (a focusable role=checkbox span) supplies keyboard + ARIA;
  // Space toggles, matching the ARIA checkbox spec (the old hand-rolled Enter toggle is intentionally
  // dropped — these toggles are not inside forms). aria-describedby lands on the exposed role=checkbox
  // element, not the hidden aria-hidden input. The sharp square track/knob visual is preserved: Root
  // is the `.sharp-toggle` track and the knob is a decorative child driven by Root's data-checked.
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: BaseCheckbox.Root renders the labelable role=checkbox + hidden input inside this label; the control is invisible to static analysis.
    <label
      ref={rootRef}
      title={title}
      className={mergeClassNames(
        'inline-flex items-center gap-3 select-none py-1',
        focusTarget === 'container' && 'relative',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      )}
    >
      <BaseCheckbox.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        className={toggleTrackRecipe({ focusTarget, disabled, className: trackClassName })}
      >
        <span aria-hidden="true" className={mergeClassNames('sharp-toggle__knob', knobClassName)} />
      </BaseCheckbox.Root>
      {focusTarget === 'container' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[1px] ring-2 ring-[var(--ring)] ring-offset-1 ring-offset-[color:var(--surface)] opacity-0 peer-focus-visible:opacity-100"
        />
      )}
      <span className={mergeClassNames('relative inline-grid min-w-0 text-sm text-[var(--text)]', labelClassName)}>
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          {resolvedReserveLabel}
        </span>
        <span className="col-start-1 row-start-1 min-w-0 truncate">{label}</span>
      </span>
      {suffix}
    </label>
  );
}
