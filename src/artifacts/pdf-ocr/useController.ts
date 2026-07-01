import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorageState } from '../../lib/useLocalStorageState';
import { actualCost, type CostEstimate, estimateCost } from './core/cost';
import { checkApiKey, type GeminiModel, pickCheapestModel, pickSmarterModel } from './core/gemini';
import { getPageCount, parsePageSpec, parsePageSpecDetailed } from './core/splitPdf';
import { DEFAULT_MEDIA_RESOLUTION, DEFAULT_PROMPT, DEFAULT_TIMEOUT_MS, type MediaResolution } from './core/types';
import { useLifetimeStats } from './hooks/useLifetimeStats';
import { useOcrJob } from './hooks/useOcrJob';

const KEY_STORAGE = 'pdf-ocr:key';

/** Artifact's initial parallel-pages setting. Higher than the pipeline's DEFAULT_CONCURRENCY (4)
 *  fallback on purpose: the UI ships a fast default; the pipeline keeps its conservative fallback. */
const INITIAL_ARTIFACT_CONCURRENCY = 32;

export type TestState = { status: 'idle' | 'testing' | 'ok' | 'error'; message: string };
export type LoadedFile = { name: string; bytes: Uint8Array; pageCount: number; size: number };

/** Immutable record of what a run was launched with; captured at convert() time, never mutated after. */
export type RunSnapshot = {
  fileName: string;
  pageCount: number;
  model: string;
  mediaResolution: MediaResolution;
  concurrency: number;
  timeoutSec: number;
  selectedPages: number[];
  selectedCount: number;
};

export type LedgerRow = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  billedPages: number;
  cost: number | null;
};

/** Resolve a free-text page spec ("all" or "1-5, 8") to a concrete 1-based page list. */
function resolveSelectedPages(spec: string, pageCount: number): number[] {
  const trimmed = spec.trim().toLowerCase();
  if (trimmed === '' || trimmed === 'all') return Array.from({ length: pageCount }, (_, index) => index + 1);
  return parsePageSpec(spec, pageCount);
}

/** Tokens silently dropped from the current spec, surfaced as an advisory. Empty/"all" parses nothing,
 *  so it has nothing to ignore — mirror resolveSelectedPages and skip junk-detection there. */
function resolveIgnoredTokens(spec: string, pageCount: number): string[] {
  const trimmed = spec.trim().toLowerCase();
  if (trimmed === '' || trimmed === 'all') return [];
  return parsePageSpecDetailed(spec, pageCount).ignored;
}

/**
 * The single view model the UI consumes: wraps the ported OCR job + lifetime tally and owns all setup
 * state. Everything the components read (collapse flags, counts, timers, estimates, retry defaults) is
 * derived here so the components stay declarative.
 */
