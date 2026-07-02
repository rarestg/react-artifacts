# React Artifacts

A local viewer for developing and refining React artifacts. Drop a folder into `src/artifacts/` with an `index.tsx` component and it appears in the sidebar automatically — no registry or config needed.

## Stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **Biome** for linting, formatting, and import organization
- **lucide-react** for icons

## Repo Map

- `src/App.tsx` — viewer shell, sidebar controls, artifact selection, and device preview.
- `src/artifacts.ts` — artifact discovery through `import.meta.glob`.
- `src/artifacts/` — self-contained artifact folders.
- `src/components/` — shared UI primitives.
- `src/ui/` — shared skin recipes, portal wrappers, and layout primitives.
- `src/lib/` — shared non-visual helpers and hooks.
- `src/theme/` — shared artifact theme tokens.
- `design/` — design philosophy, artifact design guidance, and UI implementation notes.
- `worker/` — Cloudflare Worker API entry.
- `tests/` — Node test runner tests.

## Sources of Truth

- Design philosophy: `design/SHARP_MINIMAL_DESIGN.md`
- Practical artifact UI guidance: `design/ARTIFACT_DESIGN_GUIDE.md`
- UI/layout decisions and recurring gotchas: `design/UI_IMPLEMENTATION_NOTES.md`
- Scripts and local validation commands: `package.json`
- CI behavior: `.github/workflows/ci.yml`
- Deployment and Worker runtime config: `wrangler.jsonc`, `worker/index.ts`

## Invariants

- Artifacts export a React component from `index.tsx`; they do not mount to the DOM.
- `ArtifactThemeRoot` is the default artifact root; any artifact using tokens or shared token primitives must use it.
- Device preview renders inside a fixed-size container; it is not a real browser viewport.
- Worker binding or `wrangler.jsonc` changes require `npm run generate-types`.
- Let Biome handle formatting and import organization instead of hand-formatting large edits.

## Getting Started

```bash
npm install
npm run dev
```

## Adding an Artifact

Create a folder in `src/artifacts/` with an `index.tsx` default export:

```tsx
// src/artifacts/my-artifact/index.tsx
export default function MyArtifact() {
  return <div>Hello</div>;
}
```

The viewer picks it up via `import.meta.glob` — just refresh the page.

## Artifact "Apps" (multi-file)

Artifacts can be full apps with their own folders (components, hooks, styles, etc.). The only rule is that
`index.tsx` must export a React component (not mount to the DOM).

**Convert a typical Vite entry to an artifact entry:**

Before (DOM mounting):

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

After (artifact entry):

```tsx
// src/artifacts/my-artifact/index.tsx
export { default } from './App';
```

Notes:
- Per-artifact `index.html` files are not used by this shell.
- If you need titles/body classes, set them inside the component with `useEffect`.

Example folder layout:

```
src/artifacts/my-artifact/
  index.tsx
  meta.ts
  App.tsx
  components/
    Header.tsx
    StatCard.tsx
  styles.css
```

Optional metadata (`meta.ts`) lets the shell display friendly names and labels:

```ts
const meta = {
  name: 'My Artifact',
  subtitle: 'Short description',
  kind: 'single', // or 'app'
  model: 'model-name', // optional
  version: 'model-version', // optional
} as const;

export default meta;
```

## Theme Toggle (Light / System / Dark)

The sidebar includes a theme toggle that sets the page theme by adding a `dark` class
to the `<html>` element and syncing to localStorage (`artifact-theme`).

Notes:
- `system` respects `prefers-color-scheme`.
- An inline script in `index.html` applies the saved/system theme early to avoid FOUC.

## Device Preview & Responsive Styling

The sidebar includes device preview controls (iPhone/iPad + portrait/landscape) that render the artifact inside a
fixed-size container. This is **not** a real viewport, so Tailwind `sm:`/`md:`/`lg:` breakpoints will still follow the
browser window size, not the preview size.

**Recommendation:** for artifacts meant to match the preview, use container-driven responsiveness (container queries or
container-width logic) instead of viewport breakpoints. Reserve `sm:`/`lg:` for full-page prototypes that are meant to
track the actual browser viewport (or when using DevTools device emulation).

## Shared Components And Helpers

Tokenized artifact primitives live in `src/components/` and must render under `ArtifactThemeRoot`. This includes common
artifact UI such as `Button`, `Input`, `Tag`, `Panel`, `Checkbox`, `FilterCheckbox`, `Toggle`, `SegmentedControl`,
`ListboxSelect`, `CopyButton`, `CopyableLabel`, `StatusTag`, `ArtifactDialog`, and `panelHeaderClasses` for dense tool
panel headers. Shared layout primitives live in `src/ui/layout.tsx`: `Stack` (vertical stack with semantic gap tiers)
and `Grid` (the responsive auto-fit artifact grid); see UI note 009.

Not every `src/components/` export is an artifact primitive. Shell UI in `src/App.tsx` is not artifact UI; do not pull
artifact-token components into shell chrome unless the subtree is intentionally wrapped. Prefer headless hooks and
shell-specific classes in shell chrome.

