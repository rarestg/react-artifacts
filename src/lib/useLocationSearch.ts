import { useSyncExternalStore } from 'react';

// location.search as reactive state: re-reads on popstate (Back/Forward). pushState/replaceState
// callers re-render through their own state, so render-time reads stay current there too.
function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('popstate', onStoreChange);
  return () => window.removeEventListener('popstate', onStoreChange);
}

function getSnapshot() {
  return typeof window === 'undefined' ? '' : window.location.search;
}

export function useLocationSearch() {
  return useSyncExternalStore(subscribe, getSnapshot, () => '');
}
