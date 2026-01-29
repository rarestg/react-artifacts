# React Artifacts

A local viewer for developing and refining React artifacts. Drop a folder into `src/artifacts/` with an `index.tsx` component and it appears in the sidebar automatically — no registry or config needed.

## Stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **Biome** for linting, formatting, and import organization
- **lucide-react** for icons

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
    Primitives.tsx
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
  model: 'claude',
  version: 'opus 4.5', // optional
} as const;

export default meta;
```

## Theme Toggle (Light / System / Dark)

The sidebar includes a theme toggle that sets the page theme by adding a `dark` class
to the `<html>` element and syncing to localStorage (`artifact-theme`).

Notes:
- `system` respects `prefers-color-scheme`.
- An inline script in `index.html` applies the saved/system theme early to avoid FOUC.

## Artifact URLs

The selected artifact is reflected in the URL as a query param, so reloads and sharing keep context:

```
/?artifact=sharp2
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run format` | Run Biome with auto-fix (format + lint + imports) |
| `npm run lint` | Run Biome (format + lint + imports check) |
| `npm run lint:fix` | Run Biome and auto-fix |
| `npm run preview` | Preview production build |

## Workflow for Cleaning Up Artifacts

Artifacts often come in rough — untyped props, accessibility issues, lint violations. The setup is designed to surface all of that:

1. **Drop the artifact** into `src/artifacts/` (folder with `index.tsx` entry; optional `meta.ts`)
2. **Run `npm run lint`** to see Biome errors (a11y, suspicious patterns, style)
3. **Run `npm run build`** to see TypeScript errors (implicit `any`, missing types)
4. **Fix iteratively** — use `npm run lint:fix` for auto-fixable issues, then address the rest manually

Example `meta.ts`:

```ts
const meta = {
  name: 'My Artifact',
  subtitle: 'Short description',
  kind: 'single',
  symbol: 'S',
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

## Note to Self (Claude)

When making code changes — especially wrapping large sections of code or adjusting structure that affects indentation — just insert the syntactically correct pieces and let Biome handle formatting. Do not manually reformat surrounding code. Run `npx biome check --write <file>` after the edit instead (this also organizes imports).
