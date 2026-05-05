import { Info } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

import { ArtifactDialog } from '../../components/ArtifactDialog';
import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { CopyButton } from '../../components/CopyButton';
import { mergeClassNames } from '../../lib/classNames';
import { useRootDarkMode } from '../../lib/useRootDarkMode';
import {
  DARK_LIGHTNESS_CEILING,
  getDarkLiftFraction,
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

type PaletteCardLabelInput = {
  labelMode: PaletteLabelMode;
  hueLabel?: string;
  index: number;
  hue: number;
  count: number;
};

type PaletteExportColorInput = {
  index: number;
  label: string;
  lightStrongColor: string;
  darkStrongColor: string;
  weakMix: number;
};

const panelClass = 'border border-[var(--border)] bg-[var(--surface)]';
const focusClass =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]';
const maxColorCount = 16;
const headerActionFrameClass = mergeClassNames(
  'inline-flex h-9 shrink-0 cursor-pointer items-center justify-center border border-[var(--border-strong)] bg-[var(--surface)]',
  'transition-colors hover:bg-[var(--surface-muted)] active:bg-[var(--surface-strong)] motion-reduce:transition-none',
  focusClass,
);
const headerTextActionClass = mergeClassNames(headerActionFrameClass, 'px-3 text-sm font-medium text-[var(--text)]');
const headerIconActionClass = mergeClassNames(
  headerActionFrameClass,
  'w-9 text-[var(--text-muted)] hover:text-[var(--text)]',
);
const modeButtonBase =
  'inline-flex h-8 items-center justify-center border px-2 text-xs font-medium transition-colors motion-reduce:transition-none';

