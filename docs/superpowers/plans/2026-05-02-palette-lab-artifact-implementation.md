# Palette Lab Artifact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new Palette Lab artifact that visualizes functionally generated OKLCH palettes.

**Architecture:** Put deterministic palette math in `src/artifacts/palette-lab/palette.ts` and render the interactive artifact in `src/artifacts/palette-lab/index.tsx`. The artifact uses CSS OKLCH and `color-mix()` for visual output, while tests cover the pure generation logic.

**Tech Stack:** React, TypeScript, Node test runner, shared `ArtifactThemeRoot`, existing Vite artifact discovery.

---

## File Structure

- Create `src/artifacts/palette-lab/palette.ts`: pure generation helpers, label helpers, auto tuning.
- Create `src/artifacts/palette-lab/index.tsx`: Palette Lab UI.
- Create `src/artifacts/palette-lab/meta.ts`: artifact metadata.
- Create `tests/palette-lab/palette.test.ts`: pure behavior tests.

## Task 1: Palette Math

**Files:**
- Create: `src/artifacts/palette-lab/palette.ts`
- Test: `tests/palette-lab/palette.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/palette-lab/palette.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getDisplayLabel,
  getHueName,
  getTunedPaletteSettings,
  makeGeneratedPalette,
} from '../../src/artifacts/palette-lab/palette';

test('makeGeneratedPalette spaces hues evenly from the configured offset', () => {
  const colors = makeGeneratedPalette({
    count: 4,
    hueOffset: 220,
    chroma: 0.155,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: false,
    theme: 'light',
  });

  assert.deepEqual(
    colors.map((color) => color.hue),
    [220, 310, 40, 130],
  );
  assert.equal(colors[0].strongColor, 'oklch(60% 0.155 220)');
});

test('makeGeneratedPalette lifts lightness in dark mode', () => {
  const colors = makeGeneratedPalette({
    count: 1,
    hueOffset: 220,
    chroma: 0.155,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: false,
    theme: 'dark',
  });

  assert.equal(colors[0].strongLightness, 78);
  assert.equal(colors[0].strongColor, 'oklch(78% 0.155 220)');
});

test('getHueName derives color words from actual hue bins', () => {
  assert.equal(getHueName(220), 'Sky');
  assert.equal(getHueName(310), 'Violet');
  assert.equal(getHueName(40), 'Orange');
  assert.equal(getHueName(130), 'Green');
});

test('getDisplayLabel can use stable index labels instead of color words', () => {
  assert.equal(getDisplayLabel({ index: 0, hue: 310, mode: 'index' }), 'Color 01');
  assert.equal(getDisplayLabel({ index: 0, hue: 310, mode: 'hue' }), 'Violet');
});

test('getTunedPaletteSettings adjusts generation as color count rises', () => {
  const low = getTunedPaletteSettings({
    count: 4,
    chroma: 0.155,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
  });
  const high = getTunedPaletteSettings({
    count: 16,
    chroma: 0.155,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
  });

  assert.equal(low.chroma, 0.155);
  assert.equal(low.darkLift, 18);
  assert.equal(low.weakMix, 22);
  assert.ok(high.chroma < low.chroma);
  assert.ok(high.darkLift > low.darkLift);
  assert.ok(high.weakMix < low.weakMix);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
npm test -- tests/palette-lab/palette.test.ts
```

Expected: fail because `src/artifacts/palette-lab/palette.ts` does not exist.

- [ ] **Step 3: Implement palette helpers**

Create `src/artifacts/palette-lab/palette.ts` with:

```ts
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

export function getDisplayLabel({
  index,
  hue,
  mode,
}: {
  index: number;
  hue: number;
  mode: PaletteLabelMode;
}): string {
  if (mode === 'hue') return getHueName(hue);
  return `Color ${String(index + 1).padStart(2, '0')}`;
}
```

- [ ] **Step 4: Run tests and commit**

Run:

```bash
npm test -- tests/palette-lab/palette.test.ts
```

Expected: all palette tests pass.

Commit:

```bash
git add src/artifacts/palette-lab/palette.ts tests/palette-lab/palette.test.ts
git commit -m "Add palette lab generation helpers"
```

## Task 2: Artifact UI

**Files:**
- Create: `src/artifacts/palette-lab/index.tsx`
- Create: `src/artifacts/palette-lab/meta.ts`

- [ ] **Step 1: Create artifact metadata**

Create `src/artifacts/palette-lab/meta.ts`:

```ts
const meta = {
  name: 'Palette Lab',
  subtitle: 'Generated OKLCH color palette playground',
  kind: 'app',
} as const;

export default meta;
```

- [ ] **Step 2: Create the React artifact**

Create `src/artifacts/palette-lab/index.tsx` with component state for theme, count, hue offset, chroma, light strong lightness, dark lift, weak mix, auto tune, label mode, and selected colors. Use `ArtifactThemeRoot`, `makeGeneratedPalette`, and `getDisplayLabel`.

The selected toggle style should set CSS variables:

```ts
const style = {
  '--palette-color': color.strongColor,
  '--palette-color-weak': color.weakColor,
} as CSSProperties;
```

Each toggle should render a square strong swatch, strong and weak bars, hue/lightness/mix metadata, and a contrast label.

- [ ] **Step 3: Run a browser smoke test**

Run Vite and open:

```bash
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS="$(hostname).exe.xyz" npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Then verify with Playwright:

- `/artifact/palette-lab` renders,
- 12 toggles render by default,
- switching label mode to hue changes labels based on hue bins,
- dark mode updates generated colors,
- no console errors.

- [ ] **Step 4: Run full check and commit**

Run:

```bash
npm run check
```

Expected: lint, typecheck, knip, and tests pass.

Commit:

```bash
git add src/artifacts/palette-lab/index.tsx src/artifacts/palette-lab/meta.ts
git commit -m "Add palette lab artifact"
```

## Task 3: Final Verification and Stacked PR

**Files:**
- No code changes expected.

- [ ] **Step 1: Run final verification**

Run:

```bash
npm run check
```

Run browser verification again for `/artifact/palette-lab`.

- [ ] **Step 2: Push stacked branch**

Push:

```bash
git push -u origin palette-lab-artifact
```

- [ ] **Step 3: Create stacked PR**

Create a PR with base `prompt-library-tag-colors`:

```bash
gh pr create --base prompt-library-tag-colors --head palette-lab-artifact --title "Add Palette Lab artifact"
```
