import {
  type ForwardedRef,
  forwardRef,
  type InputHTMLAttributes,
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useId,
  useMemo,
  useRef,
} from 'react';
import { mergeClassNames } from '../lib/classNames';
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
  helperText?: ReactNode;
  error?: ReactNode;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
} & InputAccessibleName;

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  if (ref) {
    (ref as MutableRefObject<T | null>).current = value;
  }
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
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
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useArtifactThemeGuard('Input', rootRef);

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

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
        <label
          htmlFor={inputId}
          className={mergeClassNames('block text-xs font-medium text-[var(--text-muted)]', labelClassName)}
        >
          {labelNode}
        </label>
      )}
      <input
        ref={setInputRef}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={describedBy}
        {...props}
        aria-invalid={resolvedAriaInvalid}
        id={inputId}
        className={mergeClassNames(
          'h-9 w-full border bg-[var(--surface)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)]',
          'focus:outline-none focus-visible:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
          hasError ? 'border-[color:var(--danger)]' : 'border-[var(--border)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          inputClassName,
        )}
      />
      {helperText && (
        <p id={helperId} className="text-xs text-[var(--text-muted)]">
          {helperText}
        </p>
      )}
      {hasError && (
        <p id={errorId} className="text-xs text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
});