const helpItems = [
  {
    term: 'Rotation',
    detail: 'Rotates the palette order while preserving core color categories.',
  },
  {
    term: 'H',
    detail: 'Final OKLCH hue in degrees for this generated color.',
  },
  {
    term: 'L',
    detail: 'Final OKLCH lightness after profile defaults, lightness bias, and dark-mode lift.',
  },
  {
    term: 'Chroma',
    detail: 'Final OKLCH color intensity. Dense palettes reduce chroma slightly to keep colors distinct.',
  },
  {
    term: 'Labels',
    detail:
      'Color names come from profile anchors. If no name is close enough, the card falls back to its index label.',
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
    detail: 'In dark mode, moves each color toward the lightness ceiling based on available headroom.',
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

export function getPaletteCardLabel({ labelMode, hueLabel, index, hue, count }: PaletteCardLabelInput) {
  const indexLabel = getDisplayLabel({ index, hue, count, mode: 'index' });
  return labelMode === 'hue' ? hueLabel || indexLabel : indexLabel;
}

function rgbToHex([red, green, blue]: [number, number, number]) {
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function slugifyColorName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getExportVariableBase(label: string, index: number) {
  const slug = slugifyColorName(label);
  const fallbackIndex = String(index + 1).padStart(2, '0');

  if (!slug) return `color-${fallbackIndex}`;
  if (/^color-\d+$/.test(slug)) return slug;

  return `color-${slug}`;
}

function getExportColorNames(colors: ReadonlyArray<PaletteExportColorInput>) {
  const usedNames = new Set<string>();

  return colors.map((color) => {
    const baseName = getExportVariableBase(color.label, color.index);
    let name = baseName;
    let suffix = 2;

    while (usedNames.has(name)) {
      name = `${baseName}-${suffix}`;
      suffix += 1;
    }

    usedNames.add(name);
    return name;
  });
}

function getStrongColorDeclaration(name: string, color: string) {
  const hex = parseColor(color);
  const hexComment = hex ? ` /* ${rgbToHex(hex)} */` : '';

  return `  --${name}: ${color};${hexComment}`;
}

function getToneDeclarations(color: PaletteExportColorInput, name: string, strongColor: string) {
  return [
    getStrongColorDeclaration(name, strongColor),
    `  --${name}-weak: color-mix(in oklch, var(--${name}) ${color.weakMix.toFixed(1)}%, var(--palette-surface));`,
    `  --${name}-border: var(--${name});`,
  ];
}

export function getPaletteExportCss(colors: ReadonlyArray<PaletteExportColorInput>) {
  const names = getExportColorNames(colors);
  const lightDeclarations = colors.flatMap((color, index) => {
    const name = names[index] ?? getExportVariableBase(color.label, color.index);
    return getToneDeclarations(color, name, color.lightStrongColor);
  });
  const darkDeclarations = colors.flatMap((color, index) => {
    const name = names[index] ?? getExportVariableBase(color.label, color.index);
    return getToneDeclarations(color, name, color.darkStrongColor);
  });

  return [
    ':root {',
    '  --palette-surface: #ffffff;',
    ...lightDeclarations,
    '}',
    '',
    '.dark {',
    '  --palette-surface: #0b1120;',
    ...darkDeclarations,
    '}',
  ].join('\n');
}

export default function PaletteLab() {
  const isDarkTheme = useRootDarkMode();
  const theme: PaletteTheme = isDarkTheme ? 'dark' : 'light';
  const [count, setCount] = useState(12);
  const [hueOffset, setHueOffset] = useState(220);
  const [lightStrongL, setLightStrongL] = useState(60);
  const [darkLift, setDarkLift] = useState(18);
  const [weakMix, setWeakMix] = useState(22);
  const [autoTune, setAutoTune] = useState(true);
  const [labelMode, setLabelMode] = useState<PaletteLabelMode>('hue');
  const [selectedIndexes, setSelectedIndexes] = useState(() => Array.from({ length: 16 }, (_, index) => index));
  const [contrastRatios, setContrastRatios] = useState<Record<number, number>>({});
  const [helpOpen, setHelpOpen] = useState(false);
  const dialogPortalRef = useRef<HTMLDivElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);

  const tuned = useMemo(
    () => getTunedPaletteSettings({ count, darkLift, weakMix, autoTune }),
    [autoTune, count, darkLift, weakMix],
  );
  const darkLiftFraction = getDarkLiftFraction(tuned.darkLift);
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
  const lightExportColors = useMemo(
    () =>
      makeGeneratedPalette({
        count,
        hueOffset,
        lightStrongL,
        darkLift,
        weakMix,
        autoTune,
        theme: 'light',
      }),
    [autoTune, count, darkLift, hueOffset, lightStrongL, weakMix],
  );
  const darkExportColors = useMemo(
    () =>
      makeGeneratedPalette({
        count,
        hueOffset,
        lightStrongL,
        darkLift,
        weakMix,
        autoTune,
        theme: 'dark',
      }),
    [autoTune, count, darkLift, hueOffset, lightStrongL, weakMix],
  );
  const paletteMaxChroma = useMemo(() => Math.max(...colors.map((color) => color.chroma)), [colors]);
  const hueLabelsByPosition = useMemo(() => getHueLabelsForPalette(colors, count), [colors, count]);
  const paletteCardLabels = useMemo(
    () =>
      colors.map((color, position) =>
        getPaletteCardLabel({
          labelMode,
          hueLabel: hueLabelsByPosition[position],
          index: color.index,
          hue: color.hue,
          count,
        }),
      ),
    [colors, count, hueLabelsByPosition, labelMode],
  );
  const selectedExportColors = useMemo(
    () =>
      colors.flatMap((color, position) =>
        selectedIndexes.includes(color.index)
          ? [
              {
                index: color.index,
                label: paletteCardLabels[position],
                lightStrongColor: lightExportColors[position]?.strongColor ?? color.strongColor,
                darkStrongColor: darkExportColors[position]?.strongColor ?? color.strongColor,
                weakMix: color.weakMix,
              },
            ]
          : [],
      ),
    [colors, darkExportColors, lightExportColors, paletteCardLabels, selectedIndexes],
  );
  const paletteExportCss = useMemo(() => getPaletteExportCss(selectedExportColors), [selectedExportColors]);
  const selectedVisibleCount = selectedExportColors.length;
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
    <ArtifactThemeRoot className="min-h-screen bg-[var(--surface-muted)] text-[var(--text)]">
      <div className="grid min-h-screen grid-cols-[20rem_minmax(0,1fr)] gap-4 p-4 max-lg:grid-cols-1">
        <aside className={mergeClassNames(panelClass, 'self-start p-4')}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-semibold">Palette Lab</h1>
              <div className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">
                {count} colors / {theme}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            <RangeControl
              label="Color count"
              value={count}
              min={4}
              max={maxColorCount}
              step={1}
              displayValue={String(count)}
              onChange={setCount}
            />
            <RangeControl
              label="Rotation"
              value={hueOffset}
              min={0}
              max={359}
              step={1}
              displayValue={`${hueOffset}deg`}
              onChange={setHueOffset}
            />
            <RangeControl
              label="Lightness bias"
              value={lightStrongL}
              min={48}
              max={72}
              step={1}
              displayValue={`${lightStrongL - 60 >= 0 ? '+' : ''}${lightStrongL - 60}%`}
              onChange={setLightStrongL}
            />
            <RangeControl
              label="Dark lift"
              value={darkLift}
              min={8}
              max={28}
              step={1}
              displayValue={`${Math.round(darkLiftFraction * 100)}%`}
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
                <ModeButton active={labelMode === 'hue'} onClick={() => setLabelMode('hue')}>
                  Color name
                </ModeButton>
                <ModeButton active={labelMode === 'index'} onClick={() => setLabelMode('index')}>
                  Index
                </ModeButton>
              </div>
            </div>

            <button
              type="button"
              aria-pressed={autoTune}
              onClick={() => setAutoTune((current) => !current)}
              className={mergeClassNames(
                'h-8 border px-2 text-xs font-medium',
                autoTune
                  ? 'border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]',
                focusClass,
              )}
            >
              Auto tune: {autoTune ? 'on' : 'off'}
            </button>

            <FormulaPanel
              theme={theme}
              paletteMaxChroma={paletteMaxChroma}
              weakMix={tuned.weakMix}
              darkLiftFraction={darkLiftFraction}
            />
          </div>
        </aside>

        <main className="grid min-w-0 content-start gap-4">
          <section
            className={mergeClassNames(panelClass, 'flex flex-wrap items-center justify-between gap-3 px-4 py-3')}
          >
            <div className="min-w-0">
              <h2 className="text-base font-semibold">Generated Toggle Grid</h2>
              <div className="mt-1 text-xs text-[var(--text-muted)]">
                {selectedVisibleCount} selected / {labelMode === 'index' ? 'index labels' : 'color names'}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 max-sm:w-full max-sm:justify-start">
              <button type="button" onClick={toggleAll} className={headerTextActionClass}>
                <span className="relative inline-grid min-w-0">
                  <span aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 opacity-0">
                    Select all
                  </span>
                  <span className="col-start-1 row-start-1">{allVisibleSelected ? 'Clear' : 'Select all'}</span>
                </span>
              </button>
              <CopyButton
                text={paletteExportCss}
                idleLabel={`Copy ${selectedVisibleCount} selected`}
                reserveLabel={`Copy ${maxColorCount} selected`}
                ariaLabel="Copy selected colors as CSS custom properties"
                disabled={selectedVisibleCount === 0}
                variant="headerAction"
              />
              <button
                ref={helpButtonRef}
                type="button"
                aria-label="Open palette lab help"
                onClick={() => setHelpOpen(true)}
                className={headerIconActionClass}
              >
                <Info className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </section>

          <section
            className={mergeClassNames(
              panelClass,
              'grid grid-cols-4 gap-3 p-4 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1',
            )}
            aria-label="Generated color toggles"
          >
            {colors.map((color, position) => {
              const selected = selectedIndexes.includes(color.index);
              const label = paletteCardLabels[position];
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
                  className={mergeClassNames(
                    'grid min-h-36 grid-rows-[auto_1fr_auto] gap-3 border p-3 text-left transition-[background-color,border-color,color] motion-reduce:transition-none',
                    selected
                      ? 'border-[color:var(--palette-color)] bg-[var(--palette-color-weak)] text-[var(--text)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)]',
                    focusClass,
                  )}
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
      <div ref={dialogPortalRef} className="pointer-events-none" />
      <PaletteHelpDialog
        open={helpOpen}
        onOpenChange={(open) => setHelpOpen(open)}
        container={dialogPortalRef.current}
        returnFocusTo={helpButtonRef.current}
      />
    </ArtifactThemeRoot>
  );
}

function PaletteHelpDialog({
  open,
  onOpenChange,
  container,
  returnFocusTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: HTMLElement | null;
  returnFocusTo: HTMLButtonElement | null;
}) {
  return (
    <ArtifactDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reading the cards"
      description="The card metrics show how each generated OKLCH color is built and how readable it is."
      closeLabel="Close palette lab help"
      container={container}
      placement="viewport"
      align="start"
      contentClassName="mt-12 max-h-[calc(100%-6rem)] max-w-[34rem] max-sm:mt-0 max-sm:max-h-full"
      bodyClassName="min-h-0 overflow-y-auto p-4"
      returnFocusTo={returnFocusTo}
    >
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
    </ArtifactDialog>
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
      className={mergeClassNames(
        modeButtonBase,
        active
          ? 'border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--text)]'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]',
        focusClass,
      )}
    >
      {children}
    </button>
  );
}

function FormulaPanel({
  theme,
  paletteMaxChroma,
  weakMix,
  darkLiftFraction,
}: {
  theme: PaletteTheme;
  paletteMaxChroma: number;
  weakMix: number;
  darkLiftFraction: number;
}) {
  return (
    <div className="grid gap-2 border border-[var(--border)] bg-[var(--surface-muted)] p-3 font-mono text-[11px] leading-5 text-[var(--text-muted)]">
      <div>
        <span className="text-[var(--text)]">strong</span> profile -&gt;{' '}
        {theme === 'dark'
          ? `L toward ${DARK_LIGHTNESS_CEILING} ${Math.round(darkLiftFraction * 100)}%`
          : 'oklch(L C h)'}
      </div>
      <div>
        <span className="text-[var(--text)]">palette max C</span> {paletteMaxChroma.toFixed(3)}
      </div>
      <div>
        <span className="text-[var(--text)]">weak</span> color-mix(in oklch, strong {weakMix.toFixed(1)}%, surface)
      </div>
    </div>
  );
}