export function useController() {
  const { stats: lifetime, record, reset: resetLifetime } = useLifetimeStats();
  const { state, run, retry, cancel, reset } = useOcrJob(record);

  // --- API key (optionally remembered in localStorage) -------------------------------------------
  const [storedKey, setStoredKey] = useLocalStorageState<string>(KEY_STORAGE, '');
  const [apiKey, setApiKeyRaw] = useState(storedKey);
  const latestKeyRef = useRef(apiKey);
  const [rememberKey, setRememberKey] = useState(() => storedKey.length > 0);
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<TestState>({ status: 'idle', message: '' });
  const [models, setModels] = useState<GeminiModel[]>([]);
  const [model, setModel] = useState('');

  useEffect(() => {
    setStoredKey(rememberKey ? apiKey : '');
  }, [rememberKey, apiKey, setStoredKey]);

  // Editing the key invalidates the previous test, which re-locks the model table.
  const setApiKey = useCallback((value: string) => {
    latestKeyRef.current = value;
    setApiKeyRaw(value);
    setTest((prev) => (prev.status === 'idle' ? prev : { status: 'idle', message: '' }));
    setModels((prev) => (prev.length ? [] : prev));
    setModel((prev) => (prev ? '' : prev));
  }, []);

  // --- Settings ----------------------------------------------------------------------------------
  const [mediaResolution, setMediaResolution] = useState<MediaResolution>(DEFAULT_MEDIA_RESOLUTION);
  const [concurrency, setConcurrency] = useState(INITIAL_ARTIFACT_CONCURRENCY);
  const [timeoutSec, setTimeoutSec] = useState(Math.round(DEFAULT_TIMEOUT_MS / 1000));
  const [pageSpec, setPageSpec] = useState('all');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // --- Document ----------------------------------------------------------------------------------
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [fileError, setFileError] = useState('');
  const [fileReading, setFileReading] = useState(false);

  // --- Run lifecycle -----------------------------------------------------------------------------
  const [runSnapshot, setRunSnapshot] = useState<RunSnapshot | null>(null);
  const [editingSetup, setEditingSetup] = useState(false);
  const [activeRetry, setActiveRetry] = useState<{ pages: number[]; model: string } | null>(null);
  const [retrySpec, setRetrySpec] = useState('');
  const [retryModel, setRetryModel] = useState('');
  const [retryDetail, setRetryDetail] = useState<MediaResolution>(DEFAULT_MEDIA_RESOLUTION);
  const [resultTab, setResultTab] = useState<'preview' | 'source'>('preview');

  const running = state.status === 'running';
  const activeRunKind = running ? state.runKind : null;
  const retrying = activeRunKind === 'retry';
  const setupCollapsed = runSnapshot !== null && !editingSetup;

  // --- Live timers (one 250ms ticker drives both the cumulative job timer and the attempt timer) --
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    setNowTick(performance.now());
    const id = window.setInterval(() => setNowTick(performance.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);
  const liveDelta = running && state.startedAt !== null ? Math.max(0, nowTick - state.startedAt) : 0;
  // Continuous across run + retries: state.elapsedMs holds the prior cumulative, startedAt resets per op.
  const jobElapsedMs = running && state.startedAt !== null ? state.elapsedMs + liveDelta : state.elapsedMs;
  const attemptElapsedMs = liveDelta;

  // --- Derived from results ----------------------------------------------------------------------
  const flaggedPages = useMemo(
    () =>
      state.results
        .filter((result) => result.error || result.warning)
        .map((result) => result.pageNumber)
        .sort((a, b) => a - b),
    [state.results],
  );
  const flaggedSpec = useMemo(() => flaggedPages.join(', '), [flaggedPages]);

  const counts = useMemo(() => {
    let ok = 0;
    let suspect = 0;
    let failed = 0;
    for (const result of state.results) {
      if (result.error) failed += 1;
      else if (result.warning) suspect += 1;
      else ok += 1;
    }
    return { ok, suspect, failed };
  }, [state.results]);

  const ledgerRows: LedgerRow[] = useMemo(
    () =>
      Object.entries(state.costByModel).map(([ledgerModel, value]) => ({
        model: ledgerModel,
        inputTokens: value.inputTokens,
        outputTokens: value.outputTokens,
        billedPages: value.billedPages,
        cost: actualCost(ledgerModel, value.inputTokens, value.outputTokens),
      })),
    [state.costByModel],
  );
  const actualTotal = useMemo(() => ledgerRows.reduce((sum, row) => sum + (row.cost ?? 0), 0), [ledgerRows]);
  const hasCost = ledgerRows.some((row) => row.cost !== null);
  const allPriced = ledgerRows.length > 0 && ledgerRows.every((row) => row.cost !== null);

  // --- Selection + estimate (pre-run) ------------------------------------------------------------
  const selectedPages = useMemo(() => (file ? resolveSelectedPages(pageSpec, file.pageCount) : []), [file, pageSpec]);
  const selectedCount = selectedPages.length;
  const ignoredTokens = useMemo(() => (file ? resolveIgnoredTokens(pageSpec, file.pageCount) : []), [file, pageSpec]);
  const estimate: CostEstimate | null = useMemo(
    () => (file && model ? estimateCost(model, selectedCount, mediaResolution) : null),
    [file, model, selectedCount, mediaResolution],
  );

  // --- Retry defaults (recomputed only on a settled flagged-set change or explicit reset) ---------
  const computeRetryDefault = useCallback(() => {
    const base = state.model || model;
    return models.length ? pickSmarterModel(models, base) : base;
  }, [models, state.model, model]);

  const lastFlaggedSigRef = useRef('');
  useEffect(() => {
    if (running) return;
    if (flaggedSpec === lastFlaggedSigRef.current) return;
    lastFlaggedSigRef.current = flaggedSpec;
    setRetrySpec(flaggedSpec);
    setRetryModel(computeRetryDefault());
    setRetryDetail(runSnapshot?.mediaResolution ?? DEFAULT_MEDIA_RESOLUTION);
  }, [running, flaggedSpec, computeRetryDefault, runSnapshot]);

  // Drop the in-flight retry descriptor once the operation settles.
  useEffect(() => {
    if (!running) setActiveRetry(null);
  }, [running]);

  const retryPages = useMemo(
    () => (file ? parsePageSpec(retrySpec, runSnapshot?.pageCount ?? file.pageCount) : []),
    [file, retrySpec, runSnapshot],
  );
  // Re-OCR estimate: the RETRY page count × the chosen retry model × the chosen retry detail.
  const retryEstimate = useMemo(
    () => (retryModel && retryPages.length > 0 ? estimateCost(retryModel, retryPages.length, retryDetail) : null),
    [retryModel, retryPages.length, retryDetail],
  );

  // --- Handlers ----------------------------------------------------------------------------------
  const runTest = useCallback(async () => {
    const key = apiKey.trim();
    if (!key) return;
    setTest({ status: 'testing', message: 'Testing…' });
    try {
      const result = await checkApiKey(key);
      if (key !== latestKeyRef.current.trim()) return;
      setModels(result.models);
      setModel(pickCheapestModel(result.models) ?? '');
      setTest({
        status: 'ok',
        message: result.tested
          ? `Verified · ${result.models.length} models · live test "${result.reply}"`
          : (result.note ?? `Key valid · ${result.models.length} models loaded.`),
      });
    } catch (error) {
      if (key !== latestKeyRef.current.trim()) return;
      setModels([]);
      setModel('');
      setTest({ status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  }, [apiKey]);

  const pickFile = useCallback(
    async (files: FileList | null) => {
      const picked = files?.[0];
      if (!picked) return;
      setFileError('');
      if (picked.type && picked.type !== 'application/pdf' && !/\.pdf$/i.test(picked.name)) {
        setFileError('That doesn’t look like a PDF. Choose a .pdf file.');
        return;
      }
      setFileReading(true);
      try {
        const bytes = new Uint8Array(await picked.arrayBuffer());
        const pageCount = await getPageCount(bytes);
        reset();
        setRunSnapshot(null);
        setEditingSetup(false);
        setActiveRetry(null);
        setPageSpec('all');
        setFile({ name: picked.name, bytes, pageCount, size: picked.size });
      } catch (error) {
        setFile(null);
        setFileError(error instanceof Error ? error.message : String(error));
      } finally {
        setFileReading(false);
      }
    },
    [reset],
  );

  const convertReason =
    test.status !== 'ok' || !model
      ? 'Test your API key first.'
      : !file
        ? 'Drop a PDF first.'
        : selectedCount === 0
          ? 'Selected range is empty.'
          : '';
  const canConvert = convertReason === '';

  const convert = useCallback(() => {
    if (!file || test.status !== 'ok' || !model || selectedCount === 0) return;
    const snapshot: RunSnapshot = {
      fileName: file.name,
      pageCount: file.pageCount,
      model,
      mediaResolution,
      concurrency,
      timeoutSec,
      selectedPages,
      selectedCount,
    };
    setRunSnapshot(snapshot);
    setEditingSetup(false);
    setActiveRetry(null);
    void run(file.bytes, file.name, {
      apiKey: apiKey.trim(),
      model,
      prompt,
      mediaResolution,
      concurrency,
      timeoutMs: timeoutSec * 1000,
      pages: selectedPages,
    });
  }, [
    file,
    test.status,
    model,
    selectedCount,
    selectedPages,
    mediaResolution,
    concurrency,
    timeoutSec,
    apiKey,
    prompt,
    run,
  ]);

  const reOcr = useCallback(() => {
    // Guard against starting a retry over a still-running job (which would abort it).
    if (running || !file || !runSnapshot) return;
    const pages = parsePageSpec(retrySpec, runSnapshot.pageCount);
    if (pages.length === 0) return;
    setActiveRetry({ pages, model: retryModel });
    void retry(pages, { model: retryModel, mediaResolution: retryDetail });
  }, [running, file, runSnapshot, retrySpec, retryModel, retryDetail, retry]);

  const resetRetryToFlagged = useCallback(() => {
    setRetrySpec(flaggedSpec);
    setRetryModel(computeRetryDefault());
    setRetryDetail(runSnapshot?.mediaResolution ?? DEFAULT_MEDIA_RESOLUTION);
  }, [flaggedSpec, computeRetryDefault, runSnapshot]);

  const editSetup = useCallback(() => {
    if (state.status === 'running') return;
    setEditingSetup(true);
  }, [state.status]);

  const download = useCallback(() => {
    if (!state.markdown) return;
    const blob = new Blob([state.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(runSnapshot?.fileName ?? file?.name ?? 'ocr').replace(/\.pdf$/i, '')}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [state.markdown, runSnapshot, file]);

  return {
    // job
    state,
    activeRunKind,
    running,
    retrying,
    /** Live (telemetry): requests currently out, and the subset asleep in a 429/503 back-off. */
    activity: state.activity,
    // setup state
    apiKey,
    setApiKey,
    rememberKey,
    setRememberKey,
    showKey,
    setShowKey,
    test,
    models,
    model,
    setModel,
    mediaResolution,
    setMediaResolution,
    concurrency,
    setConcurrency,
    timeoutSec,
    setTimeoutSec,
    pageSpec,
    setPageSpec,
    prompt,
    setPrompt,
    settingsOpen,
    setSettingsOpen,
    advancedOpen,
    setAdvancedOpen,
    file,
    fileError,
    fileReading,
    // run lifecycle
    runSnapshot,
    editingSetup,
    setupCollapsed,
    activeRetry,
    // derived
    selectedPages,
    selectedCount,
    ignoredTokens,
    estimate,
    counts,
    flaggedPages,
    ledgerRows,
    actualTotal,
    hasCost,
    allPriced,
    jobElapsedMs,
    attemptElapsedMs,
    // retry
    retrySpec,
    setRetrySpec,
    retryModel,
    setRetryModel,
    retryDetail,
    setRetryDetail,
    retryPages,
    retryEstimate,
    resultTab,
    setResultTab,
    // convert gating
    canConvert,
    convertReason,
    // lifetime
    lifetime,
    resetLifetime,
    // handlers
    runTest,
    pickFile,
    convert,
    cancel,
    reOcr,
    resetRetryToFlagged,
    editSetup,
    download,
  };
}

export type Controller = ReturnType<typeof useController>;
