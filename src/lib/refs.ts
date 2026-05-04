import type { ForwardedRef } from 'react';

export function assignRef<T>(ref: ForwardedRef<T> | undefined, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}