Shared non-visual helpers live in `src/lib/`: `mergeClassNames`, `useCopyToClipboard`, `useLocalStorageState`,
`useRootDarkMode`, `getPlatformShortcutHint`, and `assignRef`.

Use shared primitives when behavior and visual contract match. Keep artifact-local components local when semantics are
domain-specific or experimental.

## UI Implementation Notes (Living Guide)

Before making UI/layout changes, read `design/SHARP_MINIMAL_DESIGN.md` and `design/ARTIFACT_DESIGN_GUIDE.md`.
Then skim the index in `design/UI_IMPLEMENTATION_NOTES.md` and read any relevant entries. Each index row includes a line
range so you can jump directly with `sed -n 'START,ENDp' design/UI_IMPLEMENTATION_NOTES.md`.

Add a new implementation note only when a recurring decision or gotcha emerges, such as layout behavior,
responsiveness, Tailwind patterns, or shared component usage that took back-and-forth to settle.

To add a new entry:
1) Draft the entry body as raw markdown in a temporary `.md` file (no top-level `##` heading).
2) Run:

```bash
python3 design/update_ui_implementation_notes.py \
  --entry-md /path/to/entry.md \
  --title "Short Title" \
  --when-read "When should someone read this?" \
  --keywords "comma, separated, keywords"
```

## Artifact URLs

The selected artifact is reflected in the URL as a query param, so reloads and sharing keep context:

```
/?artifact=sharp2
```

## Standalone Artifact View

You can open an artifact as a full-page view (no shell UI) at:

```
/artifact/<id>
```

Notes:
- Standalone view always follows the OS/browser theme (`prefers-color-scheme`) and ignores any saved shell theme.
- The theme is applied on load and will not live-update if the OS theme changes while the page stays open.

## Cloudflare Workers Deployment

This app is deployed as a Cloudflare Worker with static assets + SPA routing.
Configuration lives in `wrangler.jsonc`, and the Worker entry is `worker/index.ts` (handles `/api/*`).

TypeScript for the Worker uses Wrangler-generated types:
- Run `npm run generate-types` after changing `wrangler.jsonc` or bindings.
- The generated file is `worker-configuration.d.ts`.
- `npm run typecheck` runs `wrangler types --check` and will not write types.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run generate-types` | Generate Worker runtime types (Wrangler) |
| `npm run format` | Run Biome with auto-fix (format + lint + imports) |
| `npm run lint` | Run Biome (format + lint + imports check) |
| `npm run lint:fix` | Run Biome and auto-fix |
| `npm run knip` | Detect unused files, exports, and dependencies |
| `npm run test` | Run Node test runner |
| `npm run typecheck` | Type-check app + worker |
| `npm run typecheck:worker` | Type-check Worker code |
| `npm run preview` | Preview production build |
| `npm run deploy` | Deploy Worker |

## Pre-PR Checks

Before opening a PR, run the combined check:

```bash
npm run check
```

Equivalent individual commands:

```bash
npm run lint
npm run typecheck
npm run knip
npm run test
```

## Git Hooks

This repo uses Lefthook to keep commits clean:

- **pre-commit:** runs Biome on staged files (auto-fixes and re-stages).
- **pre-push:** runs `lint`, `typecheck`, `knip`, and `test`.

Hooks are installed automatically on `npm install` via the `prepare` script. If needed, run:

```bash
npx lefthook install
```

You can run hooks manually without committing/pushing:

```bash
npx lefthook run pre-commit
npx lefthook run pre-push
```

Notes:
- `pre-commit` operates on staged files, so run `git add` first.
- `pre-push` uses the push file list; when running manually, add `--force` (or `--all-files`) to avoid “no matching push files” skips.

## Workflow for Cleaning Up Artifacts

Artifacts often come in rough — untyped props, accessibility issues, lint violations. The setup is designed to surface all of that:

1. **Drop the artifact** into `src/artifacts/` (folder with `index.tsx` entry; optional `meta.ts`)
2. **Run `npm run lint`** to see Biome errors (a11y, suspicious patterns, style)
3. **Run `npm run typecheck`** to see TypeScript errors (implicit `any`, missing types)
4. **Fix iteratively** — use `npm run lint:fix` for auto-fixable issues, then address the rest manually

Example `meta.ts`:

```ts
const meta = {
  name: 'My Artifact',
  subtitle: 'Short description',
  kind: 'single',
  model: 'model-name',
} as const;

export default meta;
```

## Biome Configuration

Configured in `biome.json`:

- **Formatter**: 2-space indent, 120 line width, single quotes, trailing commas, semicolons
- **Linter**: recommended rules with a few overrides:
  - `noExplicitAny` — off (artifacts often use `any` liberally)
  - `noUnusedVariables` / `noUnusedFunctionParameters` — off (work-in-progress artifacts have these)
  - `useTemplate` — off
- **CSS**: Tailwind directives enabled
- **Imports**: auto-organized on fix

## Formatting Workflow

When making code changes — especially wrapping large sections or adjusting structure that affects indentation — insert the
syntactically correct pieces and let Biome handle formatting. Do not manually reformat unrelated surrounding code.

For targeted files:

```bash
npx biome check --write <file>
```

For broader cleanup:

```bash
npm run lint:fix
```
