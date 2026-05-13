import { ArrowBigUpDash as CapsLockIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { StatusTag } from '../../components/StatusTag';
import { mergeClassNames } from '../../lib/classNames';
import { AppHeader } from './components/AppHeader';
import { Button, Panel, Tag } from './components/Primitives';
import { StatCard } from './components/StatCard';

type SessionStatus = 'active' | 'paused' | 'archived';

type SessionRow = {
  id: string;
  title: string;
  updated: string;
  status: SessionStatus;
};

type TokenBackgroundClass = `bg-[var(--${string})]`;
type TokenBorderClass = `border-[color:var(--${string})]`;

type ColorSwatchDescriptor<TId extends string = string> = {
  id: TId;
  label: string;
  weakBg: TokenBackgroundClass;
  strongBg: TokenBackgroundClass;
  border: TokenBorderClass;
};

const themeSwatches = [
  {
    id: 'accent',
    label: 'Accent',
    weakBg: 'bg-[var(--accent-weak)]',
    strongBg: 'bg-[var(--accent)]',
    border: 'border-[color:var(--accent)]',
  },
  {
    id: 'success',
    label: 'Success',
    weakBg: 'bg-[var(--success-weak)]',
    strongBg: 'bg-[var(--success)]',
    border: 'border-[color:var(--success)]',
  },
  {
    id: 'warning',
    label: 'Warning',
    weakBg: 'bg-[var(--warning-weak)]',
    strongBg: 'bg-[var(--warning)]',
    border: 'border-[color:var(--warning)]',
  },
  {
    id: 'info',
    label: 'Info',
    weakBg: 'bg-[var(--info-weak)]',
    strongBg: 'bg-[var(--info)]',
    border: 'border-[color:var(--info)]',
  },
  {
    id: 'danger',
    label: 'Danger',
    weakBg: 'bg-[var(--danger-weak)]',
    strongBg: 'bg-[var(--danger)]',
    border: 'border-[color:var(--danger)]',
  },
] as const satisfies readonly ColorSwatchDescriptor[];

type ThemeSwatchId = (typeof themeSwatches)[number]['id'];

const categorySwatches = [
  {
    id: 'user',
    label: 'User',
    weakBg: 'bg-[var(--category-blue-weak)]',
    strongBg: 'bg-[var(--category-blue)]',
    border: 'border-[color:var(--category-blue)]',
  },
  {
    id: 'assistant',
    label: 'Assistant',
    weakBg: 'bg-[var(--category-green-weak)]',
    strongBg: 'bg-[var(--category-green)]',
    border: 'border-[color:var(--category-green)]',
  },
  {
    id: 'thinking',
    label: 'Thinking',
    weakBg: 'bg-[var(--category-amber-weak)]',
    strongBg: 'bg-[var(--category-amber)]',
    border: 'border-[color:var(--category-amber)]',
  },
  {
    id: 'tool',
    label: 'Tool',
    weakBg: 'bg-[var(--category-violet-weak)]',
    strongBg: 'bg-[var(--category-violet)]',
    border: 'border-[color:var(--category-violet)]',
  },
  {
    id: 'critical',
    label: 'Critical',
    weakBg: 'bg-[var(--category-red-weak)]',
    strongBg: 'bg-[var(--category-red)]',
    border: 'border-[color:var(--category-red)]',
  },
  {
    id: 'system',
    label: 'System',
    weakBg: 'bg-[var(--category-cyan-weak)]',
    strongBg: 'bg-[var(--category-cyan)]',
    border: 'border-[color:var(--category-cyan)]',
  },
  {
    id: 'note',
    label: 'Note',
    weakBg: 'bg-[var(--category-pink-weak)]',
    strongBg: 'bg-[var(--category-pink)]',
    border: 'border-[color:var(--category-pink)]',
  },
  {
    id: 'marker',
    label: 'Marker',
    weakBg: 'bg-[var(--category-lime-weak)]',
    strongBg: 'bg-[var(--category-lime)]',
    border: 'border-[color:var(--category-lime)]',
  },
] as const satisfies readonly ColorSwatchDescriptor[];

type CategorySwatchId = (typeof categorySwatches)[number]['id'];

type ActivePreviewSwatches = {
  theme: Record<ThemeSwatchId, boolean>;
  category: Record<CategorySwatchId, boolean>;
};

const initialActivePreviewSwatches: ActivePreviewSwatches = {
  theme: {
    accent: true,
    success: true,
    warning: false,
    info: false,
    danger: false,
  },
  category: {
    user: true,
    assistant: true,
    thinking: false,
    tool: true,
    critical: false,
    system: true,
    note: false,
    marker: false,
  },
};

type SwatchToggleProps<TId extends string> = {
  swatch: ColorSwatchDescriptor<TId>;
  active: boolean;
  onToggle: (id: TId) => void;
};

function SwatchToggle<TId extends string>({ swatch, active, onToggle }: SwatchToggleProps<TId>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onToggle(swatch.id)}
      className={mergeClassNames(
        'inline-flex items-center gap-2 border px-2 py-1 text-xs font-medium transition-[background-color] motion-reduce:transition-none cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
        active
          ? `${swatch.border} ${swatch.weakBg} text-[var(--text)]`
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
      )}
    >
      <span className={`h-2 w-2 border ${swatch.border} ${swatch.strongBg}`} aria-hidden="true" />
      {swatch.label}
    </button>
  );
}

