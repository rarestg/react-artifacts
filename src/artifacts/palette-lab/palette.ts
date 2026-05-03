export type PaletteTheme = 'light' | 'dark';
export type PaletteLabelMode = 'index' | 'hue';

export type PaletteSettings = {
  count: number;
  hueOffset: number;
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

export const MAX_BASE_CHROMA = 0.22;

export function getTunedPaletteSettings({
  count,
  darkLift,
  weakMix,
  autoTune,
}: Pick<PaletteSettings, 'count' | 'darkLift' | 'weakMix' | 'autoTune'>) {
  const generatedCount = Math.round(clamp(count, 1, 16));
  const spreadPressure = Math.max(0, generatedCount - 8) / 8;
  const chroma = round(clamp(MAX_BASE_CHROMA * (1 - spreadPressure * 0.14), 0.07, MAX_BASE_CHROMA));

  if (!autoTune) {
    return {
      chroma,
      darkLift: round(clamp(darkLift, 6, 32), 1),
      weakMix: round(clamp(weakMix, 8, 36), 1),
    };
  }

  return {
    chroma,
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
    const strongColor = `oklch(${strongLightness}% ${tuned.chroma} ${hue})`;

    return {
      index,
      hue,
      chroma: tuned.chroma,
      strongLightness,
      weakMix: tuned.weakMix,
      strongColor,
      weakColor: `color-mix(in oklch, ${strongColor} ${tuned.weakMix}%, var(--surface))`,
    };
  });
}

type HueAnchor = {
  hue: number;
  label: string;
  minCount?: number;
};

const hueAnchors = [
  { hue: 0, label: 'Red' },
  { hue: 18, label: 'Vermilion', minCount: 13 },
  { hue: 35, label: 'Orange' },
  { hue: 45, label: 'Amber', minCount: 9 },
  { hue: 60, label: 'Yellow' },
  { hue: 90, label: 'Olive', minCount: 9 },
  { hue: 120, label: 'Green' },
  { hue: 132, label: 'Lime', minCount: 13 },
  { hue: 150, label: 'Mint', minCount: 9 },
  { hue: 165, label: 'Teal', minCount: 9 },
  { hue: 180, label: 'Cyan' },
  { hue: 220, label: 'Sky' },
  { hue: 245, label: 'Blue' },
  { hue: 275, label: 'Indigo' },
  { hue: 300, label: 'Purple' },
  { hue: 315, label: 'Violet', minCount: 9 },
  { hue: 322, label: 'Magenta', minCount: 13 },
  { hue: 335, label: 'Rose', minCount: 9 },
] as const satisfies readonly HueAnchor[];

const HUE_ASSIGNMENT_EPSILON = 1e-9;

function normalizeHue(hue: number) {
  const normalized = ((hue % 360) + 360) % 360;
  return Number.isFinite(normalized) ? normalized : 0;
}

function circularDistance(a: number, b: number) {
  const distance = Math.abs(normalizeHue(a) - normalizeHue(b));
  return Math.min(distance, 360 - distance);
}

function getAllowedHueAnchors(count: number, fallback: number): HueAnchor[] {
  const normalizedCount = Number.isFinite(count) ? count : fallback;
  const densityCount = Math.round(clamp(normalizedCount, 1, 16));
  return hueAnchors.filter((anchor) => densityCount >= ('minCount' in anchor ? anchor.minCount : 1));
}

