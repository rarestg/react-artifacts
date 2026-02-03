## Implementation Summary (Completed)

**Implemented changes**
- Added standalone routing in `src/main.tsx` with lazy-loaded roots and BASE_URL-aware path parsing.
- Extracted the artifact registry into `src/artifacts.ts` and updated `src/App.tsx` to consume it.
- Added `src/StandaloneRoot.tsx` plus `src/StandaloneFallback.tsx` for standalone loading and not-found UI.
- Added a sidebar link to open standalone view using `SquareArrowOutUpRight` next to model/version tags.
- Updated `index.html` inline script to force system theme on `/artifact/*` routes and documented behavior in `README.md`.

**Notes / deviations from plan**
- Suspense fallbacks are now a styled skeleton (not `null`) to avoid blank screens.
- Standalone “not found” is styled and uses sharp UI surfaces.
- Added the standalone link UI in the sidebar (nice-to-have, not originally in scope).
- Standalone theme follows OS/browser only and ignores stored shell theme; it does not live-update if the OS theme changes mid-session.

**Validation**
- `npm run lint`
- `npm run typecheck`

# Standalone Artifact Route Plan

## 1) Problem & Motivation

### What we're solving and why now
Artifacts can only be viewed inside the shell (sidebar + resize handle + size overlay). There's no way to open an artifact as a full-page app. This matters for mobile testing, sharing direct links, and embedding artifacts without shell chrome.

### Success criteria / desired outcomes
- Navigating to `/artifact/<id>` renders only the artifact component, full-page, no shell UI.
- The existing shell at `/?artifact=<id>` continues to work unchanged.
- No new dependencies introduced.
- Standalone and shell paths don't load each other's code (lazy-loaded roots).
- Standalone routing works under a non-root `BASE_URL` (e.g. `/myapp/artifact/<id>`).

## 2) System Context

### Relevant code
- **`src/main.tsx`** — Entry point. Currently imports `App` eagerly and mounts it.
- **`src/App.tsx`** — Defines the artifact registry inline (`import.meta.glob` calls for `./artifacts/*/index.tsx` and `./artifacts/*/meta.ts`), plus all shell UI (sidebar, resize handle, theme toggle, size overlay).
- **`src/index.css`** — Global styles, imported by `main.tsx`.

### How affected code connects to other subsystems
- Artifact discovery is done via `import.meta.glob` at module scope in `App.tsx`. Both the shell and standalone route need this registry, so it must be extracted.
- Theme handling (dark class on `<html>`, localStorage sync, system media query) lives inside the `App` component. Standalone mode won't have this unless explicitly added.
- URL-based artifact selection (`?artifact=` query param, `popstate` listener) is shell-only and irrelevant to the standalone route.

## 3) Implementation Plan (ordered)

### Step 1: Extract artifact registry to `src/artifacts.ts`

**What to do**
- Create `src/artifacts.ts`.
- Move from `App.tsx` into it: the `ArtifactMeta` type, both `import.meta.glob` calls, and the `artifacts` array construction.
- Export: `ArtifactMeta` type, `artifacts` array, inferred `ArtifactEntry` type, and a `findArtifactById(id: string)` helper.

**Where**: New file `src/artifacts.ts`; remove corresponding code from `src/App.tsx`.

**Why**: Both `App` (shell) and `StandaloneRoot` need the artifact list. Extracting it avoids duplication and keeps the glob calls in one place.

```ts
// src/artifacts.ts
import { type ComponentType, lazy } from 'react';

export type ArtifactMeta = {
  name?: string;
  subtitle?: string;
  kind?: 'single' | 'app';
  model?: string;
  version?: string;
};

const modules = import.meta.glob<{ default: ComponentType }>('./artifacts/*/index.tsx');
const metaModules = import.meta.glob<{ default: ArtifactMeta }>('./artifacts/*/meta.ts', { eager: true });

export const artifacts = Object.entries(modules).map(([path, loader]) => {
  const folder = path.replace('./artifacts/', '').replace('/index.tsx', '');
  const meta = metaModules[`./artifacts/${folder}/meta.ts`]?.default;
  return {
    id: folder,
    name: meta?.name ?? folder,
    subtitle: meta?.subtitle,
    kind: meta?.kind,
    model: meta?.model,
    version: meta?.version,
    Component: lazy(loader),
  };
});

export type ArtifactEntry = (typeof artifacts)[number];

export const findArtifactById = (id?: string) => artifacts.find((a) => a.id === id);
```

