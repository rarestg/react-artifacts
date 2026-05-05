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
  profilePosition: number;
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
export const DARK_LIGHTNESS_CEILING = 88;
export const DARK_LIFT_SCALE = 32;
const DEFAULT_LIGHT_STRONG_L = 60;

type PaletteProfileAnchor = {
  position: number;
  hue: number;
  label: string;
  strongLightness: number;
  strongChroma: number;
  minCount?: number;
  coreRank?: number;
  labelMaxDistance?: number;
};

const paletteProfileAnchors: readonly PaletteProfileAnchor[] = [
  { position: 0, hue: 18.3, label: 'Red', strongLightness: 62, strongChroma: 0.2, coreRank: 2 },
  { position: 18, hue: 32, label: 'Vermilion', strongLightness: 63, strongChroma: 0.21, minCount: 13 },
  { position: 35, hue: 57.3, label: 'Orange', strongLightness: 68, strongChroma: 0.18, coreRank: 6 },
  { position: 45, hue: 74, label: 'Amber', strongLightness: 72, strongChroma: 0.18, minCount: 9 },
  {
    position: 60,
    hue: 94.5,
    label: 'Yellow',
    strongLightness: 88,
    strongChroma: 0.181,
    coreRank: 3,
    labelMaxDistance: 14,
  },
  { position: 90, hue: 118, label: 'Olive', strongLightness: 70, strongChroma: 0.16, minCount: 9 },
  { position: 120, hue: 142, label: 'Green', strongLightness: 67, strongChroma: 0.18, coreRank: 4 },
  { position: 132, hue: 150, label: 'Lime', strongLightness: 70, strongChroma: 0.17, minCount: 13 },
  { position: 150, hue: 164.2, label: 'Mint', strongLightness: 68, strongChroma: 0.18, minCount: 9 },
  { position: 165, hue: 178, label: 'Teal', strongLightness: 66, strongChroma: 0.16, minCount: 9 },
  { position: 180, hue: 190, label: 'Cyan', strongLightness: 66, strongChroma: 0.15, coreRank: 7 },
  { position: 220, hue: 220, label: 'Sky', strongLightness: 64, strongChroma: 0.16, coreRank: 1 },
  { position: 245, hue: 254.1, label: 'Blue', strongLightness: 64, strongChroma: 0.16 },
  { position: 275, hue: 274, label: 'Indigo', strongLightness: 63, strongChroma: 0.15, coreRank: 8 },
  { position: 300, hue: 300, label: 'Purple', strongLightness: 64, strongChroma: 0.16, coreRank: 5 },
  { position: 315, hue: 321.6, label: 'Violet', strongLightness: 64, strongChroma: 0.16, minCount: 9 },
  { position: 322, hue: 332, label: 'Magenta', strongLightness: 64, strongChroma: 0.18, minCount: 13 },
  { position: 335, hue: 350, label: 'Rose', strongLightness: 64, strongChroma: 0.19, minCount: 9 },
] as const;

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

function normalizeHue(hue: number) {
  const normalized = ((hue % 360) + 360) % 360;
  return Number.isFinite(normalized) ? normalized : 0;
}

function circularDistance(a: number, b: number) {
  const distance = Math.abs(normalizeHue(a) - normalizeHue(b));
  return Math.min(distance, 360 - distance);
}

function interpolateHue(start: number, end: number, amount: number) {
  const delta = ((normalizeHue(end) - normalizeHue(start) + 540) % 360) - 180;
  return normalizeHue(start + delta * amount);
}

function getRotatedPosition(position: number, rotation: number) {
  return normalizeHue(position - rotation);
}

function sortByRotatedPosition(
  left: Pick<PaletteProfileAnchor, 'position'>,
  right: Pick<PaletteProfileAnchor, 'position'>,
  rotation: number,
) {
  return getRotatedPosition(left.position, rotation) - getRotatedPosition(right.position, rotation);
}

function getProfileAtPosition(position: number) {
  const normalizedPosition = normalizeHue(position);
  const anchors = paletteProfileAnchors;

  for (let index = 0; index < anchors.length; index += 1) {
    const start = anchors[index];
    const end = anchors[(index + 1) % anchors.length];
    const endPosition = end.position <= start.position ? end.position + 360 : end.position;
    const adjustedPosition =
      normalizedPosition < start.position && endPosition >= 360 ? normalizedPosition + 360 : normalizedPosition;

    if (adjustedPosition < start.position || adjustedPosition > endPosition) continue;

    const amount =
      endPosition === start.position ? 0 : (adjustedPosition - start.position) / (endPosition - start.position);

    return {
      hue: interpolateHue(start.hue, end.hue, amount),
      strongLightness: start.strongLightness + (end.strongLightness - start.strongLightness) * amount,
      strongChroma: start.strongChroma + (end.strongChroma - start.strongChroma) * amount,
    };
  }

  const fallback = anchors[0];
  return {
    hue: fallback.hue,
    strongLightness: fallback.strongLightness,
    strongChroma: fallback.strongChroma,
  };
}

