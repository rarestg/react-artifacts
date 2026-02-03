import { useEffect, useRef, useState } from 'react';

const WRITE_DEBOUNCE_MS = 200;

const readStorage = <T>(key: string, defaultValue: T) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
};

export function useLocalStorageState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => readStorage(key, defaultValue));
  const lastKeyRef = useRef(key);
  const skipWriteRef = useRef(false);
  const writeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    if (writeTimeoutRef.current) {
      window.clearTimeout(writeTimeoutRef.current);
      writeTimeoutRef.current = null;
    }
    skipWriteRef.current = true;
    setState(readStorage(key, defaultValue));
  }, [key, defaultValue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (skipWriteRef.current) {
      skipWriteRef.current = false;
      return;
    }
    try {
      if (writeTimeoutRef.current) {
        window.clearTimeout(writeTimeoutRef.current);
      }
      writeTimeoutRef.current = window.setTimeout(() => {
        try {
          window.localStorage.setItem(key, JSON.stringify(state));
        } catch {
          // Ignore storage write failures (private mode, quota, etc.).
        }
      }, WRITE_DEBOUNCE_MS);
    } catch {
      // Ignore storage write failures (private mode, quota, etc.).
    }
    return () => {
      if (writeTimeoutRef.current) {
        window.clearTimeout(writeTimeoutRef.current);
        writeTimeoutRef.current = null;
      }
    };
  }, [key, state]);

  return [state, setState] as const;
}
