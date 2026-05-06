import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'failed';

export type UseCopyToClipboardOptions = {
  resetDelayMs?: number;
  copiedAnnouncement?: string;
  failedAnnouncement?: string;
};

export function useCopyToClipboard({
  resetDelayMs = 2000,
  copiedAnnouncement = 'Copied to clipboard',
  failedAnnouncement = 'Copy failed',
}: UseCopyToClipboardOptions = {}) {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const [announcement, setAnnouncement] = useState('');
  const mountedRef = useRef(true);
  const resetTimeoutRef = useRef<number | undefined>(undefined);
  const requestIdRef = useRef(0);

  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current === undefined) return;
    window.clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = undefined;
  }, []);

  const scheduleReset = useCallback(() => {
    clearResetTimeout();
    resetTimeoutRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      setStatus('idle');
      setAnnouncement('');
      resetTimeoutRef.current = undefined;
    }, resetDelayMs);
  }, [clearResetTimeout, resetDelayMs]);

  const copy = useCallback(
    async (text: string) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      clearResetTimeout();

      try {
        await navigator.clipboard.writeText(text);
        if (!mountedRef.current || requestId !== requestIdRef.current) return true;
        setStatus('copied');
        setAnnouncement(copiedAnnouncement);
        scheduleReset();
        return true;
      } catch {
        if (!mountedRef.current || requestId !== requestIdRef.current) return false;
        setStatus('failed');
        setAnnouncement(failedAnnouncement);
        scheduleReset();
        return false;
      }
    },
    [clearResetTimeout, copiedAnnouncement, failedAnnouncement, scheduleReset],
  );

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    clearResetTimeout();
    setStatus('idle');
    setAnnouncement('');
  }, [clearResetTimeout]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearResetTimeout();
    };
  }, [clearResetTimeout]);

  return {
    status,
    announcement,
    copy,
    reset,
  };
}
