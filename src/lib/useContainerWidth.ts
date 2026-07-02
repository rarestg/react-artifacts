import { useEffect, useRef, useState } from 'react';

function getElementContentWidth(element: HTMLElement): number {
  const styles = window.getComputedStyle(element);
  const borderX = (Number.parseFloat(styles.borderLeftWidth) || 0) + (Number.parseFloat(styles.borderRightWidth) || 0);
  const paddingX = (Number.parseFloat(styles.paddingLeft) || 0) + (Number.parseFloat(styles.paddingRight) || 0);

  return Math.max(0, element.getBoundingClientRect().width - borderX - paddingX);
}

/** Tracks an element's content-box width via ResizeObserver; `width` is null until first measure. */
export function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    setWidth(getElementContentWidth(element));
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
