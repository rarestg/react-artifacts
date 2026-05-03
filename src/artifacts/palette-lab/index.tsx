import { Info, X } from 'lucide-react';
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import {
  getDisplayLabel,
  getHueLabelsForPalette,
  getTunedPaletteSettings,
  makeGeneratedPalette,
  type PaletteLabelMode,
  type PaletteTheme,
} from './palette';

type PaletteColorStyle = CSSProperties & {
  '--palette-color': string;
  '--palette-color-weak': string;
};

type RangeControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
};

const panelClass = 'border border-[var(--border)] bg-[var(--surface)]';
const focusClass =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]';
const modeButtonBase =
  'inline-flex h-8 items-center justify-center border px-2 text-xs font-medium transition-colors motion-reduce:transition-none';
const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const helpItems = [
  {
    term: 'H',
    detail: 'Hue angle in degrees on the OKLCH color wheel. Moving it rotates the generated palette around the wheel.',
  },
  {
    term: 'L',
    detail: 'Lightness for the strong color. Higher values make the generated swatch brighter.',
  },
  {
    term: 'Chroma',
    detail:
      'Color intensity in OKLCH. Palette Lab uses the highest base chroma, then softens it as color count gets denser.',
  },
  {
    term: 'Mix',
    detail: 'How much of the strong color is blended into the surface color to make the weak card background.',
  },
  {
    term: 'Contrast',
    detail:
      'Text contrast ratio measured from the rendered card text color against the rendered card background. Higher ratios are easier to read.',
  },
  {
    term: 'Dark lift',
    detail: 'Extra lightness added in dark mode so vivid colors stay visible against dark surfaces.',
  },
  {
    term: 'Auto tune',
    detail: 'Small count-based adjustments that lower weak mix and raise dark lift as the palette gets denser.',
  },
] as const;

function parseColor(value: string): [number, number, number] | null {
  const trimmed = value.trim();
  const rgb = trimmed.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const channels = rgb[1]
      .split(',')
      .slice(0, 3)
      .map((part) => Math.round(Number.parseFloat(part.trim())));
    return channels.length === 3 ? (channels as [number, number, number]) : null;
  }

  const srgb = trimmed.match(/^color\(srgb\s+([^\s]+)\s+([^\s]+)\s+([^\s/]+)(?:\s*\/.*)?\)$/i);
  if (srgb) {
    return [1, 2, 3].map((index) => Math.round(Number.parseFloat(srgb[index]) * 255)) as [number, number, number];
  }

  const oklch = trimmed.match(/^oklch\(([^)]+)\)$/i);
  if (oklch) {
    const parts = oklch[1].split(/\s+/).filter(Boolean);
    const lightness = parts[0].endsWith('%') ? Number.parseFloat(parts[0]) / 100 : Number.parseFloat(parts[0]);
    const chroma = Number.parseFloat(parts[1]);
    const hue = Number.parseFloat(parts[2]);
    if (![lightness, chroma, hue].every(Number.isFinite)) return null;
    return oklchToRgb(lightness, chroma, hue);
  }

  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function linearToSrgb(value: number) {
  const encoded = value <= 0.003_130_8 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
  return Math.round(clamp(encoded, 0, 1) * 255);
}

function oklchToRgb(lightness: number, chroma: number, hue: number): [number, number, number] {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);

  const lPrime = lightness + 0.396_337_777_4 * a + 0.215_803_757_3 * b;
  const mPrime = lightness - 0.105_561_345_8 * a - 0.063_854_172_8 * b;
  const sPrime = lightness - 0.089_484_177_5 * a - 1.291_485_548 * b;

  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;

  return [
    linearToSrgb(4.076_741_662_1 * l - 3.307_711_591_3 * m + 0.230_969_929_2 * s),
    linearToSrgb(-1.268_438_004_6 * l + 2.609_757_401_1 * m - 0.341_319_396_5 * s),
    linearToSrgb(-0.004_196_086_3 * l - 0.703_418_614_7 * m + 1.707_614_701 * s),
  ];
}

