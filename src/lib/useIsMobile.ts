import { useSyncExternalStore } from 'react';

// Below 768px the workbench is structurally cramped, so App mounts the mobile index instead.
export const MOBILE_MEDIA_QUERY = '(max-width: 767.98px)';

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia(MOBILE_MEDIA_QUERY);
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function getSnapshot() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
