import {
  type ButtonHTMLAttributes,
  type ForwardedRef,
  forwardRef,
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useRef,
} from 'react';
import { mergeClassNames } from '../lib/classNames';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type ButtonVariant = 'default' | 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
};

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  if (ref) {
    (ref as MutableRefObject<T | null>).current = value;
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant = 'default', size = 'md', disabled, type = 'button', className, ...props },
  ref,
) {
  const rootRef = useRef<HTMLButtonElement>(null);
  useArtifactThemeGuard('Button', rootRef);

  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const variantBase: Record<ButtonVariant, string> = {
    default: 'border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]',
    primary: 'border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-contrast)]',
    ghost: 'border border-transparent bg-transparent text-[var(--text-muted)]',
    danger: 'border border-[color:var(--danger)] bg-[var(--surface)] text-[var(--danger)]',
  };
  const variantInteractive: Record<ButtonVariant, string> = {
    default: 'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] active:border-[var(--border-strong)]',
    primary: 'hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]',
    ghost: 'hover:bg-[var(--surface-strong)] active:bg-[var(--surface-pressed)]',
    danger: 'hover:bg-[var(--danger-weak)] active:bg-[var(--danger-weak)]',
  };
  const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-sm',
  };

  return (
    <button
      ref={setRef}
      type={type}
      disabled={disabled}
      className={mergeClassNames(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors motion-reduce:transition-none rounded-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        variantBase[variant],
        !disabled && variantInteractive[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
