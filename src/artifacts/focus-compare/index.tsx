import { useState } from 'react';

const sampleResults = [
  { title: 'Artifact sync', subtitle: 'queue/worker-02', meta: '00:42' },
  { title: 'Token audit', subtitle: 'ui/compare', meta: '02:18' },
  { title: 'Deploy hook', subtitle: 'pipeline-07', meta: '05:11' },
];

function FocusDemo({ variant }: { variant: 'current' | 'proposed' }) {
  const [value, setValue] = useState('');

  const focusClasses =
    variant === 'current'
      ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1'
      : 'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-600 focus-visible:outline-offset-2';

  const focusClassesDark =
    variant === 'current'
      ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1'
      : 'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-200 focus-visible:outline-offset-2';

  const inputClasses =
    variant === 'current'
      ? 'w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400'
      : 'w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-500 focus-visible:outline-offset-2';

  const chosenRingClasses = variant === 'current' ? 'ring-2 ring-amber-600 ring-offset-1 ring-offset-white' : '';

  return (
    <div className="relative w-full" style={{ '--ring-outset': '3px' } as React.CSSProperties}>
      {variant === 'current' && (
        <span className="pointer-events-none absolute left-0 top-0 -translate-y-[calc(100%+var(--ring-outset)-2px)] -translate-x-[var(--ring-outset)]">
          {/* Label uses ring-inset only; subtract ring thickness (2px) from Y offset to sit flush. */}
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-600 ring-2 ring-inset ring-amber-600">
            CHOSEN
          </span>
        </span>
      )}
      <div
        className={['flex w-full flex-col gap-3 border border-slate-200 bg-white p-4', chosenRingClasses]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {variant === 'current' ? 'Current (ring/shadow)' : 'Proposed (outline)'}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-600" htmlFor={`${variant}-input`}>
            Name
          </label>
          <input
            id={`${variant}-input`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Type to test focus"
            className={`${inputClasses} ${focusClasses}`}
          />
        </div>
        <button
          type="button"
          className={[
            'inline-flex items-center justify-center border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-200',
            variant === 'proposed' ? 'focus-visible:bg-slate-50' : '',
            focusClasses,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          Primary action
        </button>
        <button
          type="button"
          className={[
            'inline-flex items-center justify-center border border-slate-800 bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 active:bg-slate-950',
            focusClassesDark,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          Primary filled
        </button>
      </div>
    </div>
  );
}

function SearchResultsDemo({ variant }: { variant: 'current' | 'proposed' }) {
  const focusClasses =
    variant === 'current'
      ? 'focus:outline-none focus:bg-slate-50'
      : 'focus:outline-none focus-visible:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700 focus-visible:outline-offset-2 focus-visible:border-l-slate-800';

  const chosenRingClasses = variant === 'proposed' ? 'ring-2 ring-amber-600 ring-offset-1 ring-offset-white' : '';

  return (
    <div className="relative w-full" style={{ '--ring-outset': '3px' } as React.CSSProperties}>
      {variant === 'proposed' && (
        <span className="pointer-events-none absolute left-0 top-0 -translate-y-[calc(100%+var(--ring-outset)-2px)] -translate-x-[var(--ring-outset)]">
          {/* Label uses ring-inset only; subtract ring thickness (2px) from Y offset to sit flush. */}
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-600 ring-2 ring-inset ring-amber-600">
            CHOSEN
          </span>
        </span>
      )}
      <div
        className={['flex w-full flex-col gap-3 border border-slate-200 bg-white p-4', chosenRingClasses]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {variant === 'current' ? 'Search rows (current)' : 'Search rows (focus-visible)'}
        </div>
        <p className="text-xs text-slate-500">
          {variant === 'current'
            ? 'Uses focus: background appears for mouse and keyboard, so focus can look active even after clicking.'
            : 'Uses focus-visible: background + outline + left bar only show for keyboard focus, not mouse clicks.'}
        </p>
        <div className="border border-slate-200">
          {sampleResults.map((result, index) => (
            <button
              key={result.title}
              type="button"
              className={[
                'w-full text-left px-3 py-2 flex items-center gap-3 cursor-pointer border-l-2 border-l-transparent',
                'hover:bg-slate-50 active:bg-slate-200',
                index < sampleResults.length - 1 && 'border-b border-slate-100',
                focusClasses,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-800 truncate">{result.title}</div>
                <div className="text-xs text-slate-500 truncate">{result.subtitle}</div>
              </div>
              <div className="text-xs font-mono text-slate-400 tabular-nums">{result.meta}</div>
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500">Use Tab/Shift+Tab to compare keyboard focus.</div>
      </div>
    </div>
  );
}

export default function FocusCompare() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="border border-slate-200 bg-white p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Focus Comparison Demo
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Ring vs Outline Focus</h1>
          <p className="mt-2 text-sm text-slate-600">
            Left is the current ring-based focus styling. Right shows the proposed outline-based focus with no shadows.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FocusDemo variant="current" />
          <FocusDemo variant="proposed" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SearchResultsDemo variant="current" />
          <SearchResultsDemo variant="proposed" />
        </div>
      </div>
    </div>
  );
}
