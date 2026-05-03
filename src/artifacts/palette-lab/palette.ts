export type PaletteTheme = 'light' | 'dark';
export type PaletteLabelMode = 'index' | 'hue';

export type PaletteSettings = {
  count: number;
  hueOffset: number;
  chroma: number;
  lightStrongL: number;
  darkLift: number;
  weakMix: number;
  autoTune: boolean;
  theme: PaletteTheme;
};

export type GeneratedColor = {
  index: number;
  hue: number;
  chroma: number;
  strongLightness: number;
  weakMix: number;
  strongColor: string;
  weakColor: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const round = (value: number, precision = 3) => Number(value.toFixed(precision));

const formatNumber = (value: number) => String(value);

export function getTunedPaletteSettings({
  count,
  chroma,
  darkLift,
  weakMix,
  autoTune,
}: Pick<PaletteSettings, 'count' | 'chroma' | 'darkLift' | 'weakMix' | 'autoTune'>) {
  if (!autoTune) {
    return {
      chroma: round(clamp(chroma, 0.07, 0.24)),
      darkLift: round(clamp(darkLift, 6, 32), 1),
      weakMix: round(clamp(weakMix, 8, 36), 1),
    };
  }

  const spreadPressure = Math.max(0, count - 8) / 8;

  return {
    chroma: round(clamp(chroma * (1 - spreadPressure * 0.14), 0.07, 0.24)),
    darkLift: round(clamp(darkLift + spreadPressure * 2, 6, 32), 1),
    weakMix: round(clamp(weakMix - spreadPressure * 3, 8, 36), 1),
  };
}

export function makeGeneratedPalette(settings: PaletteSettings): GeneratedColor[] {
  const count = Math.round(clamp(settings.count, 1, 16));
  const tuned = getTunedPaletteSettings(settings);
  const hueStep = 360 / count;

  return Array.from({ length: count }, (_, index) => {
    const hue = round((settings.hueOffset + index * hueStep) % 360, 1);
    const strongLightness =
      settings.theme === 'dark'
        ? round(clamp(settings.lightStrongL + tuned.darkLift, 55, 88), 1)
        : round(clamp(settings.lightStrongL, 40, 78), 1);
    const strongColor = `oklch(${formatNumber(strongLightness)}% ${formatNumber(tuned.chroma)} ${formatNumber(hue)})`;

    return {
      index,
      hue,
      chroma: tuned.chroma,
      strongLightness,
      weakMix: tuned.weakMix,
      strongColor,
      weakColor: `color-mix(in oklch, ${strongColor} ${formatNumber(tuned.weakMix)}%, var(--surface))`,
    };
  });
}

type HueBand = {
  start: number;
  label: string;
};

const compactHueBands = [
  { start: 0, label: 'Red' },
  { start: 35, label: 'Yellow' },
  { start: 95, label: 'Green' },
  { start: 165, label: 'Cyan' },
  { start: 205, label: 'Blue' },
  { start: 285, label: 'Purple' },
  { start: 335, label: 'Red' },
] as const satisfies readonly HueBand[];

const standardHueBands = [
  { start: 0, label: 'Red' },
  { start: 20, label: 'Orange' },
  { start: 50, label: 'Amber' },
  { start: 85, label: 'Olive' },
  { start: 115, label: 'Green' },
  { start: 145, label: 'Teal' },
  { start: 175, label: 'Cyan' },
  { start: 205, label: 'Sky' },
  { start: 235, label: 'Blue' },
  { start: 265, label: 'Indigo' },
  { start: 295, label: 'Violet' },
  { start: 325, label: 'Rose' },
] as const satisfies readonly HueBand[];

const denseHueBands = [
  { start: 0, label: 'Red' },
  { start: 18, label: 'Vermilion' },
  { start: 38, label: 'Orange' },
  { start: 58, label: 'Amber' },
  { start: 82, label: 'Olive' },
  { start: 112, label: 'Green' },
  { start: 142, label: 'Mint' },
  { start: 162, label: 'Teal' },
  { start: 185, label: 'Cyan' },
  { start: 210, label: 'Sky' },
  { start: 238, label: 'Blue' },
  { start: 265, label: 'Indigo' },
  { start: 292, label: 'Violet' },
  { start: 320, label: 'Magenta' },
  { start: 335, label: 'Rose' },
] as const satisfies readonly HueBand[];

function getHueBands(count: number): readonly HueBand[] {
  if (count <= 8) return compactHueBands;
  if (count >= 13) return denseHueBands;
  return standardHueBands;
}

export function getHueName(hue: number, count = 12): string {
  const normalized = ((hue % 360) + 360) % 360;
  const bands = getHueBands(count);
  let label = bands[0].label;

  for (const band of bands) {
    if (normalized < band.start) break;
    label = band.label;
  }

  return label;
}

export function getDisplayLabel({
  index,
  hue,
  count = 12,
  mode,
}: {
  index: number;
  hue: number;
  count?: number;
  mode: PaletteLabelMode;
}): string {
  if (mode === 'hue') return getHueName(hue, count);
  return `Color ${String(index + 1).padStart(2, '0')}`;
}
