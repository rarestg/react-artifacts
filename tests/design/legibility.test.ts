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

const themeBlock = (selector: string, source = css) => {
  const start = source.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `missing theme block ${selector}`);
  return source.slice(start, source.indexOf('}', start));
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

const tokens = (block: string) =>
  Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2]]));

// Resolves var() and color-mix() the way the browser does, down to a hex color.
const resolve = (theme: Record<string, string>, name: string): string => {
  const value = theme[name];
  assert.ok(value, `missing --${name}`);
  const alias = value.match(/^var\(--([\w-]+)\)$/);
  if (alias) return resolve(theme, alias[1]);
  const mixed = value.match(/^color-mix\(in srgb, var\(--([\w-]+)\) (\d+)%, var\(--([\w-]+)\) (\d+)%\)$/);
  if (!mixed) return value;
  const [a, b] = [resolve(theme, mixed[1]), resolve(theme, mixed[3])];
  const channels = [1, 3, 5].map((start) => {
    const channel = (hex: string) => Number.parseInt(hex.slice(start, start + 2), 16);
    return Math.round((channel(a) * Number(mixed[2]) + channel(b) * Number(mixed[4])) / 100);
  });
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
};

const derivedCss = css.slice(css.indexOf('@supports'));
const baseTheme = (selector: string) => ({
  ...tokens(themeBlock(selector)),
  ...tokens(themeBlock(selector, derivedCss)),
});

const palettes = readdirSync('src/artifacts', { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.css'))
  .flatMap((file) =>
    [
      ...readFileSync(join('src/artifacts', file), 'utf8').matchAll(
        /^(\.dark )?(\S+\[data-theme="\w+"\]) \{([^}]*)\}/gm,
      ),
    ].map((match) => ({
      name: `${file} ${match[1] ?? ''}${match[2]}`,
      base: match[1] ? '.dark .artifact-theme' : '.artifact-theme',
      own: tokens(match[3]),
    })),
  );

const assertReadable = (theme: Record<string, string>) => {
  const check = (text: string, surface: string) => {
    const ratio = contrast(resolve(theme, text), resolve(theme, surface));
    assert.ok(ratio >= MIN_TEXT_CONTRAST, `--${text} on --${surface} is ${ratio.toFixed(2)}:1`);
  };
  for (const text of ['text', 'text-muted', 'text-subtle', 'accent-text']) {
    for (const surface of ['surface', 'surface-muted', 'surface-strong', 'surface-pressed']) check(text, surface);
  }
  for (const role of ['accent', 'success', 'warning', 'danger', 'info']) check(`${role}-text`, `${role}-weak`);
};

for (const [mode, selector] of [
  ['light', '.artifact-theme'],
  ['dark', '.dark .artifact-theme'],
]) {
  test(`${mode} base theme text reaches 4.5:1 on computed surfaces`, () => {
    assertReadable(baseTheme(selector));
  });
}

test('every palette override stays readable and sets its own text and accent tokens', () => {
  assert.ok(palettes.length > 0, 'found no palette overrides to check');
  for (const { name, base, own } of palettes) {
    for (const token of ['text-muted', 'text-subtle', 'accent-text', 'accent-weak']) {
      assert.ok(token in own, `${name} must set --${token}`);
    }
    assert.doesNotThrow(() => assertReadable({ ...baseTheme(base), ...own }), name);
  }
});
