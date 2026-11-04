import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const MIN_TEXT_PX = 11;
const MIN_TEXT_CONTRAST = 4.5;

test('no explicit text size under src is below the 11px floor', () => {
  const files = readdirSync('src', { recursive: true, encoding: 'utf8' }).filter((file) =>
    /\.(ts|tsx|css)$/.test(file),
  );
  const tooSmall = files.flatMap((file) =>
    [...readFileSync(join('src', file), 'utf8').matchAll(/text-\[(\d*\.?\d+)px\]/g)]
      .filter((match) => Number(match[1]) < MIN_TEXT_PX)
      .map((match) => `${file}: ${match[0]}`),
  );

  assert.deepEqual(tooSmall, []);
});

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};

const css = readFileSync('src/theme/artifact-theme.css', 'utf8');

const themeBlock = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `missing theme block ${selector}`);
  return css.slice(start, css.indexOf('\n}', start));
};

const hexToken = (block: string, name: string) => {
  const hex = block.match(new RegExp(`--${name}: (#[0-9a-f]{6});`))?.[1];
  assert.ok(hex, `missing literal hex for --${name}`);
  return hex;
};

for (const [mode, selector] of [
  ['light', '.artifact-theme'],
  ['dark', '.dark .artifact-theme'],
]) {
  test(`${mode} text tokens reach 4.5:1 on every literal neutral surface`, () => {
    const block = themeBlock(selector);
    for (const text of ['text', 'text-muted', 'text-subtle']) {
      for (const surface of ['surface', 'surface-muted', 'surface-strong', 'surface-pressed']) {
        const ratio = contrast(hexToken(block, text), hexToken(block, surface));
        assert.ok(ratio >= MIN_TEXT_CONTRAST, `--${text} on --${surface} is ${ratio.toFixed(2)}:1`);
      }
    }
  });
}