function getSelectedProfilePositions(count: number, hueOffset: number) {
  const normalizedCount = Math.round(clamp(count, 1, 16));
  const rotation = normalizeHue(hueOffset);
  const hueStep = 360 / normalizedCount;
  const candidatePositions = Array.from({ length: normalizedCount }, (_, index) =>
    normalizeHue(rotation + index * hueStep),
  );
  const selected: Array<{ position: number }> = paletteProfileAnchors
    .filter((anchor) => anchor.coreRank !== undefined && anchor.coreRank <= normalizedCount)
    .sort((left, right) => (left.coreRank ?? 0) - (right.coreRank ?? 0))
    .map((anchor) => ({ position: anchor.position }));
  const minCandidateDistance = hueStep / 2;
  const hasPosition = (position: number) =>
    selected.some((selectedPosition) => circularDistance(position, selectedPosition.position) < 1e-6);

  for (const position of candidatePositions) {
    if (selected.length >= normalizedCount) break;
    if (hasPosition(position)) continue;
    if (
      selected.some((selectedPosition) => circularDistance(position, selectedPosition.position) < minCandidateDistance)
    ) {
      continue;
    }
    selected.push({ position });
  }

  for (const position of candidatePositions) {
    if (selected.length >= normalizedCount) break;
    if (hasPosition(position)) continue;
    selected.push({ position });
  }

  return selected.sort((left, right) => sortByRotatedPosition(left, right, rotation));
}

export function getDarkLiftFraction(darkLift: number) {
  return clamp(darkLift, 6, DARK_LIFT_SCALE) / DARK_LIFT_SCALE;
}

export function makeGeneratedPalette(settings: PaletteSettings): GeneratedColor[] {
  const count = Math.round(clamp(settings.count, 1, 16));
  const tuned = getTunedPaletteSettings(settings);
  const chromaScale = tuned.chroma / MAX_BASE_CHROMA;
  const lightnessBias = settings.lightStrongL - DEFAULT_LIGHT_STRONG_L;
  const darkLiftFraction = getDarkLiftFraction(tuned.darkLift);
  const selectedPositions = getSelectedProfilePositions(count, settings.hueOffset);

  return selectedPositions.map(({ position }, index) => {
    const profile = getProfileAtPosition(position);
    const hue = round(profile.hue, 1);
    const baseLightness = clamp(profile.strongLightness + lightnessBias, 40, DARK_LIGHTNESS_CEILING);
    const strongLightness =
      settings.theme === 'dark'
        ? round(baseLightness + (DARK_LIGHTNESS_CEILING - baseLightness) * darkLiftFraction, 1)
        : round(baseLightness, 1);
    const chroma = round(clamp(profile.strongChroma * chromaScale, 0.05, MAX_BASE_CHROMA));
    const strongColor = `oklch(${strongLightness}% ${chroma} ${hue})`;

    return {
      index,
      profilePosition: round(normalizeHue(position), 1),
      hue,
      chroma,
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
  labelMaxDistance?: number;
};

const hueAnchors: HueAnchor[] = paletteProfileAnchors.map((anchor) =>
  'minCount' in anchor
    ? {
        hue: anchor.hue,
        label: anchor.label,
        minCount: anchor.minCount,
        labelMaxDistance: anchor.labelMaxDistance,
      }
    : { hue: anchor.hue, label: anchor.label, labelMaxDistance: anchor.labelMaxDistance },
);

const HUE_ASSIGNMENT_EPSILON = 1e-9;
const HUE_ASSIGNMENT_TIE_BREAKER = 1e-8;

function getAllowedHueAnchors(count: number, fallback: number): HueAnchor[] {
  const normalizedCount = Number.isFinite(count) ? count : fallback;
  const densityCount = Math.round(clamp(normalizedCount, 1, 16));
  return hueAnchors.filter((anchor) => densityCount >= (anchor.minCount ?? 1));
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

function getHueAnchorLabel(hue: number, anchor: HueAnchor) {
  if (anchor.labelMaxDistance !== undefined && circularDistance(hue, anchor.hue) > anchor.labelMaxDistance) {
    return '';
  }

  return anchor.label;
}

function getHueAssignmentCost(hue: number, anchor: HueAnchor) {
  const distance = circularDistance(hue, anchor.hue);
  return distance + distance ** 2 * HUE_ASSIGNMENT_TIE_BREAKER;
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
          getHueAssignmentCost(colors[currentColor - 1].hue, anchors[anchor - 1]) -
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
      labels[color - 1] = getHueAnchorLabel(colors[color - 1].hue, anchors[anchor - 1]);
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
    return getHueAnchorLabel(color.hue, chosen);
  });
}

export function getHueName(hue: number, count = 12): string {
  const anchor = getNearestHueAnchor(hue, getAllowedHueAnchors(count, 12));
  return anchor ? getHueAnchorLabel(hue, anchor) : 'Unknown';
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
  const indexLabel = `Color ${String(index + 1).padStart(2, '0')}`;
  if (mode === 'hue') return getHueName(hue, count) || indexLabel;
  return indexLabel;
}