function getNearestHueAnchor(hue: number, anchors: readonly HueAnchor[]) {
  let nearest = anchors[0];
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const anchor of anchors) {
    const distance = circularDistance(hue, anchor.hue);

    if (distance < nearestDistance) {
      nearest = anchor;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function getUniqueHueLabelAssignment(
  colors: ReadonlyArray<Pick<GeneratedColor, 'hue'>>,
  anchors: readonly HueAnchor[],
) {
  if (colors.length === 0) return [];

  // Hungarian assignment keeps palette-level hue labels unique while minimizing total hue distance.
  const potentialsByColor = Array.from({ length: colors.length + 1 }, () => 0);
  const potentialsByAnchor = Array.from({ length: anchors.length + 1 }, () => 0);
  const matchedColorByAnchor = Array.from({ length: anchors.length + 1 }, () => 0);
  const previousAnchor = Array.from({ length: anchors.length + 1 }, () => 0);

  for (let color = 1; color <= colors.length; color += 1) {
    matchedColorByAnchor[0] = color;
    let currentAnchor = 0;
    const minimumReducedCosts = Array.from({ length: anchors.length + 1 }, () => Number.POSITIVE_INFINITY);
    const usedAnchors = Array.from({ length: anchors.length + 1 }, () => false);

    do {
      usedAnchors[currentAnchor] = true;

      const currentColor = matchedColorByAnchor[currentAnchor];
      let delta = Number.POSITIVE_INFINITY;
      let nextAnchor = 0;

      for (let anchor = 1; anchor <= anchors.length; anchor += 1) {
        if (usedAnchors[anchor]) continue;

        const reducedCost =
          circularDistance(colors[currentColor - 1].hue, anchors[anchor - 1].hue) -
          potentialsByColor[currentColor] -
          potentialsByAnchor[anchor];

        if (reducedCost + HUE_ASSIGNMENT_EPSILON < minimumReducedCosts[anchor]) {
          minimumReducedCosts[anchor] = reducedCost;
          previousAnchor[anchor] = currentAnchor;
        }

        if (minimumReducedCosts[anchor] + HUE_ASSIGNMENT_EPSILON < delta) {
          delta = minimumReducedCosts[anchor];
          nextAnchor = anchor;
        }
      }

      for (let anchor = 0; anchor <= anchors.length; anchor += 1) {
        if (usedAnchors[anchor]) {
          potentialsByColor[matchedColorByAnchor[anchor]] += delta;
          potentialsByAnchor[anchor] -= delta;
        } else {
          minimumReducedCosts[anchor] -= delta;
        }
      }

      currentAnchor = nextAnchor;
    } while (matchedColorByAnchor[currentAnchor] !== 0);

    do {
      const nextAnchor = previousAnchor[currentAnchor];

      matchedColorByAnchor[currentAnchor] = matchedColorByAnchor[nextAnchor];
      currentAnchor = nextAnchor;
    } while (currentAnchor !== 0);
  }

  const labels = Array.from({ length: colors.length }, () => '');

  for (let anchor = 1; anchor <= anchors.length; anchor += 1) {
    const color = matchedColorByAnchor[anchor];

    if (color > 0) {
      labels[color - 1] = anchors[anchor - 1].label;
    }
  }

  return labels;
}

function getFallbackHueLabelAssignment(
  colors: ReadonlyArray<Pick<GeneratedColor, 'hue'>>,
  anchors: readonly HueAnchor[],
) {
  const usedLabels = new Set<string>();

  return colors.map((color) => {
    const candidates = [...anchors].sort(
      (left, right) => circularDistance(color.hue, left.hue) - circularDistance(color.hue, right.hue),
    );
    const chosen = candidates.find((candidate) => !usedLabels.has(candidate.label)) ?? candidates[0];

    usedLabels.add(chosen.label);
    return chosen.label;
  });
}

export function getHueName(hue: number, count = 12): string {
  return getNearestHueAnchor(hue, getAllowedHueAnchors(count, 12))?.label ?? 'Unknown';
}

export function getHueLabelsForPalette(
  colors: ReadonlyArray<Pick<GeneratedColor, 'hue'>>,
  count = colors.length,
): string[] {
  const anchors = getAllowedHueAnchors(count, colors.length);

  if (anchors.length === 0) return [];

  if (anchors.length >= colors.length) {
    return getUniqueHueLabelAssignment(colors, anchors);
  }

  return getFallbackHueLabelAssignment(colors, anchors);
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
