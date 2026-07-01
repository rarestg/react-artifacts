import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Check } from 'lucide-react';
import { type CSSProperties, type ReactNode, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { checkboxBoxRecipe, checkboxIndicator } from '../ui/recipes';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type CheckboxProps = {
  label: string;
  reserveLabel?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  focusTarget?: 'box' | 'container';
  size?: 'sm' | 'md';
  className?: string;
  labelClassName?: string;
  boxClassName?: string;
  checkClassName?: string;
  style?: CSSProperties;
  suffix?: ReactNode;
};

export function Checkbox({
  label,
  reserveLabel,
  checked,
  onCheckedChange,
  disabled = false,
  focusTarget = 'box',
  size = 'md',
  className,
  labelClassName,
  boxClassName,
  checkClassName,
  style,
  suffix,
}: CheckboxProps) {
  const rootRef = useRef<HTMLLabelElement>(null);
  const resolvedReserveLabel = reserveLabel ?? label;

  useArtifactThemeGuard('Checkbox', rootRef);

  const checkSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  // Base UI's documented pattern: a native <label> wraps Checkbox.Root so the whole row toggles and
  // provides the accessible name. Root (a focusable role=checkbox span) supplies keyboard + ARIA;
  // Space toggles, matching the ARIA checkbox spec (the old hand-rolled Enter toggle is intentionally
  // dropped — these checkboxes are not inside forms).
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: BaseCheckbox.Root renders the labelable role=checkbox + hidden input inside this label; the control is invisible to static analysis.
    <label
      ref={rootRef}
      style={style}
      className={mergeClassNames(
        'inline-flex items-center gap-2 select-none py-1',
        focusTarget === 'container' && 'relative',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      )}
    >
      <BaseCheckbox.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={checkboxBoxRecipe({ size, focusTarget, disabled, className: boxClassName })}
      >
        <BaseCheckbox.Indicator keepMounted className={checkboxIndicator}>
          <Check
            aria-hidden="true"
            className={mergeClassNames(checkClassName ?? 'text-[var(--primary-contrast)]', checkSize)}
          />
        </BaseCheckbox.Indicator>
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
