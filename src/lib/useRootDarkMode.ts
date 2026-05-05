import { useSyncExternalStore } from 'react';

type RootDarkModeElement = {
  classList: {
    contains: (className: string) => boolean;
  };
};

export function isRootDarkMode(
  root: RootDarkModeElement | undefined = typeof document === 'undefined' ? undefined : document.documentElement,
) {
  return root?.classList.contains('dark') ?? false;
}

function getRootDarkModeSnapshot() {
  return isRootDarkMode();
}

function subscribeToRootDarkMode(onChange: () => void) {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return () => {};

  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  return () => observer.disconnect();
}

export function useRootDarkMode() {
  return useSyncExternalStore(subscribeToRootDarkMode, getRootDarkModeSnapshot, () => false);
}
