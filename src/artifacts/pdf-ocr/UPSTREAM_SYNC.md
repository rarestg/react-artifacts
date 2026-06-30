# pdf-ocr — Upstream Sync / Handoff

> Local clone paths are environment-specific and will differ for the next engineer; this doc never hardcodes them. Repo-relative paths below are relative to each repo's root.

## 1. TL;DR

The **pdf-ocr artifact** (`src/artifacts/pdf-ocr/` in the react-artifacts repo) is a browser-only, BYO-Gemini-key PDF→Markdown OCR tool. It is a **port of the upstream pdf-split-parse repo (GitHub: `rarestg/pdf-split-parse`)** — the artifact re-ports the pure `core/` logic near-verbatim and **re-maps** the UI into this repo's sharp-minimal, token-based design system. **Sync rule: track upstream's pure-core *logic* changes faithfully; re-map (never copy) its UI; and never "fix" the deliberate divergences in §3.**

The port was taken around upstream commit `dc6951c` and **predates upstream's three polish commits** `ae63892` / `6f945cd` / `d3d9f66`. `core/cost.ts` and `core/anomaly.ts` are byte-identical to upstream; everything in §4 is real, verified upstream evolution the artifact is behind on.

## 2. Module mapping

Upstream paths are `src/...` in pdf-split-parse; artifact paths are relative to `src/artifacts/pdf-ocr/`.

| Upstream | Artifact | Status | Why |
|---|---|---|---|
| `core/cost.ts` | `core/cost.ts` | FAITHFUL | Byte-identical pricing table (2026-06-29), heuristics, formatters. |
| `core/anomaly.ts` | `core/anomaly.ts` | FAITHFUL | Byte-identical `detectRepetition` (≥200-char run). |
| `core/markdown.ts` | `core/markdown.ts` | FAITHFUL | Same merge format, provenance + Errors/Warnings sections. |
| `core/gemini.ts` | `core/gemini.ts` | DIVERGED | Behind on omni filter, "Load"→"Test" copy, `onActivity` logging; **keeps lenient `checkApiKey`** (review-fix, §3). |
| `core/pipeline.ts` | `core/pipeline.ts` | DIVERGED | No `onStats`/`onActivity`, no `preloaded?` param; **intentionally untouched ported pipeline** (§3.7). |
| `core/splitPdf.ts` | `core/splitPdf.ts` | DIVERGED | `parsePageSpec` returns plain `number[]` (lenient, §3.4); no `{pages,ignored}`, no eager `splitPdf` helper. |
| `core/types.ts` (+ scattered) | `core/types.ts` | DIVERGED | Has old single `elapsedMs` + `runKind`; no `onStats`/`onActivity` types. `DEFAULT_CONCURRENCY=4` kept as pipeline fallback. |
| `core/debug.ts` | — (none) | DIVERGED | Dev instrumentation not ported; not wanted in artifact. |
| `core/index.ts` (barrel) | — (none) | DIVERGED | No barrel by design (§3.5). |
| `hooks/useOcrJob.ts` | `hooks/useOcrJob.ts` | DIVERGED | Old `runKind` + single `elapsedMs`; no source reuse; **adds review-fix stale-guards + partial-markdown-on-fatal** (§3.6). |
| `hooks/useLifetimeStats.ts` | `hooks/useLifetimeStats.ts` | FAITHFUL | Same 3-aggregate model; storage key `pdf-split-parse:lifetime` → `pdf-ocr:lifetime`. |
| `App.tsx` (plain hooks) | `App.tsx` + `useController.ts` | DIVERGED | Re-architected to a single `Controller` view-model; guided-calm vertical bands. |
| `components/ApiKeyInput.tsx` | `components/ApiKeyPanel.tsx` | DIVERGED | Sharp-minimal re-map; remember-key uses **localStorage** not sessionStorage (watch-item, §7). |
| `components/FileDrop.tsx` | `components/Dropzone.tsx` | DIVERGED | Re-map; no "sample PDF" button (watch-item, §7). |
| `components/Controls.tsx` | `components/SettingsPanel.tsx` | DIVERGED | Re-map; **adds Max button + default concurrency 32** (§3.3). |
| `components/ModelTable.tsx` | `components/ModelTable.tsx` | DIVERGED | Re-map; Est. cost column kept; upstream's HSL cost-dot re-expressed as tokenized tier glyphs `$`/`$$`/`$$$` (green/amber/red via `--success`/`--warning`/`--danger`). |
| `components/Progress.tsx` + `CostSummary.tsx` | `components/RunReport.tsx` | DIVERGED | **Merged into one Run-report card**; missing upstream live "retrying" back-off segment (§4). |
| `components/RetryPanel.tsx` | `components/RetryPanel.tsx` | DIVERGED | Re-map; **adds image-detail override + live re-OCR estimate** (§3.2). |
| `components/ResultView.tsx` | `components/ResultView.tsx` | DIVERGED | **Sanitized render — no `rehype-raw`**, `MarkdownBoundary` fallback (invariant, §6). |
| (header inline in `App.tsx`) | `components/Header.tsx` | DIVERGED | Sticky status lane; artifact-only. |
| — | `components/primitives.tsx` | ARTIFACT-ONLY | Shared marks/steppers/formatters. |

