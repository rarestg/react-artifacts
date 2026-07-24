# React Artifacts

A local viewer for developing and refining React artifacts. Drop a folder into `src/artifacts/` with an `index.tsx` component and it appears in the sidebar automatically — no registry or config needed. Deployed as a Cloudflare Worker.

## Stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **@base-ui/react** — the sole shared widget-primitive dependency (Radix and cmdk are gone); shared primitives wrap it wherever they need real widget behavior
- **Biome** for linting, formatting, and import organization
- **lucide-react** for icons

## Getting Started

```bash
npm install
npm run dev
```

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run check` | Combined pre-PR gate: lint + typecheck + knip + test |
| `npm run lint` / `npm run lint:fix` | Biome check (format + lint + imports) / with auto-fix |
| `npm run typecheck` | Type-check app + worker (`npm run typecheck:worker` for worker only) |
| `npm run knip` / `npm run knip:ci` | Unused files/exports/deps — local (exports warn) / CI (exports error) |
| `npm run test` | Node test runner (`tests/**/*.test.ts`) |
| `npm run hooks:pre-commit` / `npm run hooks:pre-push` | Run the Lefthook suites manually |
| `npm run generate-types` | Regenerate Worker types after `wrangler.jsonc`/binding changes |
| `npm run preview` / `npm run deploy` | Preview production build / deploy Worker |

`npm run format` is an alias for `lint:fix`.

## Repo Map

Where imports come from:

- `src/artifacts/` — self-contained artifact folders. `example` and `example-app` are the canonical copy-targets.
- `src/components/` — tokenized artifact primitives (Base UI-backed where they need widget behavior).
- `src/ui/` — skin recipes (`recipes.ts`), layout primitives (`layout.tsx`), portal wrappers (`base-portals.tsx`).
- `src/lib/` — non-visual hooks and helpers.
- `src/theme/artifact-theme.css` — the `.artifact-theme` design tokens (light + dark).
- `src/App.tsx` — viewer shell (sidebar, theme/device controls); `src/artifacts.ts` — discovery via `import.meta.glob`.
- `design/` — design philosophy, artifact design guidance, and UI implementation notes.
- `worker/` + `wrangler.jsonc` — Cloudflare Worker deployment; `tests/` — Node test runner tests.

## Invariants

- Artifacts export a React component from `index.tsx`; they do not mount to the DOM.
- `ArtifactThemeRoot` is the default artifact root; anything using tokens or shared token primitives must render under it.
- Device preview renders inside a fixed-size container; it is not a real browser viewport.
- Worker binding or `wrangler.jsonc` changes require `npm run generate-types`.
- Let Biome handle formatting and import organization instead of hand-formatting large edits.

## Building an Artifact

Create a folder in `src/artifacts/` with an `index.tsx` default export:

```tsx
// src/artifacts/my-artifact/index.tsx
import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';

export default function MyArtifact() {
  return <ArtifactThemeRoot className="p-6">Hello</ArtifactThemeRoot>;
}
```

The viewer picks it up via `import.meta.glob` — just refresh the page. A bare `<div>` also works, but `ArtifactThemeRoot` is the default root: it provides the `.artifact-theme` token scope that shared primitives and `var(--*)` classes rely on.

**Multi-file apps.** Artifacts can be full apps with their own components, hooks, and styles. The only rule is that `index.tsx` exports a React component. If you are porting a typical Vite app, replace the `ReactDOM.createRoot(...)` entry with a re-export:

```tsx
// src/artifacts/my-artifact/index.tsx
export { default } from './App';
```

- Per-artifact `index.html` files are not used by this shell.
- If you need titles/body classes, set them inside the component with `useEffect`.

**Copy-targets.** Start from the examples instead of a blank folder:

- `src/artifacts/example/` — minimal single-file artifact: `ArtifactThemeRoot`, tokens, shared primitives, `meta.ts`.
- `src/artifacts/example-app/` — fuller multi-file app: `App.tsx`, a `components/` folder, layout primitives, recipes.

**Metadata (optional).** A `meta.ts` controls the sidebar label and the page's search metadata:

```ts
const meta = {
  name: 'My Artifact',
  subtitle: 'Short description',
  kind: 'single', // or 'app'
  model: 'model-name', // optional
  version: 'model-version', // optional
  noindex: true, // optional: exclude from the sitemap and add a robots noindex tag
} as const;

