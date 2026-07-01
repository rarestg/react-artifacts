import { Field } from '@base-ui/react/field';
import { type InputHTMLAttributes, type ReactNode, type Ref, useRef } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { inputBase } from '../ui/recipes';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

type InputAccessibleName =
  | { label: InputLabel; 'aria-label'?: string; 'aria-labelledby'?: string }
  | { label?: undefined; 'aria-label': string; 'aria-labelledby'?: string }
  | { label?: undefined; 'aria-label'?: string; 'aria-labelledby': string };

type InputLabel = Exclude<ReactNode, boolean | null | undefined>;
type Expect<T extends true> = T;

type InputLabelTypeRegression = [
  Expect<null extends InputLabel ? false : true>,
  Expect<undefined extends InputLabel ? false : true>,
  Expect<boolean extends InputLabel ? false : true>,
  Expect<string extends InputLabel ? true : false>,
  Expect<number extends InputLabel ? true : false>,
];
declare const _inputLabelTypeRegression: InputLabelTypeRegression;

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'aria-label' | 'aria-labelledby'> & {
  ref?: Ref<HTMLInputElement>;
  helperText?: ReactNode;
  error?: ReactNode;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
} & InputAccessibleName;

export function Input({
  ref,
  label,
  helperText,
  error,
  className,
  inputClassName,
  labelClassName,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: InputProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useArtifactThemeGuard('Input', rootRef);

  const hasError = error !== undefined && error !== null && error !== false;
  const labelNode = label as ReactNode | false | null | undefined;
  const hasLabel = labelNode !== undefined && labelNode !== null && labelNode !== false;

  return (
    <Field.Root ref={rootRef} invalid={hasError} className={mergeClassNames('space-y-1', className)}>
      {hasLabel && <Field.Label className={mergeClassNames(inputBase.label, labelClassName)}>{labelNode}</Field.Label>}
      <Field.Control
        ref={ref}
        aria-label={ariaLabel}
        // Always forward aria-labelledby (even undefined) so it overrides the aria-labelledby
        // Field.Control injects for its Label part. Otherwise a caller's aria-label would lose
        // the accessible-name race to the visible label; association still holds via htmlFor.
        aria-labelledby={ariaLabelledBy}
        {...props}
        className={mergeClassNames(
          inputBase.field,
          hasError ? inputBase.fieldError : inputBase.fieldDefault,
          inputBase.fieldDisabled,
          inputClassName,
        )}
      />
      {helperText && <Field.Description className={inputBase.helper}>{helperText}</Field.Description>}
      {hasError && (
        <Field.Error match className={inputBase.error}>
          {error}
        </Field.Error>
      )}
    </Field.Root>
  );
}
