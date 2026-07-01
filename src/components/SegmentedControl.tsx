import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { type CSSProperties, type ReactNode, useMemo, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { segmentedControl } from '../ui/recipes';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type SegmentedControlTone = 'neutral' | 'accent';
export type SegmentedControlSize = 'compact' | 'default';

export type SegmentedControlOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  ariaLabel?: string;
  reserveLabel?: string;
  icon?: ReactNode;
  disabled?: boolean;
  title?: string;
};

export type SegmentedControlProps<TValue extends string = string> = {
  ariaLabel: string;
  value: TValue;
  onValueChange: (value: TValue) => void;
  options: readonly SegmentedControlOption<TValue>[];
  tone?: SegmentedControlTone;
  size?: SegmentedControlSize;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  optionClassName?: string;
  style?: CSSProperties;
};

export function SegmentedControl<TValue extends string = string>({
  ariaLabel,
  value,
  onValueChange,
  options,
  tone = 'neutral',
  size = 'default',
  fullWidth = false,
  disabled = false,
  className,
  optionClassName,
  style,
}: SegmentedControlProps<TValue>) {
  const rootRef = useRef<HTMLFieldSetElement>(null);

  useArtifactThemeGuard('SegmentedControl', rootRef);

  const defaultReserveLabel = useMemo(
    () => options.reduce((longest, option) => (option.label.length > longest.length ? option.label : longest), ''),
    [options],
  );

  return (
    <ToggleGroup
      value={[value]}
      // Base UI ToggleGroup is single-select here, but re-clicking the active item deselects it to an
      // empty array. Ignore empty results so the control stays anchored on a visible value (UI notes
      // #002/#003); selection + ARIA are driven from `value`, never from the transient empty array.
      onValueChange={(groupValue) => {
        const next = groupValue[0];
        if (next !== undefined && next !== value) {
          onValueChange(next);
        }
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      style={style}
      // Render as a <fieldset> to keep the labelled group semantics callers/tests rely on. Group
      // disabled cascades to each Toggle button (native disabled) rather than a native fieldset attr.
      render={<fieldset ref={rootRef} />}
      className={mergeClassNames(
        'm-0 min-w-0 [min-inline-size:0] border-0 p-0',
        fullWidth ? 'flex w-full' : 'inline-flex',
        disabled && 'opacity-50',
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const optionDisabled = disabled || option.disabled;
        const reserveLabel = option.reserveLabel ?? defaultReserveLabel;

        return (
          <BaseToggle
            key={option.value}
            value={option.value}
            aria-label={option.ariaLabel}
            disabled={optionDisabled}
            title={option.title}
            className={mergeClassNames(
              // Structural layout stays inline; #001 separator source is the -ml-px border overlap.
              'relative min-w-0 shrink-0',
              segmentedControl.item,
              'focus-visible:z-20',
              segmentedControl.size[size],
              fullWidth && 'flex-1',
              option.icon ? 'gap-1.5' : '',
              index > 0 && '-ml-px',
              selected ? 'z-10' : 'z-0',
              selected ? segmentedControl.selected[tone] : segmentedControl.inactive[tone],
              optionDisabled
                ? 'cursor-not-allowed'
                : mergeClassNames('cursor-pointer', !selected && segmentedControl.inactiveInteractive[tone]),
              optionClassName,
            )}
          >
            <span className="relative inline-grid min-w-0">
              <span
                aria-hidden="true"
                className="col-start-1 row-start-1 whitespace-nowrap opacity-0 pointer-events-none"
              >
                {reserveLabel}
              </span>
              <span className="col-start-1 row-start-1 min-w-0 truncate">{option.label}</span>
            </span>
            {option.icon}
          </BaseToggle>
        );
      })}
    </ToggleGroup>
  );
}