## 3. Deliberate divergences — DO NOT "fix" these

1. **Sharp-minimal redesign** — radius-0, opaque surfaces, CSS-var tokens (`--surface`/`--border`/`--accent`/`--ring`), no shadows/glass/glow, full-width bands not floating cards, light+dark parity, `ArtifactThemeRoot`. Rationale: this repo's house style; upstream's rounded/shadowed dark theme is never copied.
2. **RetryPanel artifact-only additions** — image-detail override (`retryDetail`) + live re-OCR cost estimate (`retryEstimate`). Rationale: gives the retry flow the cost visibility upstream's panel lacks.
3. **`Max` parallelism button + default concurrency 32** (`INITIAL_ARTIFACT_CONCURRENCY` in `useController.ts`) while the pipeline keeps `DEFAULT_CONCURRENCY=4` (`core/types.ts`). Rationale: UI ships a fast default; pipeline keeps a safe fallback — intentionally different, do not reconcile.
4. **Lenient page-spec UX** — `parsePageSpec` clamps/drops/dedupes instead of rejecting; "all"/empty → full doc; `convert()` always passes explicit `pages` so strict `validatePageRange` is bypassed. Rationale: friendlier than upstream's reject path.
5. **No `core/` barrel** — modules imported directly. Rationale: an upstream `index.ts` should not be adopted.
6. **Three review-fix logic divergences** — (a) `checkApiKey` fatal **only** on `httpIsFatal` (transient 429/5xx from `listModels` rethrown as-is, not "invalid key"); (b) `abortRef.current === controller` stale-guards on every async write in `useOcrJob.ts`; (c) partial-markdown-on-fatal — `run` keeps `collected` pages, `retry` keeps the existing doc + surfaces `actionError`. Rationale: hardened behavior from a prior review; **note upstream's `ae63892` moved the OTHER way (any `GeminiHttpError` = fatal) — do not adopt it.**
7. **DEFERRED — never-sent-page "failed" rows** on a mid-run key revoke are intentionally NOT implemented; the ported `pipeline.ts` is kept untouched (no synthetic failed rows for pages the queue never dispatched). The error callout + partial markdown cover the case. Do not "fix" by mutating the pipeline.

## 4. What's evolved upstream

**Yes — upstream has moved since the port.** The artifact predates upstream commits `ae63892`, `6f945cd`, `d3d9f66`. All items below are verified against the artifact source (the gaps are real).

### Functionality (Survey A)

