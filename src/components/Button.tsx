import { type ButtonHTMLAttributes, type ReactNode, type Ref, useCallback, useRef } from 'react';
import { assignRef } from '../lib/refs';
import { type ControlSize, type ControlVariant, controlRecipe } from '../ui/recipes';
import { useArtifactThemeGuard } from './ArtifactThemeRoot';

export type ButtonVariant = ControlVariant;
export type ButtonSize = ControlSize;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
};

export function Button({
  ref,
  children,
  variant = 'default',
  size = 'md',
  disabled,
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  const rootRef = useRef<HTMLButtonElement>(null);
  useArtifactThemeGuard('Button', rootRef);

  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <button
      ref={setRef}
      type={type}
      disabled={disabled}
      className={controlRecipe({ variant, size, disabled, className })}
      {...props}
    >
      {children}
    </button>
  );
}
