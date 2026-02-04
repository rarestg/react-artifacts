import { ChevronRight } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Checkbox } from '../../components/Checkbox';
import { CopyableLabel } from '../../components/CopyableLabel';
import { Toggle } from '../../components/Toggle';
import { useRovingFocus } from '../../hooks/useRovingFocus';

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

  const chosenRingClasses = variant === 'current' ? 'decision-ring' : '';

  return (
    <div className="decision-frame decision-theme-amber">
      {variant === 'current' && (
        <span className="decision-badge">
          {/* Label uses ring-inset only; subtract ring thickness (2px) from Y offset to sit flush. */}
          <span className="decision-badge-label">CHOSEN</span>
        </span>
      )}
      <div
        className={['flex w-full flex-col gap-3 border border-slate-200 bg-white p-4', chosenRingClasses]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {variant === 'current' ? 'Current (ring)' : 'Proposed (outline)'}
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
  const [selectedIndex, setSelectedIndex] = useState(1);
  const roving = useRovingFocus({ count: sampleResults.length });
  const focusClasses =
    variant === 'current' ? 'focus:outline-none focus:bg-slate-50' : 'focus:outline-none focus-visible:bg-slate-200';

  const chosenRingClasses = variant === 'proposed' ? 'decision-ring' : '';

  return (
    <div className="decision-frame decision-theme-amber">
      {variant === 'proposed' && (
        <span className="decision-badge">
          {/* Label uses ring-inset only; subtract ring thickness (2px) from Y offset to sit flush. */}
          <span className="decision-badge-label">CHOSEN</span>
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
            : 'Uses focus-visible: stronger background only for keyboard focus. Left bar reserved for selection.'}
        </p>
        <div className="text-[11px] text-slate-500">
          Row 2 = selected (left bar). Use Tab/Shift+Tab or Arrow keys to move focus between rows.
        </div>
        <div className="border border-slate-200">
          {sampleResults.map((result, index) => (
            <button
              key={result.title}
              {...roving.getItemProps(index)}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={[
                'w-full text-left px-3 py-2 flex items-center gap-3 cursor-pointer border-l-2',
                index === selectedIndex ? 'border-l-slate-800 bg-slate-50' : 'border-l-transparent',
                'hover:bg-slate-50 active:bg-slate-100',
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
  badge,
  badgeTone,
  className,
  children,
}: {
  variant: 'current' | 'compliant';
  title: string;
  description?: string;
  badge?: string;
  badgeTone?: string;
  className?: string;
  children: ReactNode;
}) {
  const label = badge ?? (variant === 'current' ? 'Current' : 'Compliant');
  const labelTone = badgeTone ?? (variant === 'current' ? 'text-slate-500' : 'text-emerald-600');

  return (
    <div className={['border border-slate-200 bg-white p-4 space-y-3', className].filter(Boolean).join(' ')}>
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</div>
        <div className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${labelTone}`}>{label}</div>
      </div>
      {description && <p className="text-xs text-slate-500">{description}</p>}
      {children}
    </div>
  );
}

function NotesCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-slate-200 bg-white p-4 space-y-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</div>
      <div className="text-xs text-slate-600 space-y-2">{children}</div>
    </div>
  );
}

function SearchOptionFocusCompare({ variant }: { variant: 'current' | 'compliant' }) {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const roving = useRovingFocus({ count: sampleResults.length });
  const focusClasses =
    variant === 'current' ? 'focus:outline-none focus:bg-slate-50' : 'focus:outline-none focus-visible:bg-slate-200';

  return (
    <div className="border border-slate-200">
      {sampleResults.map((result, index) => (
        <button
          key={result.title}
          {...roving.getItemProps(index)}
          type="button"
          onClick={() => setSelectedIndex(index)}
          className={[
            'w-full text-left px-3 py-2 flex items-center gap-3 cursor-pointer border-l-2',
            index === selectedIndex ? 'border-l-slate-800 bg-slate-50' : 'border-l-transparent',
            'hover:bg-slate-50 active:bg-slate-100',
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

function PopoverItemFocusCompare({ variant }: { variant: 'current' | 'compliant' | 'stacking' }) {
  const items = ['Edit', 'Duplicate', 'Delete'];
  const roving = useRovingFocus({ count: items.length });
  const getItemStates = (label: string) => {
    const isDelete = label === 'Delete';
    if (variant === 'stacking') {
      return isDelete
        ? 'text-red-600 hover:bg-red-100 focus-visible:bg-red-100 hover:focus-visible:bg-red-200 active:bg-red-200'
        : 'text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 hover:focus-visible:bg-slate-200 active:bg-slate-200';
    }
    if (variant === 'compliant') {
      return isDelete
        ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-200 active:bg-red-300'
        : 'text-slate-700 hover:bg-slate-50 focus-visible:bg-slate-200 active:bg-slate-300';
    }
    return isDelete
      ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
      : 'text-slate-700 hover:bg-slate-50 active:bg-slate-200';
  };

  return (
    <div className="border border-slate-200 bg-white">
      {items.map((label, index) => (
        <button
          key={label}
          {...roving.getItemProps(index)}
          type="button"
          className={[
            'w-full text-left px-3 py-2 text-sm cursor-pointer focus:outline-none',
            getItemStates(label),
            index < 2 && 'border-b border-slate-100',
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
  const buttonSize = variant === 'current' ? 'w-6 h-6' : 'w-7 h-7';

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
            'inline-flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200',
            buttonSize,
            buttonFocus,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
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
  const [currentEnabled, setCurrentEnabled] = useState(false);
  const [toolCallsContained, setToolCallsContained] = useState(false);
  const [toolCallsBare, setToolCallsBare] = useState(false);
  const [streamingContained, setStreamingContained] = useState(false);
  const [streamingBare, setStreamingBare] = useState(false);

  if (variant === 'current') {
    return (
      <div className="flex flex-col gap-2">
        <button
          className={[
            'flex h-8 items-center gap-2 cursor-pointer select-none px-2 py-1 border border-slate-200 bg-white transition-colors rounded-none focus:outline-none',
            'hover:bg-slate-50 active:bg-slate-100',
          ]
            .filter(Boolean)
            .join(' ')}
          type="button"
          aria-pressed={currentEnabled}
          onClick={() => setCurrentEnabled((prev) => !prev)}
        >
          <span
            aria-hidden="true"
            className={[
              'w-3.5 h-3.5 shrink-0 border transition-colors',
              currentEnabled ? 'border-slate-800 bg-slate-800' : 'border-slate-300 bg-white',
            ].join(' ')}
          />
          <span className="text-xs text-slate-600">Tool Calls</span>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 tabular-nums">4</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Checkbox
        label="Tool Calls"
        reserveLabel="Tool Calls"
        checked={toolCallsContained}
        onCheckedChange={setToolCallsContained}
        focusTarget="container"
        className={[
          'w-full h-8 gap-2 border border-slate-200 bg-white rounded-none px-2 py-1',
          'hover:bg-slate-50 active:bg-slate-100',
        ].join(' ')}
        labelClassName="text-xs text-slate-600"
        suffix={
          <span className="ml-auto text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 tabular-nums">
            4
          </span>
        }
      />
      <Checkbox
        label="Tool Calls"
        reserveLabel="Tool Calls"
        checked={toolCallsBare}
        onCheckedChange={setToolCallsBare}
        labelClassName="text-xs text-slate-600"
      />
      <Toggle
        label="Streaming"
        reserveLabel="Streaming"
        checked={streamingContained}
        onCheckedChange={setStreamingContained}
        focusTarget="container"
        className={[
          'gap-2 border border-slate-200 bg-white px-2 py-1 rounded-none h-8',
          'hover:bg-slate-50 active:bg-slate-100',
        ].join(' ')}
        labelClassName="text-xs text-slate-600"
      />
      <Toggle
        label="Streaming"
        reserveLabel="Streaming"
        checked={streamingBare}
        onCheckedChange={setStreamingBare}
        className="gap-2"
        labelClassName="text-xs text-slate-600"
      />
    </div>
  );
}

function CopyableLabelCompare({ variant }: { variant: 'current' | 'compliant' }) {
  if (variant === 'current') {
    return <CopyableLabel value="~/projects/codex-manager" hoverLabel="Copy" showHoverOnFocus={false} />;
  }

  return <CopyableLabel value="~/projects/codex-manager" hoverLabel="Copy" />;
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
      : 'ring-2 ring-[color:var(--ring,#94a3b8)] ring-offset-1 ring-offset-white';

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        className={[
          'inline-flex items-center gap-2 border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-700',
          'rounded-none focus:outline-none',
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
  const overlayClass = variant === 'current' ? 'bg-slate-900/50' : 'bg-[color:var(--overlay,rgba(15,23,42,0.5))]';
  return (
    <div className="border border-slate-200 bg-white p-3 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Modal scrim</div>
      <div className="relative h-20 border border-slate-200 bg-slate-50">
        <div className={['absolute inset-0', overlayClass].join(' ')} />
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

        <div className="border border-slate-200 bg-white p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">State Legend</div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 md:grid-cols-2">
            <div>
              <strong>Hover:</strong> pointer-only highlight; quietest state.
            </div>
            <div>
              <strong>Focus:</strong> keyboard highlight; more prominent than hover.
            </div>
            <div>
              <strong>Active:</strong> pressed state (mouse down / key down) only.
            </div>
            <div>
              <strong>Selected:</strong> persistent state (e.g., left bar).
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <FocusDemo variant="current" />
          <FocusDemo variant="proposed" />
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> Keep ring + offset focus (current).
            </div>
            <div>
              <strong>Rationale:</strong> Outline focus disappears on dark/filled controls; rings remain high-contrast
              and consistent across all surfaces.
            </div>
          </NotesCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SearchResultsDemo variant="current" />
          <SearchResultsDemo variant="proposed" />
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> Left bar indicates selection only; focus uses stronger background.
            </div>
            <div>
              <strong>Rationale:</strong> Selection persists (left bar), focus is transient and more prominent than
              hover, rows are real buttons, and arrow keys (plus Tab) move focus cleanly.
            </div>
            <div>
              <strong>Lesson:</strong> Keep selection and focus distinct; hover is the quietest state.
            </div>
          </NotesCard>
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
            description="Focus-visible uses stronger background; left bar reserved for selection."
          >
            <SearchOptionFocusCompare variant="compliant" />
          </CompareCard>
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> No outlines; focus is a stronger background only.
            </div>
            <div>
              <strong>Why:</strong> Mirrors session rows: selection is left bar, focus is transient, hover is quieter.
            </div>
          </NotesCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
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
            description="Keyboard focus-visible uses stronger background only."
          >
            <PopoverItemFocusCompare variant="compliant" />
          </CompareCard>
          <div className="decision-frame decision-theme-amber">
            <span className="decision-badge">
              <span className="decision-badge-label">CHOSEN</span>
            </span>
            <div className="decision-ring">
              <CompareCard
                variant="compliant"
                badge="Alt"
                badgeTone="text-amber-600"
                title="Popover menu items Alt — Stacking"
                description="Hover + focus share 100; combined hover+focus and active use 200."
              >
                <PopoverItemFocusCompare variant="stacking" />
              </CompareCard>
            </div>
          </div>
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> No outlines; focus is a stronger background only.
            </div>
            <div>
              <strong>Why:</strong> Keyboard + tab nav are first-class; hover stays quieter than focus.
            </div>
            <div>
              <strong>State ramp:</strong> Prefer distinct hover/focus/active colors; if too heavy, collapse focus +
              active.
            </div>
            <div>
              <strong>Discovery:</strong> Best clarity comes from 100/100/200 with hover+focus stacking to 200.
            </div>
          </NotesCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
            description="Icon-only toggle includes focus-visible ring + slightly larger hit target."
          >
            <ToolCallToggleCompare variant="compliant" />
          </CompareCard>
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> Keep icon-only toggle with focus-visible ring + 28px (w-7 h-7) hit target.
            </div>
            <div>
              <strong>Why:</strong> Keyboard focus must be obvious; slightly larger target improves clickability without
              changing layout density. Icon-only controls keep an aria-label.
            </div>
          </NotesCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> Use focus-visible ring on the render toggle; treat it as a real toggle state.
            </div>
            <div>
              <strong>Why:</strong> Keyboard focus must be obvious; if the label swaps (Rendered/Raw), reserve width to
              avoid jitter. Prefer explicit selected state (aria-pressed or segmented control).
            </div>
          </NotesCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <CompareCard
            variant="current"
            title="Message type toggle"
            description="Custom toggle button has hover/active but no focus-visible ring."
          >
            <MessageTypeToggleCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="Message type toggle"
            description="Checkbox rows + canonical Toggle use focus-visible rings for keyboard."
          >
            <MessageTypeToggleCompare variant="compliant" />
          </CompareCard>
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> Use checkbox rows for message-type filters (contained + bare). Use the
              canonical Toggle for true on/off switches (Streaming).
            </div>
            <div>
              <strong>Why:</strong> Checkboxes map cleanly to multi-select filters; toggles map to on/off settings.
              Keyboard-only focus rings stay obvious without sticky mouse rings. Checkbox uses the sharp2 checkmark +
              reserve-label pattern; Toggle keeps sharp2 proportions with explicit geometry vars. Enter toggles for
              parity with Space.
            </div>
            <div>
              <strong>Reminder:</strong> Contained checkbox rows need a peer-focus-visible overlay ring; bare checkboxes
              can keep the ring on the square. Suppress default outlines on wrappers.
            </div>
            <div>
              <strong>Lesson:</strong> Use CSS variables for track/knob/padding/border so the slide distance is
              computed, not hand-tuned. Keep cursor-pointer on standalone toggles.
            </div>
            <div>
              <strong>Note:</strong> For contained rows, standardize height (h-8 or h-9) so checkbox rows and toggle
              rows align visually.
            </div>
          </NotesCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <CompareCard
            variant="current"
            title="Copyable label hover/focus"
            description="Copy label swaps on hover only; keyboard focus keeps the value."
          >
            <CopyableLabelCompare variant="current" />
          </CompareCard>
          <CompareCard
            variant="compliant"
            title="Copyable label hover/focus"
            description="Copy label supports hover + keyboard focus, with copied/failed states."
          >
            <CopyableLabelCompare variant="compliant" />
          </CompareCard>
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> Use a canonical CopyableLabel component with hover + focus-visible affordances.
            </div>
            <div>
              <strong>Why:</strong> Hover-only affordances must appear on keyboard focus. Copy should provide explicit
              copied/failed feedback without layout shift (reserve label overlay).
            </div>
            <div>
              <strong>Note:</strong> Copied/failed states take precedence; hover/focus should not override feedback.
            </div>
            <div>
              <strong>Note:</strong> Reserve label should be the longest of value/copied/failed to prevent jitter.
            </div>
          </NotesCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> Always provide an accessible name for icon-only controls and keep a visible
              focus state.
            </div>
            <div>
              <strong>Why:</strong> Icon-only actions are invisible to assistive tech without a label; use aria-label or
              sr-only text for parity with visible controls (pick one naming method to stay consistent). Prefer native
              buttons so Enter/Space trigger correctly; only Space shows active/pressed styling by default (Enter clicks
              without :active). Use the shared ring token for focus-visible. If the icon represents a toggle/menu, add
              aria-pressed/aria-expanded so semantics match behavior.
            </div>
          </NotesCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> Keep one ring token for focus-visible only; selection uses bars/background.
            </div>
            <div>
              <strong>Why:</strong> A single ring color keeps focus consistent across surfaces. Selection should read as
              persistent state without hijacking the focus affordance. If you see a blue rounded outline, it is the
              browser default focus leaking through—add focus:outline-none and rounded-none to sharp controls.
            </div>
            <div>
              <strong>Note:</strong> If a ring looks like currentColor, the --ring token is undefined; add a fallback in
              classes and make sure each theme file defines --ring.
            </div>
          </NotesCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> Use a named overlay token for the scrim (single allowed translucency).
            </div>
            <div>
              <strong>Why:</strong> Tokens are the contract; keeping the scrim on a token preserves theming and keeps
              the exception explicit.
            </div>
          </NotesCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> Use a single list container with dividers for repeated items.
            </div>
            <div>
              <strong>Why:</strong> Lists should be scan-first; shared containers reduce border fatigue and keep rows
              aligned.
            </div>
          </NotesCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
          <NotesCard title="Notes">
            <div>
              <strong>Decision:</strong> Use one spacing system per stack (parent gap or dividers).
            </div>
            <div>
              <strong>Why:</strong> Single-source spacing avoids drift and makes rhythm adjustments predictable.
            </div>
          </NotesCard>
        </div>
      </div>
    </div>
  );
}
