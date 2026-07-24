import { useCallback, useEffect, useState } from 'react';

export const MOBILE_DISCLAIMER_STORAGE_KEY = 'tools:mobile-disclaimer:v1';

// index.html pre-paints <html> this color before React loads when this session's notice
// will show (see the inline boot script there; tests/app/mobileBootPaint.test.ts pins its
// literals to these constants).
export const MOBILE_BOOT_PAINT_COLOR = '#0a0a0a';

export const clearMobileBootPaint = (): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.backgroundColor = '';
};

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
    return storage.getItem(MOBILE_DISCLAIMER_STORAGE_KEY) !== null;
  } catch {
    return true;
  }
};

export const markMobileDisclaimerSeen = (storage: GateStorage | undefined = getSessionStorage()): void => {
  if (!storage) return;
  try {
    storage.setItem(MOBILE_DISCLAIMER_STORAGE_KEY, '1');
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
  // While the notice is up, own the boot paint index.html may have applied (re-applying
  // makes this StrictMode-safe: the dev double-invoke's cleanup would otherwise strip it
  // mid-notice). Every exit — gate closed on mount, dismiss, abnormal unmount — clears it
  // so light mode never overscrolls black afterwards.
  useEffect(() => {
    if (!show) {
      clearMobileBootPaint();
      return;
    }
    document.documentElement.style.backgroundColor = MOBILE_BOOT_PAINT_COLOR;
    return clearMobileBootPaint;
  }, [show]);
  const dismiss = useCallback(() => setShow(false), []);
  return [show, dismiss];
}
