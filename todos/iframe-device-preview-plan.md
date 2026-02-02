# Iframe Device Preview Plan

## 1) Problem & Motivation

### What we’re solving and why now
Current “device preview” is a fixed-size wrapper inside the main app. Tailwind responsive classes (e.g. `sm:`/`lg:`) respond to the browser viewport, not the wrapper size. This causes artifacts to render with desktop breakpoints even when the preview size is iPhone/iPad. We want device preview to behave like a true viewport so artifacts render at their intended breakpoints.

### Success criteria / desired outcomes
- When device preview is active, the artifact renders inside a viewport whose width/height match the device preset.
- Tailwind breakpoints and `window.innerWidth/innerHeight` reflect the preview size (without relying on DevTools).
- Theme (light/dark/system) and artifact selection still work.
- Non-preview mode continues to behave as it does today.

## 2) System Context

### Relevant code
- `src/App.tsx`
  - Artifact discovery (`import.meta.glob` for `./artifacts/*/index.tsx`).
  - Sidebar selection, theme handling, and device preview state (`devicePreview`, `deviceOrientation`).
  - Current device preview wrapper (fixed-size `div` with `previewWidth/previewHeight`).
  - Size badge logic and resize/drag behavior.

### How affected code connects to other subsystems
- Theme is applied by toggling `dark` on `<html>` in `src/App.tsx`. This affects all artifacts.
- Artifact selection is mirrored into the URL (`?artifact=`) and is used for shareable links and history.
- Artifacts are rendered directly into the main DOM with `Suspense` (no iframe today).

## 3) Implementation Plan (ordered)

### Step 1: Add “frame mode” routing
**What to do**
- In `src/App.tsx`, detect a new query param `frame=1` (or `mode=frame`).
- If `frame` is present, render ONLY the artifact content (no sidebar, no device preview controls).
- Keep `theme` handling active in frame mode so the artifact is themed correctly.

**Where**
- `src/App.tsx`: add a helper similar to `getArtifactIdFromUrl` for `frame` detection.
- `App` render branch: early return for frame mode.

**Why**
- The iframe should load a minimal app surface to avoid nesting the entire UI inside the preview.

### Step 2: Render iframe in device preview mode
**What to do**
- Replace the preview wrapper `div` inside the `isDevicePreviewActive` block with an `<iframe>`.
- Construct `src` to include current `artifact` and `frame=1`:
  - Example: `/?artifact=${selected}&frame=1`.
- Set `width` and `height` to the device preset (already computed in `previewWidth`/`previewHeight`).
- Keep the container styling (rounded corners, border, shadow) on a wrapper `div` and make the iframe fill it (`className="w-full h-full"`).

**Where**
- `src/App.tsx`, in the device preview render branch.

**Why**
- An iframe gives the artifact its own viewport, allowing Tailwind breakpoints to respond to the preview size.

### Step 3: Sync theme into the iframe
**What to do**
- Ensure the iframe document has the correct theme class on its `<html>` element.
- Option A (simplest): keep current theme logic in the app and pass theme via query param (`theme=light|dark|system`), then in `frame` mode:
  - Read `theme` from URL and set the `dark` class accordingly.
- Option B: use `postMessage` to send theme changes to the iframe and update the iframe’s root class.

**Where**
- `src/App.tsx`: theme read/apply in frame mode.
- Potentially add a small `useEffect` to update iframe `src` when theme changes if using query param.

**Why**
- The iframe is a separate document and will not inherit the parent’s `dark` class.

### Step 4: Sync selected artifact to the iframe
**What to do**
- When selection changes, update the iframe `src` (if using query param), or use `postMessage` to navigate within the iframe.
- Keep the existing URL sync for the parent app (push/replace for `artifact=`) so sharing still works.

**Where**
- `src/App.tsx`, in the preview render branch and selection change effect.

**Why**
- The preview should track the same artifact selection.

### Step 5: Update size badge measurement
**What to do**
- If using iframe, the effective “canvas” for preview is the device preset size (same as current). The size badge can continue to use `previewWidth/previewHeight` or measure the iframe element.
- Keep current non-preview measurement logic intact.

**Where**
- `src/App.tsx` size calculation effect.

**Why**
- Maintain correct size reporting for both preview and non-preview modes.

### Step 6: Verify deep links and history
**What to do**
- Ensure `/?artifact=xyz` still opens the correct artifact in the parent app.
- Ensure `/?artifact=xyz&frame=1` loads artifact only (no sidebar).
- Confirm browser back/forward still works in parent app.

**Where**
- `src/App.tsx` URL handling (`getArtifactIdFromUrl`, `updateArtifactUrl`, popstate listener).

**Why**
- Frame mode adds a new route; history should remain stable.

## 4) Key Decisions & Tradeoffs

### Decision: use iframe + frame mode
**Why this approach**
- It makes Tailwind responsive classes work “as designed” without rewriting artifacts to container queries.
- It’s a contained change with minimal changes to artifact code.

### Alternatives considered
- **Container queries**: requires updating all artifacts to use container query variants; more invasive.
- **Portal into iframe**: complex style sync and mount logic; higher maintenance.

### Tradeoffs accepted
- Slight overhead of loading a second React tree in the iframe.
- Need to keep theme/selection in sync between parent and iframe.

## 5) Risks & Landmines

- **Theme isolation**: iframe does not inherit parent `dark` class; must be explicitly set.
- **HMR quirks**: Vite dev server should reload both parent and iframe, but double reloads may happen.
- **URL sync**: avoid infinite loops between parent and iframe if using query params + popstate.
- **Focus / keyboard shortcuts**: shortcuts defined in artifacts will run inside the iframe only.
- **Clipboard access**: still works, but make sure permissions aren’t blocked in iframe.

## 6) Verification & Validation

### Manual checks
- Enable device preview (iPhone). Verify Tailwind breakpoints respond as mobile (e.g. `lg:` styles do not apply).
- Toggle theme and ensure iframe artifact switches theme consistently.
- Switch artifacts; iframe updates to the correct artifact.
- Reload the page with `?artifact=...` and confirm both parent and iframe mode behave correctly.

### Tests to run
- `npm run dev` and manually verify UI.
- `npm run build` to ensure TypeScript and build pipeline stay clean.

### Rollback plan
- Revert to direct `current.Component` render in preview mode and remove `frame` routing logic.
- Restore previous preview container and size measurement.

## 7) Open Questions / Follow-ups

- Should iframe mode be used only for device preview, or available as a standalone mode for artifact sharing?
- How should `system` theme be handled in the iframe (pass resolved light/dark, or compute inside iframe)?
- Should the size badge reflect the iframe viewport or the artifact’s inner document body size?

