import assert from 'node:assert/strict';
import { test } from 'node:test';

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

test('getHueName uses broad color words for compact palettes', () => {
  assert.equal(getHueName(10, 8), 'Red');
  assert.equal(getHueName(340, 8), 'Red');
  assert.equal(getHueName(70, 8), 'Yellow');
  assert.equal(getHueName(220, 8), 'Blue');
  assert.equal(getHueName(310, 8), 'Purple');
});

test('getHueName uses medium-specific color words for 9 to 12 colors', () => {
  assert.equal(getHueName(220, 12), 'Sky');
  assert.equal(getHueName(310, 12), 'Violet');
  assert.equal(getHueName(40, 12), 'Orange');
  assert.equal(getHueName(130, 12), 'Green');
});

test('getHueName uses more specific color words for dense palettes', () => {
  assert.equal(getHueName(70, 16), 'Amber');
  assert.equal(getHueName(100, 16), 'Olive');
  assert.equal(getHueName(340, 16), 'Rose');
  assert.equal(getHueName(220, 16), 'Sky');
});

test('getDisplayLabel can use stable index labels instead of color words', () => {
  assert.equal(getDisplayLabel({ index: 0, hue: 310, count: 8, mode: 'index' }), 'Color 01');
  assert.equal(getDisplayLabel({ index: 0, hue: 310, count: 8, mode: 'hue' }), 'Purple');
  assert.equal(getDisplayLabel({ index: 0, hue: 310, count: 12, mode: 'hue' }), 'Violet');
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
