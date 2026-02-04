import { type KeyboardEvent as ReactKeyboardEvent, useRef } from 'react';

type UseRovingFocusOptions = {
  count: number;
  loop?: boolean;
  disabled?: (index: number) => boolean;
};

type RovingItemProps = {
  ref: (node: HTMLElement | null) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
};

export function useRovingFocus({ count, loop = false, disabled }: UseRovingFocusOptions) {
  const refs = useRef<Array<HTMLElement | null>>([]);

  const isDisabled = (index: number) => (disabled ? disabled(index) : false);

  const findFirstEnabled = () => {
    for (let i = 0; i < count; i += 1) {
      if (!isDisabled(i)) return i;
    }
    return -1;
  };

  const findLastEnabled = () => {
    for (let i = count - 1; i >= 0; i -= 1) {
      if (!isDisabled(i)) return i;
    }
    return -1;
  };

  const findNext = (start: number, delta: number) => {
    if (count <= 0) return start;
    let next = start;
    for (let i = 0; i < count; i += 1) {
      next += delta;
      if (next < 0) {
        if (!loop) return start;
        next = count - 1;
      } else if (next >= count) {
        if (!loop) return start;
        next = 0;
      }
      if (!isDisabled(next)) return next;
    }
    return start;
  };

  const handleKeyDown = (index: number) => (event: ReactKeyboardEvent<HTMLElement>) => {
    let nextIndex = index;
    let handled = true;

    switch (event.key) {
      case 'ArrowUp':
        nextIndex = findNext(index, -1);
        break;
      case 'ArrowDown':
        nextIndex = findNext(index, 1);
        break;
      case 'Home': {
        const first = findFirstEnabled();
        if (first === -1) return;
        nextIndex = first;
        break;
      }
      case 'End': {
        const last = findLastEnabled();
        if (last === -1) return;
        nextIndex = last;
        break;
      }
      default:
        handled = false;
        break;
    }

    if (!handled) return;
    event.preventDefault();
    if (nextIndex !== index) {
      refs.current[nextIndex]?.focus();
    }
  };

  const getItemProps = (index: number): RovingItemProps => ({
    ref: (node) => {
      refs.current[index] = node;
    },
    onKeyDown: handleKeyDown(index),
  });

  return { getItemProps };
}
