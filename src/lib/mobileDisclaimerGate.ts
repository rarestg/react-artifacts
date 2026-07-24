import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tools:mobile-disclaimer:v1';

type GateStorage = Pick<Storage, 'getItem' | 'setItem'>;

const getSessionStorage = (): GateStorage | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

// Read-only, so it is safe inside a useState initializer (StrictMode may run it twice).
// When storage is unavailable we claim "seen" so a blocked store never nags on every load.
export const hasSeenMobileDisclaimer = (storage: GateStorage | undefined = getSessionStorage()): boolean => {
  if (!storage) return true;
  try {
    return storage.getItem(STORAGE_KEY) !== null;
  } catch {
    return true;
  }
};

export const markMobileDisclaimerSeen = (storage: GateStorage | undefined = getSessionStorage()): void => {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, '1');
  } catch {
    // ignore storage failures
  }
};

// Decides once per mount whether this session's disclaimer shows, and marks it shown. The read
// stays in the initializer (pure) and the write in an effect (idempotent under StrictMode).
export function useMobileDisclaimerGate(): [boolean, () => void] {
  const [show, setShow] = useState(() => !hasSeenMobileDisclaimer());
  useEffect(() => {
    if (show) markMobileDisclaimerSeen();
  }, [show]);
  const dismiss = useCallback(() => setShow(false), []);
  return [show, dismiss];
}