export default meta;
```

**Manifest registration.** Every artifact folder must also be listed in `src/artifactManifest.ts` (one import + one entry). The Worker uses it for per-page meta tags and the sitemap — it cannot use `import.meta.glob` — and `tests/app/artifactManifest.test.ts` fails when the list drifts from the folders on disk.

**Device preview is not a viewport.** The sidebar's device preview (iPhone/iPad, portrait/landscape) renders the artifact inside a fixed-size container, so Tailwind `sm:`/`md:`/`lg:` breakpoints still follow the browser window, not the preview size. For artifacts meant to match the preview, use container-driven responsiveness (container queries, or `useContainerWidth` from `src/lib/`). Reserve viewport breakpoints for full-page prototypes tracked against the real browser window (or DevTools device emulation).

## UI Decision Ladder

When an artifact needs a piece of UI, walk down and stop at the first rung that holds:

1. **Shared kit** — `src/components/`, `src/ui/recipes.ts`, `src/ui/layout.tsx`. Use a shared primitive or recipe when behavior and visual contract match.
2. **Native HTML** — a plain element (`<button>`, `<details>`, `<input type="date">`) styled with tokens/recipes.
3. **Base UI** — the moment you are about to write keydown handling, aria state, focus management, outside-click, or positioning code: stop, that is a Base UI component. Skin it with recipes; portal overlays through `src/ui/base-portals.tsx`.
4. **Build it local** — keep it in the artifact folder. Promote to `src/components/` only when a second consumer appears.

**Asking Base UI what it has:**

```bash
ls node_modules/@base-ui/react/
```

Each kebab-case directory is an importable module (`@base-ui/react/<name>`); most are components, and the listing is exact for the installed version. Docs are agent-friendly markdown: `https://base-ui.com/llms.txt` is the index, with per-component pages at `https://base-ui.com/react/components/{name}.md`.

## UI System

Layered, outermost first:

1. **Token boundary** — `ArtifactThemeRoot` (`src/components/ArtifactThemeRoot.tsx`) renders the `.artifact-theme` scope; all tokens live in `src/theme/artifact-theme.css` (light + dark). Token primitives guard against rendering outside it.
2. **Skin recipes** — `src/ui/recipes.ts`: the single source of truth for the Tailwind class strings encoding the sharp-minimal skin (control, panel, badge, status, input, popup, collection item, typography, focus ring).
3. **Primitives** — `src/components/`: `Button`, `Input`, `Tag`, `StatusTag`, `Panel`, `PageHeader`, `Checkbox`, `FilterCheckbox`, `Toggle`, `SegmentedControl`, `ListboxSelect`, `Stepper`, `CopyButton`, `CopyableLabel`, `ReservedWidth`, `ArtifactDialog`, plus `panelHeaderClasses` for dense tool-panel headers. Primitives that need widget behavior wrap Base UI; simpler ones are native HTML plus recipes.
4. **Layout** — `src/ui/layout.tsx`: `Stack` and `Grid` with semantic gap tiers (`row`/`group`/`section`); see UI note 009.
5. **Portals** — `src/ui/base-portals.tsx`: `Artifact{Dialog,Select,Autocomplete,Popover}Portal` mount Base UI overlays inside the theme boundary so scoped tokens resolve. Never portal an artifact overlay to `document.body`.

Non-visual helpers live in `src/lib/`: `mergeClassNames`, `useCopyToClipboard`, `useLocalStorageState`, `useRootDarkMode`/`isRootDarkMode`, `useContainerWidth`, `getPlatformShortcutHint`, `assignRef`.

Not every `src/components/` export is an artifact primitive (`ArtifactListItem` is shell UI). Shell chrome in `src/App.tsx` is not artifact UI; do not pull artifact-token components into it unless the subtree is intentionally wrapped — prefer headless hooks and shell-specific classes there.

Deeper detail (geometry, focus behavior, recurring gotchas) lives in `design/`, not here.

## Viewer Features

**Theme toggle (Light / System / Dark).** The sidebar toggle sets the page theme by adding a `dark` class to `<html>`. Explicit light/dark is stored in localStorage (`artifact-theme`); `system` removes the key and follows `prefers-color-scheme`. An inline script in `index.html` applies the saved/system theme early to avoid FOUC.