| # | Upstream change (commit) | Artifact state | Sync? |
|---|---|---|---|
| F1 | `onActivity`/`onStats` + `debug.ts` request-lifecycle logging (`ae63892`) | Absent in `core/pipeline.ts`/`core/gemini.ts`/`useOcrJob.ts` | Partial — see §5 (logging itself: skip) |
| F2 | Retry timing split `elapsedMs`+`retryElapsedMs`, drops `runKind` (`ae63892`) | Artifact solves differently: controller `jobElapsedMs`+`attemptElapsedMs`, keeps `runKind` | No (own design) |
| F3 | Parsed-source reuse for retries: `preloaded?` param + `ctxRef.source` (`dc6951c`/`ae63892`) | Re-parses PDF every retry; no `preloaded`, no cached `source` | Yes (perf) |
| F4 | `parsePageSpec` → `{pages, ignored}` + eager `splitPdf` helper (`dc6951c`) | Returns plain `number[]`, silently drops junk | Yes (UX), keep leniency |
| F5 | `curateModels` drops `omni` family (`6f945cd`) | Regex at `core/gemini.ts:115` lacks `omni` → omni models leak into dropdown | Yes (cheap) |
| F6 | `checkApiKey`: any `GeminiHttpError` from `listModels` = fatal (`ae63892`) | Lenient by design (review-fix §3.6) | **No — deliberate divergence** |
| F7 | `fatalMessage` copy "Load"→"Test" (`d3d9f66`) | `core/gemini.ts:496` still says `Use "Load"` | Yes (cheap) |

### Product / UI (Survey B)

- The artifact **already has** upstream's freshest product bets: anomaly tri-state, arbitrary-page free-text retry, smarter-model default (`pickSmarterModel`), per-model cost ledger, and the billed-attempts-aware estimate-vs-actual verdict. RetryPanel even **exceeds** upstream (detail override + live estimate).
- **Behind on:** upstream's live throughput segments — the amber **"{n} retrying"** (pages in 429/503 back-off) live count. The artifact derives `inFlight`/`not started` annotations, but the *retrying* signal needs the `onActivity('retry')`/`onStats` callbacks the port omits (F1). This is the one genuine live-UX gap.
- **Surfacing ignored page-spec tokens** ("Ignored: …" line in RetryPanel preview) is the product half of F4 — the artifact drops junk silently.

> Recheck later: clone upstream and run `git log --oneline dc6951c..HEAD` (and read commit-scoped diffs) to see anything newer than this doc's `d3d9f66` baseline.

## 5. Gap analysis / TO-SYNC checklist

Prioritized; each adapted to the artifact's architecture (controller view-model · sharp-minimal · ported core).

