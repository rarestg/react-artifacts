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
