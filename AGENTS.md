# Agent Notes

Start with `README.md`. It is the main orientation doc for the stack, repo map, artifact conventions, scripts, design docs, and pre-PR checks.

## Quick Map

- `src/App.tsx` is the viewer shell: sidebar, artifact selection, theme/device controls, and preview frame.
- `src/artifacts.ts` discovers artifacts with `import.meta.glob`.
- `src/artifacts/<id>/` contains each artifact. `index.tsx` exports the React component; optional `meta.ts` controls sidebar labels.
- `src/components/` contains shared UI primitives used across the shell and artifacts.
- `src/theme/` and `ArtifactThemeRoot` provide tokenized artifact styling.
- `design/` contains the visual language and UI implementation guidance.
- `tests/` contains Node test runner coverage.
- `worker/` and `wrangler.jsonc` contain the Cloudflare Worker deployment path.

## Working Notes

- Read before editing. Check file length first, then read the whole relevant file or doc when practical. For long files, read enough surrounding context to understand ownership, data flow, and local patterns before patching.
- Delegate with fresh context. For substantive delegated work, prefer a new worker with `fork_context: false`; give it the goal, relevant files, constraints, ownership boundaries, and expected outputs. When model choice is available and the task is complex, prefer `gpt-5.5` with `xhigh` reasoning.
- Keep changes scoped. Avoid mixing unrelated cleanup into feature work; call out unrelated dirty files instead of normalizing them silently.
- Follow the design docs for UI choices. `design/SHARP_MINIMAL_DESIGN.md` and `design/ARTIFACT_DESIGN_GUIDE.md` are the source of truth for geometry, layout, focus, and interaction details.
- When a useful repo-specific discovery takes real effort or multiple steps, add a concise note here so future agents do not rediscover it. Keep this file terse and under 100 lines.
- Run `npm run check` before opening a PR.

## exe.dev

This repo is often developed in an exe.dev VM. Use only documented exe.dev features; see `https://exe.dev/docs.md` and `https://exe.dev/docs/proxy.md`.

When serving Vite through the exe.dev proxy, allow the proxy host at runtime instead of committing VM-specific hosts to `vite.config.ts`:

```bash
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<vm-host>.exe.xyz npm run dev -- --host 0.0.0.0 --port 5174
```

For example:

```bash
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=vscode-623-lima.exe.xyz npm run dev -- --host 0.0.0.0 --port 5174
```
