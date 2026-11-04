# Agent Notes

Start with `README.md`. It is the main orientation doc for the stack, repo map, artifact conventions, scripts, design docs, and pre-PR checks.

## Working Notes

- Adding or removing an artifact folder also requires updating `src/artifactManifest.ts`. The viewer discovers artifacts with `import.meta.glob`, but the Worker cannot, and `tests/app/artifactManifest.test.ts` fails when the two drift.
- Follow `DESIGN.md` for UI choices. It is the source of truth for geometry, layout, focus, and interaction details. `PRODUCT.md` holds lasting product context, so do not list tools, linked sites, routes, or commands there.
- `src/artifacts/pdf-ocr/` is a port of `rarestg/pdf-split-parse`, which is still changing. Its `core/` and `hooks/` track that repo, and its UI follows `DESIGN.md`.
- Restart `npm run preview` after every build. A running server answers new asset hashes with the HTML fallback, so the page renders blank and rendered scans falsely report no findings.
- When a useful repo-specific discovery takes real effort or multiple steps, add a concise note here so future agents do not rediscover it. Keep this file terse and under 100 lines.
- Run `npm run check` before opening a PR. CI also runs `npm run build` and `npm run knip:ci`, which treats unused exports as errors where the local check only warns.
- `@base-ui/react` is held at 1.6.0 in the lockfile, and `npm update` will try to raise it. 1.7 fails a Prompt Library Space-toggle test. 1.9 lets an overlay that is open on first render escape to `document.body`, because `ArtifactThemeRoot` passes a ref that is still empty when the portal resolves it. Fix both before upgrading.

## exe.dev

This repo is often developed in an exe.dev VM. Use only documented exe.dev features; see `https://exe.dev/docs.md` and `https://exe.dev/docs/proxy.md`.

When serving Vite through the exe.dev proxy, allow the proxy host at runtime instead of committing VM-specific hosts to `vite.config.ts`, which the exe.dev FAQ suggests:

```bash
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<vm-host>.exe.xyz npm run dev -- --host 0.0.0.0 --port 5174
```

Then open `https://<vm-host>.exe.xyz:5174/`. The proxy forwards ports 3000 to 9999.
