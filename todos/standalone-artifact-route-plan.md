# Standalone Artifact Route Plan

## 1) Problem & Motivation

### What we're solving and why now
Artifacts can only be viewed inside the shell (sidebar + resize handle + size overlay). There's no way to open an artifact as a full-page app. This matters for mobile testing, sharing direct links, and embedding artifacts without shell chrome.

### Success criteria / desired outcomes
- Navigating to `/artifact/<id>` renders only the artifact component, full-page, no shell UI.
- The existing shell at `/?artifact=<id>` continues to work unchanged.
- No new dependencies introduced.
- Standalone and shell paths don't load each other's code (lazy-loaded roots).

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
- Export: `ArtifactMeta` type, `ArtifactEntry` type, `artifacts` array, and a `findArtifactById(id: string)` helper.

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

export type ArtifactEntry = {
  id: string;
  name: string;
  subtitle?: string;
  kind?: 'single' | 'app';
  model?: string;
  version?: string;
  Component: ComponentType;
};

const modules = import.meta.glob<{ default: ComponentType }>('./artifacts/*/index.tsx');
const metaModules = import.meta.glob<{ default: ArtifactMeta }>('./artifacts/*/meta.ts', { eager: true });

export const artifacts: ArtifactEntry[] = Object.entries(modules).map(([path, loader]) => {
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

export const findArtifactById = (id?: string) => artifacts.find((a) => a.id === id);
```

**Dependencies**: None. Do this first since Steps 2–4 import from it.

---

### Step 2: Create `src/StandaloneRoot.tsx`

**What to do**
- Create a minimal component that receives an artifact `id` prop, looks it up via `findArtifactById`, and renders it in a `Suspense` boundary.
- Show a "not found" message if the id doesn't match any artifact.

**Where**: New file `src/StandaloneRoot.tsx`.

**Why**: Keeps the standalone rendering path separate from the shell. No sidebar state, resize observers, or canvas measurement code is loaded.

```tsx
// src/StandaloneRoot.tsx
import { Suspense } from 'react';
import { findArtifactById } from './artifacts';

export default function StandaloneRoot({ id }: { id: string }) {
  const artifact = findArtifactById(id);

  if (!artifact) {
    return <div className="p-6 text-sm text-gray-500">Artifact not found.</div>;
  }

  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading…</div>}>
      <artifact.Component />
    </Suspense>
  );
}
```

**Dependencies**: Step 1 (needs `findArtifactById` from `src/artifacts.ts`).

---

### Step 3: Update `src/main.tsx` — route gate + lazy roots

**What to do**
- Add a `getStandaloneIdFromPath()` function that parses `window.location.pathname` for the pattern `/artifact/<id>`, respecting `import.meta.env.BASE_URL`.
- Lazy-import both `App` and `StandaloneRoot`.
- Conditionally render one or the other based on whether a standalone id was found.

**Where**: `src/main.tsx` (rewrite).

**Why**: The entry point is the right place to decide which root to mount. Lazy-loading both means the standalone path doesn't pull in sidebar/resize code, and the shell path doesn't pull in `StandaloneRoot`.

```tsx
// src/main.tsx
import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const App = lazy(() => import('./App'));
const StandaloneRoot = lazy(() => import('./StandaloneRoot'));

const getStandaloneIdFromPath = (): string | undefined => {
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
    <Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading…</div>}>
      {standaloneId ? <StandaloneRoot id={standaloneId} /> : <App />}
    </Suspense>
  </StrictMode>,
);
```

**Dependencies**: Steps 1 and 2.

---

### Step 4: Update `src/App.tsx` — use shared registry

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
| No theme handling in standalone | Artifacts that need theming can handle it themselves; keeps StandaloneRoot minimal | Extract `useTheme` hook shared by both roots — adds complexity, can be done later if needed |
| No react-router | One route fork doesn't justify a dependency | react-router — overkill |

## 5) Risks & Landmines

### Vite SPA fallback
- Vite's dev server already serves `index.html` for unknown paths, so `/artifact/foo` works in dev with no config change.
- **Production builds**: your hosting/server must be configured to serve `index.html` for all paths (standard SPA fallback). If using `vite preview`, this works by default. If deploying behind nginx/Vercel/etc., ensure the fallback rule is in place.

### `import.meta.glob` path sensitivity
- The glob patterns in `src/artifacts.ts` use relative paths (`./artifacts/*/index.tsx`). This works because the file lives in `src/`. If someone moves `artifacts.ts` to a different directory, the globs break silently (no artifacts found, no error).

### Theme in standalone mode
- Standalone mode will not apply the dark/light/system theme logic. Artifacts that rely on the `dark` class on `<html>` will render in whatever the browser default is. This is an accepted tradeoff — if it becomes a problem, extract theme handling into a shared hook later.

### Artifact IDs with special characters
- `decodeURIComponent` handles encoded slashes/spaces. If an artifact folder name contains characters that are invalid in URL paths (unlikely given filesystem conventions), the match will fail silently and show "Artifact not found."

## 6) Verification & Validation

### After Step 1
- `npm run typecheck` passes.
- `npx biome check src/artifacts.ts` passes.

### After Step 2
- `npm run typecheck` passes.

### After Steps 3 + 4
- `npm run typecheck` passes.
- `npx biome check --write .` for formatting.
- **Manual test — shell**: `npm run dev`, open `http://localhost:5173/?artifact=example`. Sidebar, theme toggle, resize handle, size overlay all work as before.
- **Manual test — standalone**: open `http://localhost:5173/artifact/example`. Artifact renders full-page, no sidebar or shell chrome visible.
- **Manual test — not found**: open `http://localhost:5173/artifact/nonexistent`. Shows "Artifact not found." message.
- **Manual test — shell default**: open `http://localhost:5173/`. Shell loads with first artifact selected as before.
- `npm run build` succeeds. Check that the production build includes two lazy chunks (one for App, one for StandaloneRoot).

### Rollback
All changes are additive except the extraction from `App.tsx`. To rollback: revert `main.tsx`, delete `artifacts.ts` and `StandaloneRoot.tsx`, restore the inline registry in `App.tsx`.

## 7) Open Questions / Follow-ups

- **Theme in standalone**: If artifacts frequently need dark mode in standalone view, extract theme logic into a `useTheme()` hook and call it from `StandaloneRoot`. Not needed now.
- **Hot-reload for path changes**: Vite HMR works for component edits but won't re-evaluate the `main.tsx` route gate. Changing between shell and standalone requires a full page reload (normal browser navigation). Not a problem in practice.
- **Link from shell to standalone**: Could add a small "open standalone" icon button next to the artifact name in the sidebar that opens `/artifact/<id>` in a new tab. Nice-to-have, not in scope.
