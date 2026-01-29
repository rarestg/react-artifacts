import { Layers, Square } from 'lucide-react';
import { type ComponentType, lazy, Suspense, useEffect, useState } from 'react';

type ArtifactMeta = {
  name?: string;
  subtitle?: string;
  kind?: 'single' | 'app';
  model?: string;
  version?: string;
};

const modules = import.meta.glob<{ default: ComponentType }>('./artifacts/*/index.tsx');
const metaModules = import.meta.glob<{ default: ArtifactMeta }>('./artifacts/*/meta.ts', { eager: true });

const artifacts = Object.entries(modules).map(([path, loader]) => {
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
  const current = artifacts.find((a) => a.id === selected);

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

  return (
    <div className="flex min-h-screen bg-white text-gray-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="w-56 shrink-0 border-r border-gray-200 bg-gray-50 p-4 max-h-screen overflow-y-auto sticky top-0 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 dark:text-slate-400">Artifacts</h2>
        <div className="mb-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Theme
          </div>
          <div className="grid grid-cols-3 gap-1">
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
              Light
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
              System
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
              Dark
            </button>
          </div>
        </div>
        <ul className="space-y-1">
          {artifacts.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(a.id);
                  updateArtifactUrl(a.id, 'push');
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  selected === a.id
                    ? 'bg-blue-100 text-blue-800 font-medium dark:bg-slate-800 dark:text-slate-100'
                    : 'text-gray-700 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
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
                {(a.model || a.version) && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
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
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 p-6 bg-[repeating-linear-gradient(315deg,#ffffff,#ffffff_8px,#f87171_8px,#f87171_10px)] dark:bg-[repeating-linear-gradient(315deg,#0f172a,#0f172a_8px,#ef4444_8px,#ef4444_10px)]">
        {current ? (
          <Suspense fallback={<div className="text-gray-400">Loading…</div>}>
            <current.Component />
          </Suspense>
        ) : (
          <div className="text-gray-400">Select an artifact</div>
        )}
      </main>
    </div>
  );
}
