import { type ReactNode, useState } from 'react';

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

function CompareCard({
  variant,
  title,
  description,
  children,
}: {
  variant: 'current' | 'compliant';
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const label = variant === 'current' ? 'Current' : 'Compliant';
  const labelTone = variant === 'current' ? 'text-slate-500' : 'text-emerald-600';

  return (
    <div className="border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</div>
        <div className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${labelTone}`}>{label}</div>
      </div>
      {description && <p className="text-xs text-slate-500">{description}</p>}
      {children}
    </div>
  );
}

function SearchOptionFocusCompare({ variant }: { variant: 'current' | 'compliant' }) {
  const focusClasses =
    variant === 'current'
      ? 'focus:outline-none focus:bg-slate-50'
      : 'focus:outline-none focus-visible:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700 focus-visible:outline-offset-2 focus-visible:border-l-slate-800';

  return (
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
  );
}

function PopoverItemFocusCompare({ variant }: { variant: 'current' | 'compliant' }) {
  const itemFocus =
    variant === 'current'
      ? 'focus:outline-none'
      : 'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400 focus-visible:outline-offset-2 focus-visible:bg-slate-50';

  return (
    <div className="border border-slate-200 bg-white">
      {['Edit', 'Duplicate', 'Delete'].map((label, index) => (
        <button
          key={label}
          type="button"
          className={[
            'w-full text-left px-3 py-2 text-sm cursor-pointer',
            label === 'Delete'
              ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
              : 'text-slate-700 hover:bg-slate-50 active:bg-slate-200',
            index < 2 && 'border-b border-slate-100',
            itemFocus,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ToolCallToggleCompare({ variant }: { variant: 'current' | 'compliant' }) {
  const buttonFocus =
    variant === 'current'
      ? 'focus:outline-none'
      : 'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white';

  return (
    <div className="border border-slate-200 bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Tool Call</span>
          <span className="font-mono text-[11px] text-slate-500">bash</span>
        </div>
        <button
          type="button"
          aria-label="Toggle tool call details"
          className={[
            'inline-flex items-center justify-center w-6 h-6 text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200',
            buttonFocus,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          &gt;
        </button>
      </div>
      <div className="px-3 py-2 text-xs text-slate-500">Details panel…</div>
    </div>
  );
}

function RenderToggleCompare({ variant }: { variant: 'current' | 'compliant' }) {
  const buttonFocus =
    variant === 'current'
      ? 'focus:outline-none'
      : 'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white';

  return (
    <div className="border border-slate-200 bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
        <div className="text-xs font-semibold text-slate-700">Assistant</div>
        <button
          type="button"
          className={[
            'px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 cursor-pointer transition-colors',
            buttonFocus,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          Rendered
        </button>
      </div>
      <div className="px-3 py-2 text-xs text-slate-500">Message content…</div>
    </div>
  );
}

function MessageTypeToggleCompare({ variant }: { variant: 'current' | 'compliant' }) {
  const focusWrapper =
    variant === 'current'
      ? ''
      : 'focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-1 focus-within:ring-offset-white';

  return (
    <label
      className={[
        'flex items-center gap-2 cursor-pointer select-none px-2 py-1 border border-slate-200 bg-white',
        focusWrapper,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="w-3.5 h-3.5 shrink-0 border border-slate-300 flex items-center justify-center">
        <input type="checkbox" className="sr-only" />
      </span>
      <span className="text-xs text-slate-600">Tool Calls</span>
      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 tabular-nums">4</span>
    </label>
  );
}

function CopyableLabelCompare({ variant }: { variant: 'current' | 'compliant' }) {
  const groupFocus =
    variant === 'current'
      ? 'focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white'
      : 'focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white';

  const swapVisibility =
    variant === 'current' ? 'group-hover:opacity-0' : 'group-hover:opacity-0 group-focus-within:opacity-0';

  const showCopy =
    variant === 'current'
      ? 'opacity-0 group-hover:opacity-100'
      : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100';

  return (
    <button
      type="button"
      className={[
        'group inline-flex items-center gap-2 border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600',
        'hover:border-slate-300 hover:bg-slate-50 active:bg-slate-200 cursor-pointer',
        groupFocus,
      ].join(' ')}
    >
      <span className="inline-grid min-w-0">
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          Copied ✓
        </span>
        <span className={`col-start-1 row-start-1 ${swapVisibility}`}>~/projects/codex-manager</span>
        <span className={`col-start-1 row-start-1 ${showCopy}`}>Copy</span>
      </span>
    </button>
  );
}

function IconOnlyButtonCompare({ variant }: { variant: 'current' | 'compliant' }) {
  const buttonFocus =
    variant === 'current'
      ? 'focus:outline-none'
      : 'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white';

  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-label={variant === 'compliant' ? 'Copy to clipboard' : undefined}
        className={[
          'inline-flex items-center justify-center w-8 h-8 border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-200 cursor-pointer',
          buttonFocus,
        ].join(' ')}
      >
        [ ]{variant === 'compliant' && <span className="sr-only">Copy to clipboard</span>}
      </button>
      <div className="text-[10px] text-slate-400">SR label: {variant === 'compliant' ? 'provided' : 'missing'}</div>
    </div>
  );
}

function RingColorCompare({ variant }: { variant: 'current' | 'compliant' }) {
  const ringClasses =
    variant === 'current'
      ? 'ring-2 ring-amber-600 ring-offset-1 ring-offset-white'
      : 'ring-2 ring-slate-400 ring-offset-1 ring-offset-white';

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        className={[
          'inline-flex items-center gap-2 border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-700',
          ringClasses,
        ].join(' ')}
      >
        <span className="w-2 h-2 border border-slate-500 bg-white" aria-hidden="true" />
        Selected
      </button>
      <span className="text-xs text-slate-500">Ring color</span>
    </div>
  );
}

function ScrimTokenCompare({ variant }: { variant: 'current' | 'compliant' }) {
  const label = variant === 'current' ? 'bg-slate-900/50' : 'bg-overlay (token)';
  return (
    <div className="border border-slate-200 bg-white p-3 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Modal scrim</div>
      <div className="relative h-20 border border-slate-200 bg-slate-50">
        <div className="absolute inset-0 bg-slate-900/50" />
        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-100">Overlay</div>
      </div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

function ListStructureCompare({ variant }: { variant: 'current' | 'compliant' }) {
  const items = [
    { title: 'Project Setup', meta: '12 messages' },
    { title: 'API Integration', meta: '8 messages' },
    { title: 'Bug Investigation', meta: '24 messages' },
  ];

  if (variant === 'current') {
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="border border-slate-200 bg-white px-3 py-2 flex items-center justify-between"
          >
            <span className="text-sm text-slate-700">{item.title}</span>
            <span className="text-xs text-slate-400">{item.meta}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-slate-200 bg-white divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.title} className="px-3 py-2 flex items-center justify-between">
          <span className="text-sm text-slate-700">{item.title}</span>
          <span className="text-xs text-slate-400">{item.meta}</span>
        </div>
      ))}
    </div>
  );
}

function SpacingMixCompare({ variant }: { variant: 'current' | 'compliant' }) {
  if (variant === 'current') {
    return (
      <div className="space-y-2 border border-slate-200 bg-white p-3">
        <div className="text-xs text-slate-600">Header</div>
        <div className="text-xs text-slate-500 mt-3">Meta block (extra mt)</div>
        <div className="text-xs text-slate-500">Footer</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-600">Header</div>
      <div className="text-xs text-slate-500">Meta block (gap controls spacing)</div>
      <div className="text-xs text-slate-500">Footer</div>
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

        <div className="border border-slate-200 bg-white p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Style-Guide Audit Visuals
          </div>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Current vs Compliant</h2>
          <p className="mt-2 text-sm text-slate-600">
            Each row mirrors a specific audit item. Left shows the current behavior; right shows a compliant version.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompareCard
            variant="current"
            title="Search options focus"
            description="Current uses focus (mouse + keyboard), no focus-visible ring."
          >
            <SearchOptionFocusCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="Search options focus"
            description="Focus-visible styling with outline + left bar for keyboard focus."
          >
            <SearchOptionFocusCompare variant="compliant" />
          </CompareCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompareCard
            variant="current"
            title="Popover menu items"
            description="Hover/active only, no focus-visible state."
          >
            <PopoverItemFocusCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="Popover menu items"
            description="Keyboard focus-visible outline + background."
          >
            <PopoverItemFocusCompare variant="compliant" />
          </CompareCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompareCard
            variant="current"
            title="Tool call toggle"
            description="Icon-only toggle lacks focus-visible styling."
          >
            <ToolCallToggleCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="Tool call toggle"
            description="Icon-only toggle includes focus-visible ring and aria-label."
          >
            <ToolCallToggleCompare variant="compliant" />
          </CompareCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompareCard
            variant="current"
            title="Render toggle button"
            description="Render toggle has hover/active but no focus-visible state."
          >
            <RenderToggleCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="Render toggle button"
            description="Focus-visible ring added for keyboard visibility."
          >
            <RenderToggleCompare variant="compliant" />
          </CompareCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompareCard
            variant="current"
            title="Message type toggle"
            description="Hidden checkbox lacks focus-within styling on visible wrapper."
          >
            <MessageTypeToggleCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="Message type toggle"
            description="Wrapper shows focus-within ring when checkbox is focused."
          >
            <MessageTypeToggleCompare variant="compliant" />
          </CompareCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompareCard
            variant="current"
            title="Copyable label hover/focus"
            description="Copy label shows on hover only (keyboard focus misses it)."
          >
            <CopyableLabelCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="Copyable label hover/focus"
            description="Copy label shows on hover and focus-within."
          >
            <CopyableLabelCompare variant="compliant" />
          </CompareCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompareCard
            variant="current"
            title="Icon-only button label"
            description="No accessible label on icon-only action."
          >
            <IconOnlyButtonCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="Icon-only button label"
            description="aria-label + sr-only text provided."
          >
            <IconOnlyButtonCompare variant="compliant" />
          </CompareCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompareCard
            variant="current"
            title="Ring color consistency"
            description="Amber ring for selection conflicts with single ring color rule."
          >
            <RingColorCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="Ring color consistency"
            description="Use the shared ring color for selected focus states."
          >
            <RingColorCompare variant="compliant" />
          </CompareCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompareCard
            variant="current"
            title="Modal scrim token"
            description="Scrim color is hardcoded (visual same)."
          >
            <ScrimTokenCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="Modal scrim token"
            description="Scrim uses a named token (visual same)."
          >
            <ScrimTokenCompare variant="compliant" />
          </CompareCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompareCard
            variant="current"
            title="List structure"
            description="Stacked bordered panels with gaps for repeated items."
          >
            <ListStructureCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="List structure"
            description="Single list container with dividers for scan-first rows."
          >
            <ListStructureCompare variant="compliant" />
          </CompareCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompareCard variant="current" title="Spacing rhythm" description="Mixed parent spacing and child margins.">
            <SpacingMixCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="Spacing rhythm"
            description="Single spacing system (parent gap only)."
          >
            <SpacingMixCompare variant="compliant" />
          </CompareCard>
        </div>
      </div>
    </div>
  );
}
