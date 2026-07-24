import { useCallback, useEffect, useRef, useState } from 'react';
import { mergeClassNames } from '../lib/classNames';

// Spec timeline (motion-safe, opacity only): fade in 0→0.5s ease-out, hold to 2.0s, fade out
// 2.0→2.6s ease-in, unmount; the hint fades in ~0.6s late. Tap anywhere or Escape skips with a
// fast ~200ms fade. Reduced motion: instant show, ~1.4s hold, instant remove, still dismissable.
const HOLD_MS = 2000;
const FADE_OUT_MS = 600;
const SKIP_FADE_MS = 200;
const REDUCED_HOLD_MS = 1400;

type Phase = 'enter' | 'shown' | 'leaving' | 'skipping';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type MobileDisclaimerProps = {
  onDone: () => void;
};

export function MobileDisclaimer({ onDone }: MobileDisclaimerProps) {
  const [reduceMotion] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState<Phase>(reduceMotion ? 'shown' : 'enter');
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  const skip = useCallback(() => {
    if (doneRef.current) return;
    if (reduceMotion) {
      finish();
      return;
    }
    setPhase('skipping');
  }, [reduceMotion, finish]);

  // Flip enter→shown on a mount rAF so the fade-in transition actually runs.
  useEffect(() => {
    if (phase !== 'enter') return;
    const frame = requestAnimationFrame(() => setPhase('shown'));
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'shown') return;
    const timer = setTimeout(
      () => {
        if (reduceMotion) {
          finish();
        } else {
          setPhase('leaving');
        }
      },
      reduceMotion ? REDUCED_HOLD_MS : HOLD_MS,
    );
    return () => clearTimeout(timer);
  }, [phase, reduceMotion, finish]);

  useEffect(() => {
    if (phase !== 'leaving' && phase !== 'skipping') return;
    const timer = setTimeout(finish, phase === 'skipping' ? SKIP_FADE_MS : FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [phase, finish]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skip]);

  return (
    // Committed dark in both themes: house lights down before the index appears. <output>
    // carries the implicit status role (aria-live polite) the spec asks for.
    <output
      aria-live="polite"
      className={mergeClassNames(
        'fixed inset-0 z-[100] block bg-[#0a0a0a] motion-safe:transition-opacity',
        phase === 'enter' && 'opacity-0',
        phase === 'shown' && 'opacity-100 motion-safe:duration-500 motion-safe:ease-out',
        phase === 'leaving' && 'opacity-0 motion-safe:duration-[600ms] motion-safe:ease-in',
        phase === 'skipping' && 'opacity-0 motion-safe:duration-200 motion-safe:ease-in',
      )}
    >
      {/* Buttons allow only phrasing content, so the copy is block-styled spans, not <p>. */}
      <button
        type="button"
        onClick={skip}
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center px-6 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-600"
      >
        <span className="block max-w-[26ch] text-lg font-medium tracking-tight text-neutral-100">
          The tools that follow were designed for larger screens.
        </span>
        <span className="mt-3 block text-sm leading-relaxed text-neutral-400">They will still run on this one.</span>
        <span
          className={mergeClassNames(
            'mt-10 block font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500',
            'motion-safe:transition-opacity motion-safe:duration-500 motion-safe:delay-[600ms]',
            phase === 'enter' ? 'opacity-0' : 'opacity-100',
          )}
        >
          Tap to continue
        </span>
      </button>
    </output>
  );
}