**Dependencies**: None. Do this first since Steps 2, 4, and 5 import from it.

---

### Step 2: Create `src/StandaloneRoot.tsx`

**What to do**
- Create a minimal component that receives an artifact `id` prop, looks it up via `findArtifactById`, and renders it in a `Suspense` boundary with `fallback={null}`.
- Show a minimal "not found" message with no wrapper elements (text node only).

**Where**: New file `src/StandaloneRoot.tsx`.

**Why**: Keeps the standalone rendering path separate from the shell. No sidebar state, resize observers, or canvas measurement code is loaded.

```tsx
// src/StandaloneRoot.tsx
import { Suspense } from 'react';
import { findArtifactById } from './artifacts';

export default function StandaloneRoot({ id }: { id: string }) {
  const artifact = findArtifactById(id);

  if (!artifact) {
    return <>Artifact not found.</>;
  }

  return (
    <Suspense fallback={null}>
      <artifact.Component />
    </Suspense>
  );
}
```

**Dependencies**: Step 1 (needs `findArtifactById` from `src/artifacts.ts`).

---

### Step 3: Update `index.html` — force system theme for standalone

**What to do**
- Update the inline theme script to detect `/artifact/<id>` paths (respecting `%BASE_URL%`) and ignore any stored `artifact-theme` value.
- When on a standalone route, always use `prefers-color-scheme` (system theme).

**Where**: `index.html` inline script in `<head>`.

**Why**: Standalone should inherit OS/browser theme, regardless of shell-specific stored theme. This avoids applying an explicit light/dark choice made in the shell.

```html
<script>
  (() => {
    try {
      const base = '%BASE_URL%'.replace(/\/$/, '');
      const pathname = window.location.pathname;
      const stripped = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
      const isStandalone = /^\/artifact\/[^/]+\/?$/.test(stripped);

      const stored = localStorage.getItem('artifact-theme');
      const storedTheme =
        stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
      const theme = isStandalone ? 'system' : storedTheme;

      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldDark = theme === 'dark' || (theme === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', shouldDark);
      document.documentElement.style.colorScheme = shouldDark ? 'dark' : 'light';
    } catch {
      // no-op
    }
  })();
</script>
```

**Dependencies**: None.

---

### Step 4: Update `src/main.tsx` — route gate + lazy roots

**What to do**
- Add a `getStandaloneIdFromPath()` function that parses `window.location.pathname` for the pattern `/artifact/<id>`, respecting `import.meta.env.BASE_URL`.
- Guard for non-browser environments with `if (typeof window === 'undefined') return undefined;`.
- Lazy-import both `App` and `StandaloneRoot`.
- Conditionally render one or the other based on whether a standalone id was found.

**Where**: `src/main.tsx` (rewrite).

**Why**: The entry point is the right place to decide which root to mount. Lazy-loading both means the standalone path doesn't pull in sidebar/resize code, and the shell path doesn't pull in `StandaloneRoot` (the artifact registry still loads in both). Use `Suspense` with `fallback={null}` to avoid any shell chrome appearing on standalone paths while the bundle loads.

```tsx
// src/main.tsx
import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const App = lazy(() => import('./App'));
const StandaloneRoot = lazy(() => import('./StandaloneRoot'));

const getStandaloneIdFromPath = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  const pathname = window.location.pathname;
  const stripped = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const match = stripped.match(/^\/artifact\/([^/]+)\/?$/);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const standaloneId = getStandaloneIdFromPath();

createRoot(rootElement).render(
  <StrictMode>
    <Suspense fallback={null}>
      {standaloneId ? <StandaloneRoot id={standaloneId} /> : <App />}
    </Suspense>
  </StrictMode>,
);
```

**Dependencies**: Steps 1 and 2.

---

### Step 5: Update `src/App.tsx` — use shared registry

**What to do**
- Remove the `ArtifactMeta` type, both `import.meta.glob` calls, and the `artifacts` array construction.
- Add `import { artifacts } from './artifacts';` at the top.
- Everything else in `App.tsx` stays unchanged.

**Where**: `src/App.tsx`.

**Why**: Eliminates duplication. The shell now uses the same registry as the standalone route.

**Dependencies**: Step 1.

---