type SwatchStateChipProps<TId extends string> = {
  swatch: ColorSwatchDescriptor<TId>;
  suffix: string;
};

function SwatchStateChip<TId extends string>({ swatch, suffix }: SwatchStateChipProps<TId>) {
  return (
    <div
      className={`inline-flex items-center gap-2 border ${swatch.border} ${swatch.weakBg} px-2 py-1 text-xs font-medium text-[var(--text)]`}
    >
      <span className={`h-2 w-2 ${swatch.strongBg}`} aria-hidden="true" />
      {swatch.label} {suffix}
    </div>
  );
}

type SwatchPreviewGroupProps<TId extends string> = {
  swatches: readonly ColorSwatchDescriptor<TId>[];
  activeSwatches: Record<TId, boolean>;
  onToggleSwatch: (id: TId) => void;
  chipSuffix: string;
};

function SwatchPreviewGroup<TId extends string>({
  swatches,
  activeSwatches,
  onToggleSwatch,
  chipSuffix,
}: SwatchPreviewGroupProps<TId>) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {swatches.map((swatch) => (
          <SwatchToggle key={swatch.id} swatch={swatch} active={activeSwatches[swatch.id]} onToggle={onToggleSwatch} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {swatches.map((swatch) => (
          <SwatchStateChip key={`${swatch.id}-chip`} swatch={swatch} suffix={chipSuffix} />
        ))}
      </div>
    </>
  );
}

export default function ExampleApp() {
  const [activeRow, setActiveRow] = useState<string>('session-01');
  const [view, setView] = useState<'all' | 'active'>('all');
  const [activePreviewSwatches, setActivePreviewSwatches] =
    useState<ActivePreviewSwatches>(initialActivePreviewSwatches);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [capsLockSeen, setCapsLockSeen] = useState(false);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const sessions = useMemo<SessionRow[]>(
    () => [
      { id: 'session-01', title: 'Onboarding flow', updated: '2m ago', status: 'active' },
      { id: 'session-02', title: 'Auth overhaul', updated: '38m ago', status: 'paused' },
      { id: 'session-03', title: 'Tooling review', updated: 'Yesterday', status: 'archived' },
    ],
    [],
  );

  const visibleSessions = view === 'active' ? sessions.filter((row) => row.status === 'active') : sessions;
  const lastVisibleIndex = visibleSessions.length - 1;
  const handleThemeSwatchToggle = (id: ThemeSwatchId) => {
    setActivePreviewSwatches((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [id]: !prev.theme[id],
      },
    }));
  };
  const handleCategorySwatchToggle = (id: CategorySwatchId) => {
    setActivePreviewSwatches((prev) => ({
      ...prev,
      category: {
        ...prev.category,
        [id]: !prev.category[id],
      },
    }));
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleKeyEvent = (event: KeyboardEvent) => {
      setCapsLockSeen(true);
      setCapsLockActive(event.getModifierState('CapsLock'));
    };

    window.addEventListener('keydown', handleKeyEvent);
    window.addEventListener('keyup', handleKeyEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyEvent);
      window.removeEventListener('keyup', handleKeyEvent);
    };
  }, []);

  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, visibleSessions.length);
  }, [visibleSessions.length]);

  const handleRowKeyDown = (index: number, event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (lastVisibleIndex < 0) {
      return;
    }

    let nextIndex = index;
    let handled = true;

    switch (event.key) {
      case 'ArrowUp':
        nextIndex = Math.max(0, index - 1);
        break;
      case 'ArrowDown':
        nextIndex = Math.min(lastVisibleIndex, index + 1);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = lastVisibleIndex;
        break;
      default:
        handled = false;
        break;
    }

    if (!handled) {
      return;
    }

    // Prevent page scrolling for handled navigation keys, even at list boundaries.
    event.preventDefault();
    if (nextIndex !== index) {
      rowRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <ArtifactThemeRoot className="min-h-screen border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text)]">
      <AppHeader
        title="Example App Artifact"
        subtitle="A multi-file artifact (App.tsx + components/) rendered by the shell"
        status="State: Ready"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Artifacts" value={12} helper="Active in this workspace" />
          <StatCard label="Sessions" value={visibleSessions.length} helper="Visible rows" />
          <StatCard label="Errors" value={<span className="text-[var(--success)]">0</span>} helper="Last 24 hours" />
        </div>

        <Panel className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Session filter
              </div>
              <fieldset
                aria-label="Session filter"
                className="inline-flex border border-[var(--border-strong)] divide-x divide-[color:var(--border)]"
              >
                <button
                  type="button"
                  aria-pressed={view === 'all'}
                  onClick={() => setView('all')}
                  className={mergeClassNames(
                    'h-8 px-2 text-xs font-medium transition-colors motion-reduce:transition-none cursor-pointer',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
                    'relative focus-visible:z-10',
                    view === 'all'
                      ? 'bg-[var(--accent-weak)] text-[var(--accent-text)]'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]',
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  aria-pressed={view === 'active'}
                  onClick={() => setView('active')}
                  className={mergeClassNames(
                    'h-8 px-2 text-xs font-medium transition-colors motion-reduce:transition-none cursor-pointer',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
                    'relative focus-visible:z-10',
                    view === 'active'
                      ? 'bg-[var(--accent-weak)] text-[var(--accent-text)]'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]',
                  )}
                >
                  Active only
                </button>
              </fieldset>
            </div>
            <Button variant="default" size="sm">
              New Session
            </Button>
          </div>

          {/* Exception: keep inner border to clearly frame the scan-first session rows within the panel. */}
          <div className="border border-[var(--border)] divide-y divide-[color:var(--border)] bg-[var(--surface)]">
            {visibleSessions.map((row, index) => (
              <button
                key={row.id}
                ref={(node) => {
                  rowRefs.current[index] = node;
                }}
                type="button"
                onClick={() => setActiveRow(row.id)}
                onKeyDown={(event) => handleRowKeyDown(index, event)}
                className={mergeClassNames(
                  // Only animate background so divider borders don't flash during list changes.
                  'w-full text-left px-3 py-2.5 flex items-center justify-between gap-4 transition-[background-color] motion-reduce:transition-none cursor-pointer border-l-2',
                  'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-strong)] focus:outline-none focus-visible:bg-[var(--surface-strong)]',
                  // Apply transparent left border only when not selected; prevents utility order from hiding selection.
                  activeRow === row.id
                    ? 'bg-[var(--surface-muted)] border-l-[color:var(--accent)]'
                    : 'border-l-transparent',
                )}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--text)] truncate">{row.title}</div>
                  <div className="text-xs text-[var(--text-muted)]">Updated {row.updated}</div>
                </div>
                <Tag variant={row.status === 'active' ? 'solid' : 'base'} className="tabular-nums">
                  {row.status}
                </Tag>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Status Tag
              </div>
              <div className="text-sm font-medium text-[var(--text)]">Caps Lock indicator</div>
            </div>
            <Tag variant="muted" className="font-mono">
              Live
            </Tag>
          </div>
          <StatusTag
            label={capsLockActive ? 'Caps Lock on' : 'Caps Lock off'}
            reserveLabel="Caps Lock off"
            active={capsLockActive}
            icon={<CapsLockIcon className="size-3.5" />}
          />
          <div className="text-xs text-[var(--text-muted)]">
            {capsLockSeen ? 'Caps Lock state detected.' : 'Press any key to detect state.'}
          </div>
        </Panel>

        <Panel className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Theme Colors
              </div>
              <div className="text-sm font-medium text-[var(--text)]">Accent + status palette preview</div>
            </div>
            <Tag variant="muted" className="font-mono">
              Light / Dark
            </Tag>
          </div>

          <SwatchPreviewGroup
            swatches={themeSwatches}
            activeSwatches={activePreviewSwatches.theme}
            onToggleSwatch={handleThemeSwatchToggle}
            chipSuffix="state"
          />
        </Panel>

        <Panel className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Message Colors
              </div>
              <div className="text-sm font-medium text-[var(--text)]">Categorical palette preview</div>
            </div>
            <Tag variant="muted" className="font-mono">
              Light / Dark
            </Tag>
          </div>

          <SwatchPreviewGroup
            swatches={categorySwatches}
            activeSwatches={activePreviewSwatches.category}
            onToggleSwatch={handleCategorySwatchToggle}
            chipSuffix="type"
          />
        </Panel>
      </div>
    </ArtifactThemeRoot>
  );
}
