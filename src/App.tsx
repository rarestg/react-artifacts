import {
  Layers,
  Monitor,
  Moon,
  RectangleHorizontal,
  RectangleVertical,
  Smartphone,
  Square,
  SquareArrowOutUpRight,
  Sun,
  Tablet,
} from 'lucide-react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { artifacts } from './artifacts';

type DevicePreview = 'none' | 'iphone' | 'ipad';
type DeviceOrientation = 'portrait' | 'landscape';

const SIDEBAR_WIDTH_KEY = 'artifact-sidebar-width';
const DEFAULT_SIDEBAR_WIDTH = 300;
const MIN_SIDEBAR_WIDTH = 300;
const MIN_CONTENT_WIDTH = 240;
const RESIZE_STEP = 12;
const RESIZE_STEP_FAST = 32;
const RESIZE_HANDLE_WIDTH = 8;

const DEVICE_PRESETS = {
  iphone: { width: 390, height: 844 },
  ipad: { width: 834, height: 1194 },
} as const;

const getStandaloneUrl = (id: string) => {
  const base = import.meta.env.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}artifact/${encodeURIComponent(id)}`;
};

const getArtifactIdFromUrl = (availableIds: string[]) => {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('artifact');
  if (id && availableIds.includes(id)) return id;
  return undefined;
};

const updateArtifactUrl = (id: string | undefined, mode: 'push' | 'replace') => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (id) {
    url.searchParams.set('artifact', id);
  } else {
    url.searchParams.delete('artifact');
  }
  window.history[mode === 'push' ? 'pushState' : 'replaceState']({}, '', url);
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem('artifact-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'system';
  });
  const [selected, setSelected] = useState(() => {
    const ids = artifacts.map((a) => a.id);
    return getArtifactIdFromUrl(ids) ?? artifacts[0]?.id;
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_SIDEBAR_WIDTH;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
    } catch {
      stored = null;
    }
    const parsed = stored ? Number.parseInt(stored, 10) : DEFAULT_SIDEBAR_WIDTH;
    return Number.isFinite(parsed) ? parsed : DEFAULT_SIDEBAR_WIDTH;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [rootFontSize, setRootFontSize] = useState(16);
  const [sizeCopied, setSizeCopied] = useState(false);
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('none');
  const [deviceOrientation, setDeviceOrientation] = useState<DeviceOrientation>('portrait');
  const current = artifacts.find((a) => a.id === selected);
  const layoutRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef<number>(sidebarWidth);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (isDark: boolean) => {
      root.classList.toggle('dark', isDark);
      root.style.colorScheme = isDark ? 'dark' : 'light';
    };

    const resolveDark = () => (theme === 'dark' ? true : theme === 'light' ? false : media.matches);

    applyTheme(resolveDark());

    const handleChange = (event: MediaQueryListEvent) => {
      if (theme === 'system') {
        applyTheme(event.matches);
      }
    };

    if (theme === 'system') {
      if (media.addEventListener) {
        media.addEventListener('change', handleChange);
      } else {
        media.addListener(handleChange);
      }
      window.localStorage.removeItem('artifact-theme');
    } else {
      window.localStorage.setItem('artifact-theme', theme);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ids = artifacts.map((a) => a.id);
    const handlePopState = () => {
      const idFromUrl = getArtifactIdFromUrl(ids) ?? artifacts[0]?.id;
      setSelected(idFromUrl);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const ids = artifacts.map((a) => a.id);
    const urlId = getArtifactIdFromUrl(ids);
    if (selected && selected !== urlId) {
      updateArtifactUrl(selected, 'replace');
    }
  }, [selected]);

  useEffect(() => {
    if (!sizeCopied) return;
    const timeout = window.setTimeout(() => setSizeCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [sizeCopied]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isPreviewActive = devicePreview !== 'none';
    const resolveTarget = () => (isPreviewActive && previewRef.current ? previewRef.current : null) ?? mainRef.current;

    const updateSize = () => {
      const target = resolveTarget();
      if (!target) return;
      const styles = window.getComputedStyle(target);
      const paddingX = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
      const paddingY = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
      const innerWidth = Math.max(0, target.clientWidth - paddingX);
      const innerHeight = Math.max(0, target.clientHeight - paddingY);
      setCanvasSize({ width: innerWidth, height: innerHeight });
      const rootSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize);
      if (Number.isFinite(rootSize)) {
        setRootFontSize(rootSize);
      }
    };

    updateSize();
    const observer = new ResizeObserver(() => updateSize());
    const target = resolveTarget();
    if (target) {
      observer.observe(target);
    }
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [devicePreview]);

  const getClampBounds = useCallback(() => {
    const layoutWidth = layoutRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    const maxByLayout = Math.max(MIN_SIDEBAR_WIDTH, layoutWidth - MIN_CONTENT_WIDTH - RESIZE_HANDLE_WIDTH);
    return {
      min: MIN_SIDEBAR_WIDTH,
      max: maxByLayout,
    };
  }, []);

  const clampWidth = useCallback(
    (value: number) => {
      const { min, max } = getClampBounds();
      return Math.min(Math.max(value, min), max);
    },
    [getClampBounds],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    widthRef.current = sidebarWidth;
    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${sidebarWidth}px`;
    }
    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
    } catch {
      // ignore storage failures
    }
  }, [sidebarWidth]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const nextWidth = clampWidth(widthRef.current);
      widthRef.current = nextWidth;
      if (sidebarRef.current) {
        sidebarRef.current.style.width = `${nextWidth}px`;
      }
      setSidebarWidth(nextWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampWidth]);

  useEffect(() => {
    if (!layoutRef.current) return;
    const nextWidth = clampWidth(widthRef.current);
    widthRef.current = nextWidth;
    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${nextWidth}px`;
    }
    setSidebarWidth(nextWidth);
  }, [clampWidth]);

  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
        dragCleanupRef.current = null;
      }
    };
  }, []);

  const startDrag = (startX: number) => {
    setIsDragging(true);
    const startWidth = widthRef.current;
    const bodyStyle = document.body.style;
    bodyStyle.userSelect = 'none';
    bodyStyle.cursor = 'col-resize';
    if (mainRef.current) {
      mainRef.current.style.pointerEvents = 'none';
    }

    const updateWidth = (clientX: number) => {
      const nextWidth = clampWidth(startWidth + (clientX - startX));
      widthRef.current = nextWidth;
      if (sidebarRef.current) {
        sidebarRef.current.style.width = `${nextWidth}px`;
      }
    };

    const cleanupStyles = () => {
      bodyStyle.userSelect = '';
      bodyStyle.cursor = '';
      if (mainRef.current) {
        mainRef.current.style.pointerEvents = '';
      }
    };

    return { updateWidth, cleanupStyles };
  };

  const handleDragStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const { updateWidth, cleanupStyles } = startDrag(event.clientX);

    const handleMove = (moveEvent: MouseEvent) => {
      updateWidth(moveEvent.clientX);
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      cleanupStyles();
      setIsDragging(false);
      setSidebarWidth(widthRef.current);
      dragCleanupRef.current = null;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    dragCleanupRef.current = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      cleanupStyles();
    };
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    const { updateWidth, cleanupStyles } = startDrag(event.touches[0].clientX);

    const handleMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 1) return;
      updateWidth(moveEvent.touches[0].clientX);
      moveEvent.preventDefault();
    };

    const handleUp = () => {
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
      document.removeEventListener('touchcancel', handleUp);
      cleanupStyles();
      setIsDragging(false);
      setSidebarWidth(widthRef.current);
      dragCleanupRef.current = null;
    };

    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleUp);
    document.addEventListener('touchcancel', handleUp);
    dragCleanupRef.current = () => {
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
      document.removeEventListener('touchcancel', handleUp);
      cleanupStyles();
    };
  };

  const handleHandleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = event.shiftKey ? RESIZE_STEP_FAST : RESIZE_STEP;
    const delta = event.key === 'ArrowRight' ? step : -step;
    const nextWidth = clampWidth(widthRef.current + delta);
    widthRef.current = nextWidth;
    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${nextWidth}px`;
    }
    setSidebarWidth(nextWidth);
  };

  const handleResetWidth = () => {
    const nextWidth = clampWidth(DEFAULT_SIDEBAR_WIDTH);
    widthRef.current = nextWidth;
    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${nextWidth}px`;
    }
    setSidebarWidth(nextWidth);
  };

  const clampBounds = getClampBounds();
  const widthPx = Math.round(canvasSize.width);
  const heightPx = Math.round(canvasSize.height);
  const widthPt = (canvasSize.width * 0.75).toFixed(1);
  const heightPt = (canvasSize.height * 0.75).toFixed(1);
  const widthRem = rootFontSize ? (canvasSize.width / rootFontSize).toFixed(2) : '0.00';
  const heightRem = rootFontSize ? (canvasSize.height / rootFontSize).toFixed(2) : '0.00';
  const sizeLabel = `W ${widthPx}px · ${widthPt}pt · ${widthRem}rem\nH ${heightPx}px · ${heightPt}pt · ${heightRem}rem`;
  const isDevicePreviewActive = devicePreview !== 'none';
  const activePreset = isDevicePreviewActive ? DEVICE_PRESETS[devicePreview] : null;
  const previewWidth = activePreset ? (deviceOrientation === 'portrait' ? activePreset.width : activePreset.height) : 0;
  const previewHeight = activePreset
    ? deviceOrientation === 'portrait'
      ? activePreset.height
      : activePreset.width
    : 0;
  const handleCopySize = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sizeLabel);
      setSizeCopied(true);
    } catch {
      setSizeCopied(false);
    }
  }, [sizeLabel]);

  return (
    <div ref={layoutRef} className="flex min-h-screen bg-white text-gray-900 dark:bg-slate-950 dark:text-slate-100">
      <nav
        ref={sidebarRef}
        style={{ width: sidebarWidth }}
        className="shrink-0 border-r border-gray-200 bg-gray-50 p-4 max-h-screen overflow-y-auto sticky top-0 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2 dark:text-slate-400">
          Controls
        </div>
        <div className="mb-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Theme
          </div>
          <div className="grid w-full grid-cols-3 gap-1">
            <button
              type="button"
              aria-pressed={theme === 'light'}
              onClick={() => setTheme('light')}
              className={[
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                theme === 'light'
                  ? 'border-gray-900 bg-white text-gray-900'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="inline-flex items-center gap-1.5">
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Light</span>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={theme === 'system'}
              onClick={() => setTheme('system')}
              className={[
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                theme === 'system'
                  ? 'border-gray-900 bg-white text-gray-900 dark:border-slate-100 dark:bg-slate-800 dark:text-slate-100'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="inline-flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
                <span>System</span>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={theme === 'dark'}
              onClick={() => setTheme('dark')}
              className={[
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                theme === 'dark'
                  ? 'border-slate-100 bg-slate-800 text-slate-100'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="inline-flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Dark</span>
              </span>
            </button>
          </div>
        </div>
        <div className="mb-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Device Preview
          </div>
          <div className="grid w-full grid-cols-2 gap-1">
            <button
              type="button"
              aria-pressed={devicePreview === 'iphone'}
              onClick={() => setDevicePreview((prev) => (prev === 'iphone' ? 'none' : 'iphone'))}
              className={[
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                devicePreview === 'iphone'
                  ? 'border-gray-900 bg-white text-gray-900 dark:border-slate-100 dark:bg-slate-800 dark:text-slate-100'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                <span>iPhone</span>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={devicePreview === 'ipad'}
              onClick={() => setDevicePreview((prev) => (prev === 'ipad' ? 'none' : 'ipad'))}
              className={[
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                devicePreview === 'ipad'
                  ? 'border-gray-900 bg-white text-gray-900 dark:border-slate-100 dark:bg-slate-800 dark:text-slate-100'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="inline-flex items-center gap-1.5">
                <Tablet className="h-3.5 w-3.5" aria-hidden="true" />
                <span>iPad</span>
              </span>
            </button>
          </div>
          <div className="grid w-full grid-cols-2 gap-1">
            <button
              type="button"
              aria-pressed={deviceOrientation === 'portrait'}
              onClick={() => setDeviceOrientation('portrait')}
              disabled={!isDevicePreviewActive}
              className={[
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                deviceOrientation === 'portrait' && isDevicePreviewActive
                  ? 'border-gray-900 bg-white text-gray-900 dark:border-slate-100 dark:bg-slate-800 dark:text-slate-100'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
                !isDevicePreviewActive ? 'cursor-not-allowed opacity-50' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="inline-flex items-center gap-1.5">
                <RectangleVertical className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Portrait</span>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={deviceOrientation === 'landscape'}
              onClick={() => setDeviceOrientation('landscape')}
              disabled={!isDevicePreviewActive}
              className={[
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                deviceOrientation === 'landscape' && isDevicePreviewActive
                  ? 'border-gray-900 bg-white text-gray-900 dark:border-slate-100 dark:bg-slate-800 dark:text-slate-100'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
                !isDevicePreviewActive ? 'cursor-not-allowed opacity-50' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="inline-flex items-center gap-1.5">
                <RectangleHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Landscape</span>
              </span>
            </button>
          </div>
        </div>
        <div className="my-3 h-px w-full bg-gray-200 dark:bg-slate-800" />
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 dark:text-slate-400">Artifacts</h2>
        <ul className="space-y-1">
          {artifacts.map((a) => (
            <li key={a.id}>
              <div
                className={`w-full rounded text-sm ${
                  selected === a.id
                    ? 'bg-blue-100 text-blue-800 font-medium dark:bg-slate-800 dark:text-slate-100'
                    : 'text-gray-700 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelected(a.id);
                    updateArtifactUrl(a.id, 'push');
                  }}
                  className="w-full text-left px-3 pt-2 pb-1"
                >
                  <div className="flex items-center gap-2">
                    {a.kind === 'app' ? (
                      <Layers className="h-3.5 w-3.5 text-gray-500 dark:text-slate-400" aria-hidden="true" />
                    ) : a.kind === 'single' ? (
                      <Square className="h-3.5 w-3.5 text-gray-500 dark:text-slate-400" aria-hidden="true" />
                    ) : null}
                    <span className="truncate">{a.name}</span>
                  </div>
                  {a.subtitle && (
                    <div className="text-[11px] text-gray-500 truncate mt-0.5 dark:text-slate-400">{a.subtitle}</div>
                  )}
                </button>
                <div className="mt-1 flex items-center gap-2 px-3 pb-2">
                  <div className="flex min-w-0 flex-wrap gap-1.5">
                    {a.model && (
                      <span className="inline-flex items-center border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        {a.model}
                      </span>
                    )}
                    {a.version && (
                      <span className="inline-flex items-center border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        {a.version}
                      </span>
                    )}
                  </div>
                  <a
                    href={getStandaloneUrl(a.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${a.name} standalone`}
                    title="Open standalone view"
                    className={[
                      'ml-auto inline-flex h-7 w-7 items-center justify-center border border-transparent text-gray-500 transition',
                      'hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
                      'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-offset-slate-950',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <SquareArrowOutUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </nav>
      <hr
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={Math.round(clampBounds.max)}
        aria-valuenow={Math.round(sidebarWidth)}
        tabIndex={0}
        onMouseDown={handleDragStart}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleResetWidth}
        onKeyDown={handleHandleKeyDown}
        className={[
          'm-0 h-auto w-2 self-stretch cursor-col-resize border-0 border-r border-gray-200 bg-gray-50 touch-none',
          'hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
          'dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-950',
          isDragging ? 'bg-gray-300 dark:bg-slate-700' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />
      <main
        ref={mainRef}
        className={[
          'relative flex-1 min-w-0 p-6 bg-[repeating-linear-gradient(315deg,#ffffff,#ffffff_8px,#f87171_8px,#f87171_10px)] dark:bg-[repeating-linear-gradient(315deg,#0f172a,#0f172a_8px,#ef4444_8px,#ef4444_10px)]',
          isDevicePreviewActive ? 'flex items-center justify-center' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {canvasSize.width > 0 && (
          <button
            type="button"
            onClick={handleCopySize}
            className="absolute right-4 top-4 rounded border border-gray-200 bg-white/90 px-2 py-1 text-[11px] font-mono text-gray-700 shadow-sm transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label="Copy canvas size"
            title="Copy canvas size"
          >
            <div>{`W ${widthPx}px · ${widthPt}pt · ${widthRem}rem`}</div>
            <div>{`H ${heightPx}px · ${heightPt}pt · ${heightRem}rem`}</div>
            {sizeCopied && <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-600">Copied</div>}
          </button>
        )}
        {current ? (
          isDevicePreviewActive ? (
            <div
              ref={previewRef}
              className="overflow-auto rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950"
              style={{ width: previewWidth, height: previewHeight }}
            >
              <Suspense fallback={<div className="p-4 text-gray-400">Loading…</div>}>
                <current.Component />
              </Suspense>
            </div>
          ) : (
            <Suspense fallback={<div className="text-gray-400">Loading…</div>}>
              <current.Component />
            </Suspense>
          )
        ) : (
          <div className="text-gray-400">Select an artifact</div>
        )}
      </main>
    </div>
  );
}