## 4) Key Decisions & Tradeoffs

| Decision | Why | Alternative considered |
|---|---|---|
| Path-based routing (`/artifact/:id`) over query params | Clean URLs, conventional for distinct views | `?mode=standalone&artifact=id` — muddier, mixes concerns with existing `?artifact=` |
| Route gate in `main.tsx`, not inside `App` | Avoids initializing shell state/effects then bailing out; no hook-order hazards from early returns | Early return inside `App` — simpler but wasteful |
| Lazy-load both roots | Standalone doesn't bundle sidebar/resize code; shell doesn't bundle StandaloneRoot | Eager imports — simpler but standalone loads unused code |
| No `?artifact=` backward-compat redirect | This is a local dev tool, not a public API. No users to migrate. | Add redirect logic — unnecessary complexity |
| Force system theme for standalone | Standalone should inherit OS/browser theme and ignore shell’s stored theme | Apply stored theme everywhere — simpler but violates “system only” requirement |
| No react-router | One route fork doesn't justify a dependency | react-router — overkill |

## 5) Risks & Landmines

### Vite SPA fallback
- Vite's dev server already serves `index.html` for unknown paths, so `/artifact/foo` works in dev with no config change.
- **Production builds**: your hosting/server must be configured to serve `index.html` for all paths (standard SPA fallback). If using `vite preview`, this works by default. If deploying behind nginx/Vercel/etc., ensure the fallback rule is in place.

### `import.meta.glob` path sensitivity
- The glob patterns in `src/artifacts.ts` use relative paths (`./artifacts/*/index.tsx`). This works because the file lives in `src/`. If someone moves `artifacts.ts` to a different directory, the globs break silently (no artifacts found, no error).

### Theme in standalone mode
- Standalone mode forces **system** theme via the inline script. Stored `artifact-theme` is ignored on `/artifact/*`, so shell theme choices won’t leak into standalone previews. Note: the inline script sets the theme once on load; it will not live-update if the OS theme changes while the page stays open.

### Artifact IDs with special characters
- `decodeURIComponent` handles encoded slashes/spaces. If an artifact folder name contains characters that are invalid in URL paths (unlikely given filesystem conventions), the match will fail silently and show "Artifact not found."

## 6) Verification & Validation

### After Step 1
- `npm run typecheck` passes.
- `npx biome check src/artifacts.ts` passes.

### After Step 2
- `npm run typecheck` passes.

### After Steps 3–5
- `npm run typecheck` passes.
- `npx biome check --write .` for formatting.
- **Manual test — shell**: `npm run dev`, open `http://localhost:<vite-port>/?artifact=example`. Sidebar, theme toggle, resize handle, size overlay all work as before.
- **Manual test — standalone**: open `http://localhost:<vite-port>/artifact/example`. Artifact renders full-page, no sidebar or shell chrome visible.
- **Manual test — not found**: open `http://localhost:<vite-port>/artifact/nonexistent`. Shows "Artifact not found." message.
- **Manual test — shell default**: open `http://localhost:<vite-port>/`. Shell loads with first artifact selected as before.
- **Manual test — standalone theme**: set `localStorage.artifact-theme` to `dark` and `light` in the shell, then open `/artifact/example`. The page should still follow OS/browser theme (toggle system dark/light to verify).
- **Manual test — BASE_URL**: if using a non-root base (e.g. `BASE_URL=/myapp/`), confirm `http://localhost:<vite-port>/myapp/artifact/example` resolves to the standalone view.
- `npm run build` succeeds. Check that the production build includes two lazy chunks (one for App, one for StandaloneRoot).

### Rollback
All changes are additive except the extraction from `App.tsx`. To rollback: revert `index.html` and `main.tsx`, delete `artifacts.ts` and `StandaloneRoot.tsx`, restore the inline registry in `App.tsx`.

## 7) Open Questions / Follow-ups

- **Theme in standalone**: If artifacts need custom theming beyond system preferences, add an optional standalone-specific toggle later.
- **Hot-reload for path changes**: Vite HMR works for component edits but won't re-evaluate the `main.tsx` route gate. Changing between shell and standalone requires a full page reload (normal browser navigation). Not a problem in practice.
- **Link from shell to standalone**: Could add a small "open standalone" icon button next to the artifact name in the sidebar that opens `/artifact/<id>` in a new tab. Nice-to-have, not in scope.
