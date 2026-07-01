import { type InputHTMLAttributes, type ReactNode, type Ref, useId, useMemo, useRef } from 'react';
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
  id,
  label,
  helperText,
  error,
  className,
  inputClassName,
  labelClassName,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);

  useArtifactThemeGuard('Input', rootRef);

  const helperId = helperText ? `${inputId}-helper` : undefined;
  const hasError = error !== undefined && error !== null && error !== false;
  const labelNode = label as ReactNode | false | null | undefined;
  const hasLabel = labelNode !== undefined && labelNode !== null && labelNode !== false;
  const errorId = hasError ? `${inputId}-error` : undefined;
  const describedBy = useMemo(
    () => [ariaDescribedBy, helperId, errorId].filter(Boolean).join(' ') || undefined,
    [ariaDescribedBy, helperId, errorId],
  );
  const resolvedAriaInvalid = hasError ? true : ariaInvalid;

  return (
    <div ref={rootRef} className={mergeClassNames('space-y-1', className)}>
      {hasLabel && (
        <label htmlFor={inputId} className={mergeClassNames(inputBase.label, labelClassName)}>
          {labelNode}
        </label>
      )}
      <input
        ref={ref}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={describedBy}
        {...props}
        aria-invalid={resolvedAriaInvalid}
        id={inputId}
        className={mergeClassNames(
          inputBase.field,
          hasError ? inputBase.fieldError : inputBase.fieldDefault,
          inputBase.fieldDisabled,
          inputClassName,
        )}
      />
      {helperText && (
        <p id={helperId} className={inputBase.helper}>
          {helperText}
        </p>
      )}
      {hasError && (
        <p id={errorId} className={inputBase.error}>
          {error}
        </p>
      )}
    </div>
  );
}
