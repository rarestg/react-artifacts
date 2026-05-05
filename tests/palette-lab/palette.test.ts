import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getDisplayLabel,
  getHueLabelsForPalette,
  getHueName,
  getTunedPaletteSettings,
  makeGeneratedPalette,
} from '../../src/artifacts/palette-lab/palette';

test('makeGeneratedPalette maps rotation through the hue-aware profile', () => {
  const colors = makeGeneratedPalette({
    count: 4,
    hueOffset: 220,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: false,
    theme: 'light',
  });

  assert.deepEqual(
    colors.map((color) => color.hue),
    [220, 314.4, 65.7, 148.7],
  );
  assert.equal(colors[0].strongColor, 'oklch(64% 0.16 220)');
});

test('makeGeneratedPalette includes a true yellow in the default 7 color palette', () => {
  const colors = makeGeneratedPalette({
    count: 7,
    hueOffset: 220,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
    theme: 'light',
  });
  const labels = getHueLabelsForPalette(colors, 7);
  const yellow = colors[labels.indexOf('Yellow')];

  assert.ok(yellow);
  assert.ok(yellow.hue >= 95);
  assert.ok(yellow.hue <= 105);
  assert.ok(yellow.strongLightness >= 74);
  assert.ok(yellow.chroma >= 0.14);
});

test('makeGeneratedPalette lifts lightness in dark mode', () => {
  const colors = makeGeneratedPalette({
    count: 1,
    hueOffset: 220,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: false,
    theme: 'dark',
  });

  assert.equal(colors[0].strongLightness, 82);
  assert.equal(colors[0].strongColor, 'oklch(82% 0.16 220)');
});

test('makeGeneratedPalette scales profile chroma by the count-aware maximum even when auto tune is off', () => {
  const colors = makeGeneratedPalette({
    count: 16,
    hueOffset: 220,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: false,
    theme: 'light',
  });

  assert.equal(colors[0].chroma, 0.137);
  assert.equal(colors[0].strongColor, 'oklch(64% 0.137 220)');
});

test('getHueName uses broad color words for compact palettes', () => {
  assert.equal(getHueName(10, 8), 'Red');
  assert.equal(getHueName(340, 8), 'Red');
  assert.equal(getHueName(70, 8), 'Orange');
  assert.equal(getHueName(100, 8), 'Yellow');
  assert.equal(getHueName(220, 8), 'Sky');
  assert.equal(getHueName(310, 8), 'Purple');
});

test('getHueName uses medium-specific color words for 9 to 12 colors', () => {
  assert.equal(getHueName(164, 9), 'Mint');
  assert.equal(getHueName(220, 12), 'Sky');
  assert.equal(getHueName(318, 12), 'Violet');
  assert.equal(getHueName(40, 12), 'Orange');
  assert.equal(getHueName(142, 12), 'Green');
  assert.equal(getHueName(347, 12), 'Rose');
  assert.equal(getHueName(348, 12), 'Rose');
  assert.equal(getHueName(15, 12), 'Red');
});

test('getHueName falls back to its default density for non-finite counts', () => {
  assert.equal(getHueName(310, Number.NaN), getHueName(310));
});

test('getHueName uses more specific color words for dense palettes', () => {
  assert.equal(getHueName(164, 13), 'Mint');
  assert.equal(getHueName(70, 16), 'Amber');
  assert.equal(getHueName(100, 16), 'Yellow');
  assert.equal(getHueName(340, 16), 'Magenta');
  assert.equal(getHueName(347, 16), 'Rose');
  assert.equal(getHueName(348, 16), 'Rose');
  assert.equal(getHueName(15, 16), 'Red');
  assert.equal(getHueName(220, 16), 'Sky');
});

test('getHueLabelsForPalette uses unique hue labels for dense generated palettes', () => {
  const colors = makeGeneratedPalette({
    count: 16,
    hueOffset: 220,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
    theme: 'light',
  });

  const labels = getHueLabelsForPalette(colors);

  assert.equal(labels.length, colors.length);
  assert.equal(new Set(labels).size, colors.length);
  assert.ok(labels.includes('Yellow'));
  assert.ok(labels.includes('Blue'));
  assert.ok(labels.includes('Cyan'));
});

test('getHueLabelsForPalette minimizes total hue distance instead of assigning greedily', () => {
  assert.deepEqual(getHueLabelsForPalette([{ hue: 70.5 }, { hue: 70 }], 12), ['Amber', 'Orange']);
});

test('getHueLabelsForPalette keeps dense-only hue words out of compact palettes', () => {
  const colors = makeGeneratedPalette({
    count: 8,
    hueOffset: 18,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
    theme: 'light',
  });

  const labels = getHueLabelsForPalette(colors);

  assert.ok(!labels.includes('Vermilion'));
  assert.ok(!labels.includes('Magenta'));
  assert.ok(!labels.includes('Lime'));
});

test('getHueLabelsForPalette returns labels in input order', () => {
  const colors = makeGeneratedPalette({
    count: 16,
    hueOffset: 220,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
    theme: 'light',
  });

  const labels = getHueLabelsForPalette(colors);
  const reversedLabels = getHueLabelsForPalette([...colors].reverse());

  assert.deepEqual(reversedLabels, [...labels].reverse());
});

test('getHueLabelsForPalette falls back to palette length for non-finite counts', () => {
  const colors = makeGeneratedPalette({
    count: 16,
    hueOffset: 220,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
    theme: 'light',
  });

  assert.deepEqual(getHueLabelsForPalette(colors, Number.NaN), getHueLabelsForPalette(colors));
});

test('getDisplayLabel can use stable index labels instead of color words', () => {
  assert.equal(getDisplayLabel({ index: 0, hue: 318, count: 8, mode: 'index' }), 'Color 01');
  assert.equal(getDisplayLabel({ index: 0, hue: 318, count: 8, mode: 'hue' }), 'Purple');
  assert.equal(getDisplayLabel({ index: 0, hue: 318, count: 12, mode: 'hue' }), 'Violet');
});

test('getTunedPaletteSettings adjusts generation as color count rises', () => {
  const low = getTunedPaletteSettings({
    count: 4,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
  });
  const high = getTunedPaletteSettings({
    count: 16,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
  });

  assert.equal(low.chroma, 0.22);
  assert.equal(low.darkLift, 18);
  assert.equal(low.weakMix, 22);
  assert.ok(high.chroma < low.chroma);
  assert.ok(high.darkLift > low.darkLift);
  assert.ok(high.weakMix < low.weakMix);
});

test('getTunedPaletteSettings caps auto-tuning pressure at the generated color count', () => {
  const capped = getTunedPaletteSettings({
    count: 16,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
  });
  const oversized = getTunedPaletteSettings({
    count: 99,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
  });

  assert.deepEqual(oversized, capped);
});