| Pri | Item | Where | Effort | Risk | Notes |
|---|---|---|---|---|---|
| **P1** | **F5 omni filter** | `core/gemini.ts:115` `curateModels` regex | Trivial (add `omni` to the modality alternation) | Low | Prevents realtime/multimodal models polluting the picker. |
| **P1** | **F7 "Load"→"Test" copy** | `core/gemini.ts:496` `fatalMessage` | Trivial (1 string) | None | Pure copy fix; the artifact uses a "Test" button. |
| **P2** | **F4 surface ignored tokens** | `core/splitPdf.ts` + `RetryPanel.tsx` + `useController` | Small–Med | Low | **Keep leniency (§3.4)** — only *expose* dropped tokens. Add an `ignored` return (artifact-shaped, not necessarily upstream's `{pages,ignored}`) and an "Ignored: …" preview line. Skip the eager `splitPdf` helper. |
| **P2** | **Live "retrying" segment** | pipeline→hook→controller→`Header.tsx`/`RunReport.tsx` | Med | Med | Wire `onActivity('retry')`→`onStats` minimally to feed an amber back-off count. **Touches the ported pipeline** — keep it additive (optional callback only), do NOT alter dispatch/abort behavior or the §3.7 deferred stance. Skip `debug.ts` logging entirely. |
| **P3** | **F3 parsed-source reuse** | `useOcrJob.ts` `ctxRef` + `pipeline.ts` `preloaded?` | Med | Med | Perf only (large PDFs). Additive optional `preloaded?: PDFDocument`; cache parsed `source` in `ctxRef`. Same pipeline-additive caution as above. |
| — | **F2 retry timing split** | — | — | — | **No action** — artifact's controller timers already cover this; adopting upstream's field rename would churn the view-model contract for no user benefit. |
| — | **F6 checkApiKey strictness** | — | — | — | **No action** — deliberate divergence (§3.6); upstream moved the opposite way. |
| **Deferred** | Never-sent-page failed rows on mid-run key revoke | `pipeline.ts` | — | — | Intentionally NOT done (§3.7). Leave the ported pipeline untouched. |

**Suggested order:** P1 omni + copy (one tiny PR), then P2 ignored-tokens, then P2 retrying-segment / P3 source-reuse as appetite allows.

## 6. Sync methodology

**Re-port near-verbatim (pure core, logic only):** `core/cost.ts`, `core/anomaly.ts`, `core/markdown.ts` (already faithful), and the *logic* of `core/gemini.ts` / `core/splitPdf.ts` / `core/pipeline.ts`. Cherry-pick logic deltas (e.g. the omni regex); **never import upstream's `debug.ts` or `index.ts` barrel**, and **preserve the review-fix divergences (§3.6) and the deferred pipeline stance (§3.7)** — do not let a re-port silently revert them.

**UI RE-MAPPING (never copy upstream styling):** for every component in §2, port the *behavior/copy/state machine*, not the JSX or CSS. Upstream is rounded/shadowed dark; the artifact is sharp-minimal token-based. Map upstream component → artifact component via the §2 table; new upstream affordances get re-expressed through `primitives.tsx` and the `Controller`.

**How to diff:** clone upstream (path is environment-specific). Baseline ≈ `dc6951c`. Run `git log --oneline dc6951c..HEAD` upstream, then read each commit's diff per file and decide faithful-port vs re-map vs deliberate-divergence per §3.

**Re-verify gates (all must pass):**
```
npm run typecheck   # wrangler types --check + tsc app + worker
npm run lint        # biome check .
npm run knip        # dead-code / unused-export check
npm run test        # node --test tests/**/*.test.ts
npm run build       # tsc -b && vite build
```
(`npm run check` runs lint+typecheck+knip+test; `build` is separate.)

**Invariants to preserve:**
- **Browser-only** — OCR talks directly to Google Gemini; no backend/worker call for inference.
- **BYO key, client-side** — key never leaves the browser; stored only client-side; lifetime stats persist aggregates only (never key/filename/content).
- **Tokens-only UI** — CSS-var tokens, no hardcoded colors/shadows/glass/rounded; light+dark parity; **never color-alone for state** (shape+icon+label).
- **No raw HTML in markdown render** — `ResultView.tsx` uses `react-markdown` + `remark-gfm` only, **no `rehype-raw`**; keep the `MarkdownBoundary` `<pre>` fallback.
- **View-model contract** — one `Controller` (`type Controller = ReturnType<typeof useController>`); components are `{ vm }` consumers; all setup/derived state lives in `useController.ts`. Don't bypass it.

## 7. Open questions / watch-items

- **Key storage:** artifact persists the key in **localStorage** (`pdf-ocr:key`) gated by a "Remember on this browser" checkbox (`ApiKeyPanel.tsx`); upstream uses **sessionStorage** + "Remember in this browser tab". DELIBERATE (the artifact uses the repo's standard `useLocalStorageState` hook + an honest label), but the cross-session persistence is a real privacy trade-off vs upstream's tab-only storage — worth a conscious product call. WATCH.
- **Sample PDF:** upstream's "Try the sample PDF" button (`FileDrop.tsx`, fetches `{BASE_URL}sample.pdf`) has no artifact equivalent in `Dropzone.tsx`. RESOLVED — DELIBERATE: the artifact ships no `sample.pdf` asset, so the sample affordance was intentionally dropped.
- **ModelTable cost cues:** RESOLVED — the artifact keeps the per-job **Est. cost** column and re-expresses upstream's relative-cost HSL dot as **bold tokenized tier glyphs** `$`/`$$`/`$$$` (green/amber/red via `--success`/`--warning`/`--danger`) — a deliberate tokens-only redesign of the same cue, not a removal.
- **`inFlight` source:** with no `onStats`/`onActivity`, the artifact's in-flight/not-started counts are derived (not callback-fed). Confirm the derivation before wiring the P2 retrying segment so the two stay consistent. OPEN.
- **Upstream drift past baseline:** these surveys reflect upstream around 2026-06-30 / `d3d9f66`. Re-run `git log --oneline dc6951c..HEAD` upstream before any sync to catch newer commits. OPEN.
