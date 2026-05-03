# Palette Lab Artifact Design

## Goal

Add a new Palette Lab artifact that explores functionally generated OKLCH category palettes without adding those generated colors to the shared theme tokens.

## Scope

Palette Lab is an interactive visual sandbox. It lives as its own artifact at `/artifact/palette-lab` and is stacked on top of PR #37. It does not change Prompt Library behavior, the shared category token set, or the existing Example App palette.

## Color Generation

The artifact generates evenly spaced hues from a configurable hue offset:

```ts
hue = (hueOffset + index * (360 / count)) % 360;
```

Strong colors are emitted as OKLCH strings:

```ts
oklch(lightness% chroma hue)
```

Light mode uses the configured light strong lightness. Dark mode applies a configurable lightness lift to the same generated hue and chroma. Weak selected surfaces are generated in the browser with:

```css
color-mix(in oklch, var(--generated-color) X%, var(--surface))
```

Auto tune adjusts the configured values as the count approaches 16:

- reduce chroma slightly so adjacent hues stay less harsh,
- increase dark lift slightly so dark-mode strong swatches stay vivid,
- reduce weak mix slightly so selected surfaces stay readable.

## Labeling

The throwaway demo used hardcoded labels like `Green` and `Pink`, which became wrong when the generated hue offset placed those labels on unrelated hues. The real artifact must avoid that mismatch.

Palette Lab supports two label modes:

- `Index`: stable labels such as `Color 01`, `Color 02`, and so on.
- `Hue name`: labels derived from OKLCH hue bins, such as `Blue`, `Violet`, `Orange`, or `Teal`.

`Index` is the default because it is honest about the generated nature of the palette. `Hue name` is available when the user wants semantic color names, but it is derived from the actual hue rather than from item position.

## UI

The artifact follows the existing Sharp UI style:

- full-screen artifact surface with a left control panel and a main grid,
- no landing page,
- square swatches and rectangular toggles,
- compact controls and dense information,
- light/dark theme switch inside the artifact,
- 3x4 grid by default with count adjustable from 4 to 16.

Controls:

- color count,
- hue offset,
- base chroma,
- light strong lightness,
- dark lift,
- weak mix,
- label mode,
- auto tune on/off,
- toggle all.

Each generated toggle shows:

- label,
- strong color square,
- strong and weak preview bars,
- hue/lightness/mix metadata,
- rendered text contrast for the selected surface.

## Architecture

Keep palette math in a small pure module:

- `src/artifacts/palette-lab/palette.ts` exports generation, tuning, and hue-label helpers.
- `src/artifacts/palette-lab/index.tsx` owns UI state and rendering.
- `tests/palette-lab/palette.test.ts` covers the pure color generation and label behavior.

Browser-only contrast measurement stays in the component because it depends on rendered CSS colors, including `oklch()` and `color-mix()`.

## Verification

Automated tests cover:

- generated hue spacing and wraparound,
- auto tuning behavior by count,
- hue-name labels derived from actual hues,
- index labels independent of hue.

Manual/browser verification covers:

- the artifact renders at `/artifact/palette-lab`,
- controls update the grid immediately,
- light/dark theme changes generated colors and selected surfaces,
- hue labels match the displayed hue metadata,
- no text overlaps or wraps awkwardly across desktop/mobile widths,
- console has no runtime errors.