function channelToLinear(value: number) {
  const channel = value / 255;
  return channel <= 0.039_28 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string) {
  const parsed = parseColor(color);
  if (!parsed) return undefined;
  const [r, g, b] = parsed.map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrast(foreground: string, background: string) {
  const fg = luminance(foreground);
  const bg = luminance(background);
  if (fg === undefined || bg === undefined) return undefined;
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

export default function PaletteLab() {
  const [theme, setTheme] = useState<PaletteTheme>('light');
  const [count, setCount] = useState(12);
  const [hueOffset, setHueOffset] = useState(220);
  const [lightStrongL, setLightStrongL] = useState(60);
  const [darkLift, setDarkLift] = useState(18);
  const [weakMix, setWeakMix] = useState(22);
  const [autoTune, setAutoTune] = useState(true);
  const [labelMode, setLabelMode] = useState<PaletteLabelMode>('index');
  const [selectedIndexes, setSelectedIndexes] = useState(() => Array.from({ length: 16 }, (_, index) => index));
  const [contrastRatios, setContrastRatios] = useState<Record<number, number>>({});
  const [helpOpen, setHelpOpen] = useState(false);
  const helpButtonRef = useRef<HTMLButtonElement>(null);

  const tuned = useMemo(
    () => getTunedPaletteSettings({ count, darkLift, weakMix, autoTune }),
    [autoTune, count, darkLift, weakMix],
  );
  const colors = useMemo(
    () =>
      makeGeneratedPalette({
        count,
        hueOffset,
        lightStrongL,
        darkLift,
        weakMix,
        autoTune,
        theme,
      }),
    [autoTune, count, darkLift, hueOffset, lightStrongL, theme, weakMix],
  );
  const hueLabelsByPosition = useMemo(() => getHueLabelsForPalette(colors, count), [colors, count]);
  const selectedVisibleCount = colors.filter((color) => selectedIndexes.includes(color.index)).length;
  const allVisibleSelected = selectedVisibleCount === colors.length;
  const contrastMeasurementKey = useMemo(() => {
    const colorKey = colors.map((color) => `${color.strongColor}:${color.weakColor}`).join('|');
    const selectedKey = [...selectedIndexes].sort((a, b) => a - b).join(',');
    return `${theme}:${selectedKey}:${colorKey}`;
  }, [colors, selectedIndexes, theme]);

  useEffect(() => {
    void contrastMeasurementKey;
    let frame = 0;
    const timeouts: number[] = [];
    const measureContrast = () => {
      const nextRatios: Record<number, number> = {};
      for (const element of document.querySelectorAll<HTMLElement>('[data-palette-index]')) {
        const index = Number(element.dataset.paletteIndex);
        const styles = window.getComputedStyle(element);
        const ratio = getContrast(styles.color, styles.backgroundColor);
        if (ratio !== undefined) {
          nextRatios[index] = Number(ratio.toFixed(2));
        }
      }
      setContrastRatios((current) => {
        const currentKeys = Object.keys(current);
        const nextKeys = Object.keys(nextRatios);
        if (
          currentKeys.length === nextKeys.length &&
          nextKeys.every((key) => current[Number(key)] === nextRatios[Number(key)])
        ) {
          return current;
        }
        return nextRatios;
      });
    };

    frame = window.requestAnimationFrame(measureContrast);
    timeouts.push(window.setTimeout(measureContrast, 100));
    timeouts.push(window.setTimeout(measureContrast, 500));
    timeouts.push(window.setTimeout(measureContrast, 1000));

    return () => {
      window.cancelAnimationFrame(frame);
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
    };
  }, [contrastMeasurementKey]);

  const toggleIndex = (index: number) => {
    setSelectedIndexes((current) =>
      current.includes(index) ? current.filter((selected) => selected !== index) : [...current, index],
    );
  };

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIndexes([]);
      return;
    }
    setSelectedIndexes(colors.map((color) => color.index));
  };

  return (
    <div className={theme === 'dark' ? 'dark' : undefined}>
      <ArtifactThemeRoot className="min-h-screen bg-[var(--surface-muted)] text-[var(--text)]">
        <div className="grid min-h-screen grid-cols-[20rem_minmax(0,1fr)] gap-4 p-4 max-lg:grid-cols-1">
          <aside className={[panelClass, 'self-start p-4'].join(' ')}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-base font-semibold">Palette Lab</h1>
                <div className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">
                  {count} colors / {theme}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                className={[
                  'h-8 shrink-0 border border-[var(--border-strong)] bg-[var(--surface)] px-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-muted)]',
                  focusClass,
                ].join(' ')}
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              <RangeControl
                label="Color count"
                value={count}
                min={4}
                max={16}
                step={1}
                displayValue={String(count)}
                onChange={setCount}
              />
              <RangeControl
                label="Hue offset"
                value={hueOffset}
                min={0}
                max={359}
                step={1}
                displayValue={`${hueOffset}deg`}
                onChange={setHueOffset}
              />
              <RangeControl
                label="Light strong L"
                value={lightStrongL}
                min={48}
                max={72}
                step={1}
                displayValue={`${lightStrongL}%`}
                onChange={setLightStrongL}
              />
              <RangeControl
                label="Dark lift"
                value={darkLift}
                min={8}
                max={28}
                step={1}
                displayValue={`+${tuned.darkLift.toFixed(1)}`}
                onChange={setDarkLift}
              />
              <RangeControl
                label="Weak mix"
                value={weakMix}
                min={10}
                max={34}
                step={1}
                displayValue={`${tuned.weakMix.toFixed(1)}%`}
                onChange={setWeakMix}
              />

              <div className="grid gap-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Labels
                </div>
                <div className="grid grid-cols-2">
                  <ModeButton active={labelMode === 'index'} onClick={() => setLabelMode('index')}>
                    Index
                  </ModeButton>
                  <ModeButton active={labelMode === 'hue'} onClick={() => setLabelMode('hue')}>
                    Hue name
                  </ModeButton>
                </div>
              </div>

              <button
                type="button"
                aria-pressed={autoTune}
                onClick={() => setAutoTune((current) => !current)}
                className={[
                  'h-8 border px-2 text-xs font-medium',
                  autoTune
                    ? 'border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--text)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]',
                  focusClass,
                ].join(' ')}
              >
                Auto tune: {autoTune ? 'on' : 'off'}
              </button>

              <FormulaPanel theme={theme} chroma={tuned.chroma} weakMix={tuned.weakMix} darkLift={tuned.darkLift} />
            </div>
          </aside>

          <main className="grid min-w-0 content-start gap-4">
            <section className={[panelClass, 'flex flex-wrap items-center justify-between gap-3 px-4 py-3'].join(' ')}>
              <div className="min-w-0">
                <h2 className="text-base font-semibold">Generated Toggle Grid</h2>
                <div className="mt-1 text-xs text-[var(--text-muted)]">
                  {selectedVisibleCount} selected / {labelMode === 'index' ? 'index labels' : 'hue labels'}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAll}
                  className={[
                    'h-9 border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-muted)]',
                    focusClass,
                  ].join(' ')}
                >
                  {allVisibleSelected ? 'Clear' : 'Select all'}
                </button>
                <button
                  ref={helpButtonRef}
                  type="button"
                  aria-label="Open palette lab help"
                  onClick={() => setHelpOpen(true)}
                  className={[
                    'inline-flex h-9 w-9 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
                    focusClass,
                  ].join(' ')}
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </section>

            <section
              className={[
                panelClass,
                'grid grid-cols-4 gap-3 p-4 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1',
              ].join(' ')}
              aria-label="Generated color toggles"
            >
              {colors.map((color, position) => {
                const selected = selectedIndexes.includes(color.index);
                const label =
                  labelMode === 'hue'
                    ? hueLabelsByPosition[position]
                    : getDisplayLabel({ index: color.index, hue: color.hue, count, mode: 'index' });
                const style = {
                  '--palette-color': color.strongColor,
                  '--palette-color-weak': color.weakColor,
                } as PaletteColorStyle;
                const ratio = contrastRatios[color.index];

                return (
                  <button
                    key={color.index}
                    type="button"
                    data-palette-index={color.index}
                    aria-pressed={selected}
                    onClick={() => toggleIndex(color.index)}
                    style={style}
                    className={[
                      'grid min-h-36 grid-rows-[auto_1fr_auto] gap-3 border p-3 text-left transition-[background-color,border-color,color] motion-reduce:transition-none',
                      selected
                        ? 'border-[color:var(--palette-color)] bg-[var(--palette-color-weak)] text-[var(--text)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)]',
                      focusClass,
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 break-words text-xs font-semibold uppercase tracking-[0.16em]">
                        {label}
                      </span>
                      <span
                        className="h-4 w-4 shrink-0 border border-[color:var(--palette-color)] bg-[var(--palette-color)]"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="grid content-end gap-1.5" aria-hidden="true">
                      <div className="grid grid-cols-2 gap-1.5">
                        <span className="h-4 border border-[color:var(--palette-color)] bg-[var(--palette-color)]" />
                        <span className="h-4 border border-[color:var(--palette-color)] bg-[var(--palette-color-weak)]" />
                      </div>
                    </div>

                    <div className="grid gap-1 font-mono text-[11px] leading-4 text-[var(--text-muted)]">
                      <span>
                        h {color.hue.toFixed(1)} / L {color.strongLightness.toFixed(1)}
                      </span>
                      <span>mix {color.weakMix.toFixed(1)}%</span>
                      <span className="font-semibold text-[var(--text)]">
                        contrast {ratio === undefined ? '...' : `${ratio.toFixed(2)}:1`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </section>
          </main>
        </div>
        {helpOpen ? (
          <PaletteHelpDialog returnFocusTo={helpButtonRef.current} onClose={() => setHelpOpen(false)} />
        ) : null}
      </ArtifactThemeRoot>
    </div>
  );
}

function PaletteHelpDialog({
  returnFocusTo,
  onClose,
}: {
  returnFocusTo: HTMLButtonElement | null;
  onClose: () => void;
}) {
  const headingId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();

    return () => {
      if (returnFocusTo?.isConnected) {
        returnFocusTo.focus();
      }
    };
  }, [returnFocusTo]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement;

    if (!dialogRef.current?.contains(activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (!focusable.includes(activeElement as HTMLElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }

    if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[color:var(--overlay)] p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        onKeyDown={handleKeyDown}
        className="mt-12 flex max-h-[calc(100vh-6rem)] w-full max-w-[34rem] flex-col border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] max-sm:mt-0 max-sm:max-h-full"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <div className="min-w-0">
            <h2
              ref={headingRef}
              id={headingId}
              tabIndex={-1}
              className={['text-base font-semibold', focusClass].join(' ')}
            >
              Reading the cards
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-[var(--text-muted)]">
              The card metrics show how each generated OKLCH color is built and how readable it is.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close palette lab help"
            className={['p-1 text-[var(--text-muted)] hover:text-[var(--text)]', focusClass].join(' ')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-4">
          <dl className="grid gap-3 text-sm">
            {helpItems.map((item) => (
              <div key={item.term} className="grid gap-1 border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text)]">
                  {item.term}
                </dt>
                <dd className="text-[var(--text-muted)]">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

function RangeControl({ label, value, min, max, step, displayValue, onChange }: RangeControlProps) {
  return (
    <label className="grid gap-2">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</span>
        <span className="font-mono text-[11px] text-[var(--text)]">{displayValue}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[var(--text)]"
      />
    </label>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        modeButtonBase,
        active
          ? 'border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--text)]'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]',
        focusClass,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function FormulaPanel({
  theme,
  chroma,
  weakMix,
  darkLift,
}: {
  theme: PaletteTheme;
  chroma: number;
  weakMix: number;
  darkLift: number;
}) {
  return (
    <div className="grid gap-2 border border-[var(--border)] bg-[var(--surface-muted)] p-3 font-mono text-[11px] leading-5 text-[var(--text-muted)]">
      <div>
        <span className="text-[var(--text)]">strong</span> oklch({theme === 'dark' ? `L + ${darkLift.toFixed(1)}` : 'L'}{' '}
        {chroma.toFixed(3)} h)
      </div>
      <div>
        <span className="text-[var(--text)]">weak</span> color-mix(in oklch, strong {weakMix.toFixed(1)}%, surface)
      </div>
    </div>
  );
}
