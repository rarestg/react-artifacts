# Agent Notes

Start with `README.md`. It is the main orientation doc for the stack, repo map, artifact conventions, scripts, design docs, and pre-PR checks.

## Working Notes

- Adding or removing an artifact folder also requires updating `src/artifactManifest.ts`. The viewer discovers artifacts with `import.meta.glob`, but the Worker cannot, and `tests/app/artifactManifest.test.ts` fails when the two drift.
- `src/main.tsx`, `src/StandaloneRoot.tsx`, and `src/StandaloneFallback.tsx` handle standalone `/artifact/<id>` routes.
- Some files run past 700 lines, such as `src/App.tsx`. When a task needs a file's full context, make sure you have read to the end rather than assuming a partial read covered it.
- Keep changes scoped. Avoid mixing unrelated cleanup into feature work; call out unrelated dirty files instead of normalizing them silently.
- Follow the design docs for UI choices. `design/SHARP_MINIMAL_DESIGN.md` and `design/ARTIFACT_DESIGN_GUIDE.md` are the source of truth for geometry, layout, focus, and interaction details.
- When a useful repo-specific discovery takes real effort or multiple steps, add a concise note here so future agents do not rediscover it. Keep this file terse and under 100 lines.
- Run `npm run check` before opening a PR. CI also runs `npm run knip:ci`, which treats unused exports as errors where the local check only warns.
- Node 22 or later is required, because the installed Wrangler needs it. CI uses Node 24.
- `@base-ui/react` is held at 1.6.0 in the lockfile, and `npm update` will try to raise it. 1.7 fails a Prompt Library Space-toggle test. 1.9 lets an overlay that is open on first render escape to `document.body`, because `ArtifactThemeRoot` passes a ref that is still empty when the portal resolves it. Fix both before upgrading.

## exe.dev

This repo is often developed in an exe.dev VM. Use only documented exe.dev features; see `https://exe.dev/docs.md` and `https://exe.dev/docs/proxy.md`.

When serving Vite through the exe.dev proxy, allow the proxy host at runtime instead of committing VM-specific hosts to `vite.config.ts`:

```bash
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<vm-host>.exe.xyz npm run dev -- --host 0.0.0.0 --port 5174
```