**Device preview.** iPhone/iPad + portrait/landscape frames — see the caveat under [Building an Artifact](#building-an-artifact).

**Artifact URLs.** The selected artifact is reflected in the URL, so reloads and sharing keep context:

```
/?artifact=sharp2
```

**Standalone view.** Open an artifact full-page (no shell UI) at:

```
/artifact/<id>
```

Standalone view always follows the OS/browser theme (`prefers-color-scheme`) and ignores any saved shell theme. The theme is applied on load and does not live-update if the OS theme changes while the page stays open.

## Design Docs

- Design philosophy: `design/SHARP_MINIMAL_DESIGN.md`
- Practical artifact UI guidance: `design/ARTIFACT_DESIGN_GUIDE.md`
- UI/layout decisions and recurring gotchas: `design/UI_IMPLEMENTATION_NOTES.md`

Before making UI/layout changes, read the first two, then skim the index in `UI_IMPLEMENTATION_NOTES.md` and read relevant entries. Each index row includes a line range so you can jump directly with `sed -n 'START,ENDp' design/UI_IMPLEMENTATION_NOTES.md`.

Add a new implementation note only when a recurring decision or gotcha emerges (layout behavior, responsiveness, Tailwind patterns, shared component usage that took back-and-forth to settle). To add one, draft the entry body as raw markdown in a temporary `.md` file (no top-level `##` heading), then run:

```bash
python3 design/update_ui_implementation_notes.py \
  --entry-md /path/to/entry.md \
  --title "Short Title" \
  --when-read "When should someone read this?" \
  --keywords "comma, separated, keywords"
```

## Quality Gates

Before opening a PR:

```bash
npm run check   # lint + typecheck + knip + test
```

**Knip is stricter in CI.** Locally, `npm run knip` reports unused exports as warnings; CI runs `npm run knip:ci` (`knip.ci.json`), where unused exports are **errors**. If you add an export nothing consumes yet, CI fails — export it only when something imports it, or keep it local until then.

**Git hooks (Lefthook).** Installed automatically on `npm install` via the `prepare` script (`npx lefthook install` if needed):

- **pre-commit:** Biome on staged files (auto-fixes and re-stages) — stage files first.
- **pre-push:** `lint`, `typecheck`, `knip`, and `test` in parallel.

Run them manually with `npm run hooks:pre-commit` / `npm run hooks:pre-push` (the latter passes `--force` so manual runs are not skipped for "no matching push files").

**Cleaning up rough artifacts.** Dropped-in artifacts often arrive with untyped props, a11y issues, and lint violations. Drop the folder in, run `npm run lint` and `npm run typecheck`, then fix iteratively — `npm run lint:fix` for the auto-fixable issues, manual passes for the rest.

**Screenshot smoke (manual, not in CI).** `scripts/screenshot.mjs` renders an artifact route at 768/1024/1440px in light + dark and saves full-page PNGs. It needs a running dev server and `playwright-core` (not a repo dependency; Chromium comes from `~/.cache/ms-playwright`):

```bash
npm run dev
npm i --no-save playwright-core
node scripts/screenshot.mjs [--url http://localhost:5173/artifact/sharp2] [--out /tmp/artifact-shots]
```

## Cloudflare Workers Deployment

Deployed as a Cloudflare Worker with static assets + SPA routing. Configuration lives in `wrangler.jsonc`; the Worker entry is `worker/index.ts` (handles `/api/*`, injects per-page meta tags into the SPA HTML for `/` and `/artifact/*`, and serves `/sitemap.xml` + `/robots.txt`). Deploy with `npm run deploy` (builds first — `wrangler deploy` reads the Vite-generated config in `dist/`).

Worker TypeScript uses Wrangler-generated types:

- Run `npm run generate-types` after changing `wrangler.jsonc` or bindings; it writes `worker-configuration.d.ts`.
- `npm run typecheck` runs `wrangler types --check` and will not write types.

## Appendix: Biome

Configured in `biome.json`:

- **Formatter:** 2-space indent, 120 line width, single quotes, trailing commas, semicolons; imports auto-organized on fix.
- **Linter:** recommended rules, with `noExplicitAny`, `noUnusedVariables`/`noUnusedFunctionParameters`, and `useTemplate` off (work-in-progress artifacts trip them constantly).
- **Workflow:** when a change affects indentation or wraps large sections, insert syntactically correct code and let Biome format it (`npx biome check --write <file>` for targeted files, `npm run lint:fix` for broader cleanup). Do not manually reformat unrelated surrounding code.
