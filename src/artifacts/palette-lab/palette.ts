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

export function getHueName(hue: number): string {
  const normalized = ((hue % 360) + 360) % 360;

  if (normalized < 20 || normalized >= 350) return 'Red';
  if (normalized < 50) return 'Orange';
  if (normalized < 85) return 'Amber';
  if (normalized < 115) return 'Olive';
  if (normalized < 145) return 'Green';
  if (normalized < 175) return 'Teal';
  if (normalized < 205) return 'Cyan';
  if (normalized < 235) return 'Sky';
  if (normalized < 265) return 'Blue';
  if (normalized < 295) return 'Indigo';
  if (normalized < 325) return 'Violet';
  return 'Rose';
}

export function getDisplayLabel({ index, hue, mode }: { index: number; hue: number; mode: PaletteLabelMode }): string {
  if (mode === 'hue') return getHueName(hue);
  return `Color ${String(index + 1).padStart(2, '0')}`;
}
