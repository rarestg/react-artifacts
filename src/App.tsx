import { Tooltip } from '@base-ui/react/tooltip';
import { Monitor, Moon, RectangleHorizontal, RectangleVertical, Smartphone, Sun, Tablet } from 'lucide-react';
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
import { type ArtifactEntry, artifacts } from './artifacts';
import { ArtifactListItem } from './components/ArtifactListItem';
import { HomeIndex } from './components/HomeIndex';
import { mergeClassNames } from './lib/classNames';
import { useCopyToClipboard } from './lib/useCopyToClipboard';
import { formatPageTitle, HOME_TITLE, SITE_TITLE } from './site';

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

// Drop a leftover ?artifact= param that names no known artifact, so home never shows under
// a URL that claims a tool.
const clearUnknownArtifactParam = () => {
  if (typeof window === 'undefined') return;
  if (new URLSearchParams(window.location.search).has('artifact')) {
    updateArtifactUrl(undefined, 'replace');
  }
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem('artifact-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'system';
  });
  // undefined = home index; a string selects that artifact in the workbench.
  const [selected, setSelected] = useState<string | undefined>(() => getArtifactIdFromUrl(artifacts.map((a) => a.id)));
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
  const {
    status: sizeCopyStatus,
    copy: copyCanvasSize,
    announcement: sizeCopyAnnouncement,
  } = useCopyToClipboard({
    resetDelayMs: 1500,
    copiedAnnouncement: 'Copied canvas size to clipboard',
  });
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('none');
  const [deviceOrientation, setDeviceOrientation] = useState<DeviceOrientation>('portrait');
  const current: ArtifactEntry | undefined = artifacts.find((a) => a.id === selected);
  const layoutRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef<number>(sidebarWidth);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const handleSelectArtifact = useCallback((id: string) => {
    setSelected(id);
    updateArtifactUrl(id, 'push');
  }, []);

  const handleHomeClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (selected === undefined) {
      // Already home: normalize a noncanonical URL without stacking a history entry.
      window.history.replaceState({}, '', '/');
      return;
    }
    setSelected(undefined);
    window.history.pushState({}, '', '/');
  };

  useEffect(() => {
    document.title = current ? formatPageTitle(current.name) : HOME_TITLE;
  }, [current]);

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
      const idFromUrl = getArtifactIdFromUrl(ids);
      // Cleanup must happen here: setSelected(undefined → undefined) bails out, so the
      // URL-sync effect never sees an invalid ?artifact= reached via history navigation.
      if (!idFromUrl) clearUnknownArtifactParam();
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
    } else if (!selected) {
      clearUnknownArtifactParam();
    }
  }, [selected]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Home unmounts the preview container, so re-run when the mounted artifact changes and
    // only treat the preview as active while an artifact is on screen.
    const isPreviewActive = devicePreview !== 'none' && current !== undefined;
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
  }, [devicePreview, current]);

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
    document.addEventListener('touchend', handleUp, { passive: true });
    document.addEventListener('touchcancel', handleUp, { passive: true });
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
  const hasCanvasSize = canvasSize.width > 0 && canvasSize.height > 0;
  const widthLabel = hasCanvasSize ? `W ${widthPx}px · ${widthPt}pt · ${widthRem}rem` : 'W --px · --pt · --rem';
  const heightLabel = hasCanvasSize ? `H ${heightPx}px · ${heightPt}pt · ${heightRem}rem` : 'H --px · --pt · --rem';
  const sizeLabel = `W ${widthPx}px · ${widthPt}pt · ${widthRem}rem\nH ${heightPx}px · ${heightPt}pt · ${heightRem}rem`;
  const sizeCopied = sizeCopyStatus === 'copied';
  const sizeCopyFailed = sizeCopyStatus === 'failed';
  const sizeCopyActive = sizeCopyStatus !== 'idle';
  const sizeCopyFeedback = sizeCopied ? 'Copied' : sizeCopyFailed ? 'Failed' : 'Copy';
  // The stored preference survives visiting home, but no preview exists there: buttons
  // render unpressed/disabled and <main> drops the preview layout until an artifact mounts.
  const isDevicePreviewActive = devicePreview !== 'none' && current !== undefined;
  const activePreset = isDevicePreviewActive ? DEVICE_PRESETS[devicePreview] : null;
  const previewWidth = activePreset ? (deviceOrientation === 'portrait' ? activePreset.width : activePreset.height) : 0;
  const previewHeight = activePreset
    ? deviceOrientation === 'portrait'
      ? activePreset.height
      : activePreset.width
    : 0;
  const handleCopySize = useCallback(async () => {
    if (!hasCanvasSize) return;
    await copyCanvasSize(sizeLabel);
  }, [copyCanvasSize, hasCanvasSize, sizeLabel]);

  return (
    <div ref={layoutRef} className="flex min-h-screen bg-white text-gray-900 dark:bg-slate-950 dark:text-slate-100">
      <nav
        ref={sidebarRef}
        style={{ width: sidebarWidth }}
        className="shrink-0 border-r border-gray-200 bg-gray-50 p-4 max-h-screen overflow-y-auto sticky top-0 dark:border-slate-800 dark:bg-slate-900"
      >
        <a
          href="/"
          aria-current={selected === undefined ? 'page' : undefined}
          onClick={handleHomeClick}
          className={mergeClassNames(
            'mb-4 block border-l-2 px-3 py-2 text-sm font-semibold tracking-tight transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-slate-900',
            selected === undefined
              ? 'border-gray-900 bg-white text-gray-900 dark:border-slate-100 dark:bg-slate-800 dark:text-slate-100'
              : 'border-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
          )}
        >
          {SITE_TITLE}
        </a>
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
              className={mergeClassNames(
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                theme === 'light'
                  ? 'border-gray-900 bg-white text-gray-900'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <Sun className="size-3.5" aria-hidden="true" />
                <span>Light</span>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={theme === 'system'}
              onClick={() => setTheme('system')}
              className={mergeClassNames(
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                theme === 'system'
                  ? 'border-gray-900 bg-white text-gray-900 dark:border-slate-100 dark:bg-slate-800 dark:text-slate-100'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <Monitor className="size-3.5" aria-hidden="true" />
                <span>System</span>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={theme === 'dark'}
              onClick={() => setTheme('dark')}
              className={mergeClassNames(
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                theme === 'dark'
                  ? 'border-slate-100 bg-slate-800 text-slate-100'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <Moon className="size-3.5" aria-hidden="true" />
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
              aria-pressed={isDevicePreviewActive && devicePreview === 'iphone'}
              onClick={() => setDevicePreview((prev) => (prev === 'iphone' ? 'none' : 'iphone'))}
              disabled={!current}
              className={mergeClassNames(
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                isDevicePreviewActive && devicePreview === 'iphone'
                  ? 'border-gray-900 bg-white text-gray-900 dark:border-slate-100 dark:bg-slate-800 dark:text-slate-100'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
                !current && 'cursor-not-allowed opacity-50',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="size-3.5" aria-hidden="true" />
                <span>iPhone</span>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={isDevicePreviewActive && devicePreview === 'ipad'}
              onClick={() => setDevicePreview((prev) => (prev === 'ipad' ? 'none' : 'ipad'))}
              disabled={!current}
              className={mergeClassNames(
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                isDevicePreviewActive && devicePreview === 'ipad'
                  ? 'border-gray-900 bg-white text-gray-900 dark:border-slate-100 dark:bg-slate-800 dark:text-slate-100'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
                !current && 'cursor-not-allowed opacity-50',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <Tablet className="size-3.5" aria-hidden="true" />
                <span>iPad</span>
              </span>
            </button>
          </div>
          <div className="grid w-full grid-cols-2 gap-1">
            <button
              type="button"
              aria-pressed={isDevicePreviewActive && deviceOrientation === 'portrait'}
              onClick={() => setDeviceOrientation('portrait')}
              disabled={!isDevicePreviewActive}
              className={mergeClassNames(
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                deviceOrientation === 'portrait' && isDevicePreviewActive
                  ? 'border-gray-900 bg-white text-gray-900 dark:border-slate-100 dark:bg-slate-800 dark:text-slate-100'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
                !isDevicePreviewActive && 'cursor-not-allowed opacity-50',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <RectangleVertical className="size-3.5" aria-hidden="true" />
                <span>Portrait</span>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={isDevicePreviewActive && deviceOrientation === 'landscape'}
              onClick={() => setDeviceOrientation('landscape')}
              disabled={!isDevicePreviewActive}
              className={mergeClassNames(
                'px-2 py-1.5 text-xs font-medium border transition-colors',
                deviceOrientation === 'landscape' && isDevicePreviewActive
                  ? 'border-gray-900 bg-white text-gray-900 dark:border-slate-100 dark:bg-slate-800 dark:text-slate-100'
                  : 'border-transparent text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800',
                !isDevicePreviewActive && 'cursor-not-allowed opacity-50',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <RectangleHorizontal className="size-3.5" aria-hidden="true" />
                <span>Landscape</span>
              </span>
            </button>
          </div>
        </div>
        <div className="mb-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Canvas Size
          </div>
          <button
            type="button"
            onClick={handleCopySize}
            disabled={!hasCanvasSize}
            className={mergeClassNames(
              'group flex w-full flex-col items-center justify-center rounded-md border px-3 py-2.5 text-center transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-50',
              'dark:focus-visible:ring-offset-slate-900',
              sizeCopied
                ? 'cursor-pointer border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                : sizeCopyFailed
                  ? 'cursor-pointer border-red-300 bg-red-50 text-red-700 dark:border-red-500/60 dark:bg-red-950/40 dark:text-red-300'
                  : hasCanvasSize
                    ? 'cursor-pointer border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                    : 'cursor-not-allowed border-gray-200 bg-white text-gray-400 opacity-70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500',
            )}
            aria-label={hasCanvasSize ? `Copy canvas size: ${sizeLabel}` : 'Canvas size unavailable'}
            title={hasCanvasSize ? 'Copy canvas size' : 'Canvas size unavailable'}
          >
            <span className="relative inline-grid min-h-8 min-w-full items-center justify-items-center">
              <span
                className={mergeClassNames(
                  'col-start-1 row-start-1 font-mono text-[11px] leading-4 tabular-nums transition-opacity',
                  hasCanvasSize && 'group-hover:opacity-0 group-focus-visible:opacity-0',
                  sizeCopyActive && 'opacity-0',
                )}
              >
                <span className="block">{widthLabel}</span>
                <span className="block">{heightLabel}</span>
              </span>
              {hasCanvasSize && (
                <span
                  className={mergeClassNames(
                    'col-start-1 row-start-1 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-0 transition-opacity',
                    sizeCopied
                      ? 'text-emerald-700 opacity-100 dark:text-emerald-300'
                      : sizeCopyFailed
                        ? 'text-red-700 opacity-100 dark:text-red-300'
                        : 'text-gray-500 group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-slate-300',
                  )}
                  aria-hidden="true"
                >
                  {sizeCopyFeedback}
                </span>
              )}
            </span>
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {sizeCopyAnnouncement}
            </span>
          </button>
        </div>
        <div className="my-3 h-px w-full bg-gray-200 dark:bg-slate-800" />
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          Artifacts
        </h2>
        <Tooltip.Provider delay={400}>
          <ul className="space-y-1">
            {artifacts.map((a) => (
              <ArtifactListItem key={a.id} artifact={a} selected={selected === a.id} onSelect={handleSelectArtifact} />
            ))}
          </ul>
        </Tooltip.Provider>
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
        className={mergeClassNames(
          'm-0 h-auto w-2 self-stretch cursor-col-resize border-0 border-r border-gray-200 bg-gray-50 touch-none',
          'hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
          'dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-950',
          isDragging && 'bg-gray-300 dark:bg-slate-700',
        )}
      />
      <main
        ref={mainRef}
        className={mergeClassNames(
          'relative flex-1 min-w-0',
          current
            ? 'p-6 bg-[repeating-linear-gradient(315deg,#ffffff,#ffffff_8px,#f87171_8px,#f87171_10px)] dark:bg-[repeating-linear-gradient(315deg,#0f172a,#0f172a_8px,#ef4444_8px,#ef4444_10px)]'
            : 'overflow-y-auto bg-white dark:bg-slate-950',
          isDevicePreviewActive && 'flex items-center justify-center',
        )}
      >
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
          <HomeIndex artifacts={artifacts} onSelectArtifact={handleSelectArtifact} />
        )}
      </main>
    </div>
  );
}
