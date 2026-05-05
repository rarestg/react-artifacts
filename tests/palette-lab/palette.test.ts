import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getDisplayLabel,
  getHueLabelsForPalette,
  getHueName,
  getTunedPaletteSettings,
  makeGeneratedPalette,
} from '../../src/artifacts/palette-lab/palette';

test('makeGeneratedPalette keeps core categories ordered by rotation', () => {
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
    colors.map((color) => color.profilePosition),
    [220, 0, 60, 120],
  );
  assert.deepEqual(
    colors.map((color) => color.hue),
    [220, 18.3, 94.5, 142],
  );
  assert.equal(colors[0].strongColor, 'oklch(64% 0.16 220)');
});

test('makeGeneratedPalette includes a true yellow in common default palettes', () => {
  for (const count of [7, 8, 10, 12]) {
    const colors = makeGeneratedPalette({
      count,
      hueOffset: 220,
      lightStrongL: 60,
      darkLift: 18,
      weakMix: 22,
      autoTune: true,
      theme: 'light',
    });
    const labels = getHueLabelsForPalette(colors, count);
    const yellow = colors[labels.indexOf('Yellow')];

    assert.ok(yellow, `expected Yellow at count ${count}`);
    assert.ok(yellow.hue >= 92);
    assert.ok(yellow.hue <= 97);
    assert.ok(yellow.strongLightness >= 86);
    assert.ok(yellow.chroma >= 0.15);
  }
});

test('makeGeneratedPalette supports low-count core category palettes', () => {
  const colors = makeGeneratedPalette({
    count: 3,
    hueOffset: 220,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
    theme: 'light',
  });
  const labels = getHueLabelsForPalette(colors, 3);

  assert.deepEqual(labels, ['Sky', 'Red', 'Yellow']);
  assert.deepEqual(
    colors.map((color) => color.hue),
    [220, 18.3, 94.5],
  );
});

test('makeGeneratedPalette lifts lightness toward the dark-mode ceiling', () => {
  const colors = makeGeneratedPalette({
    count: 1,
    hueOffset: 220,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: false,
    theme: 'dark',
  });

  assert.equal(colors[0].strongLightness, 77.5);
  assert.equal(colors[0].strongColor, 'oklch(77.5% 0.16 220)');
});

test('makeGeneratedPalette preserves hue-aware lightness in dark mode', () => {
  const colors = makeGeneratedPalette({
    count: 8,
    hueOffset: 220,
    lightStrongL: 60,
    darkLift: 18,
    weakMix: 22,
    autoTune: true,
    theme: 'dark',
  });
  const warmAndGreenLightness = colors
    .filter((color) => [57.3, 94.5, 142].includes(color.hue))
    .map((color) => color.strongLightness);

  assert.deepEqual(warmAndGreenLightness, [79.3, 88, 78.8]);
  assert.ok(new Set(warmAndGreenLightness).size > 1);
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

test('getHueLabelsForPalette withholds labels that exceed an anchor distance limit', () => {
  const labels = getHueLabelsForPalette([{ hue: 114 }], 8);

  assert.deepEqual(labels, ['']);
  assert.equal(getDisplayLabel({ index: 0, hue: 114, count: 8, mode: 'hue' }), 'Color 01');
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
