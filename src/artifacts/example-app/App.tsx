import { ArrowBigUpDash as CapsLockIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import StatusTag from '../../components/StatusTag';
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

const themeSwatches = [
  {
    id: 'accent',
    label: 'Accent',
    weakBg: 'bg-[var(--accent-weak)]',
    strongBg: 'bg-[var(--accent)]',
    text: 'text-[var(--accent)]',
    border: 'border-[color:var(--accent)]',
  },
  {
    id: 'success',
    label: 'Success',
    weakBg: 'bg-[var(--success-weak)]',
    strongBg: 'bg-[var(--success)]',
    text: 'text-[var(--success)]',
    border: 'border-[color:var(--success)]',
  },
  {
    id: 'warning',
    label: 'Warning',
    weakBg: 'bg-[var(--warning-weak)]',
    strongBg: 'bg-[var(--warning)]',
    text: 'text-[var(--warning)]',
    border: 'border-[color:var(--warning)]',
  },
  {
    id: 'danger',
    label: 'Danger',
    weakBg: 'bg-[var(--danger-weak)]',
    strongBg: 'bg-[var(--danger)]',
    text: 'text-[var(--danger)]',
    border: 'border-[color:var(--danger)]',
  },
  {
    id: 'info',
    label: 'Info',
    weakBg: 'bg-[var(--info-weak)]',
    strongBg: 'bg-[var(--info)]',
    text: 'text-[var(--info)]',
    border: 'border-[color:var(--info)]',
  },
] as const;

type ThemeSwatchId = (typeof themeSwatches)[number]['id'];

const categorySwatches = [
  {
    id: 'user',
    label: 'User',
    weakBg: 'bg-[var(--category-blue-weak)]',
    strongBg: 'bg-[var(--category-blue)]',
    text: 'text-[var(--category-blue)]',
    border: 'border-[color:var(--category-blue)]',
  },
  {
    id: 'assistant',
    label: 'Assistant',
    weakBg: 'bg-[var(--category-green-weak)]',
    strongBg: 'bg-[var(--category-green)]',
    text: 'text-[var(--category-green)]',
    border: 'border-[color:var(--category-green)]',
  },
  {
    id: 'thinking',
    label: 'Thinking',
    weakBg: 'bg-[var(--category-amber-weak)]',
    strongBg: 'bg-[var(--category-amber)]',
    text: 'text-[var(--category-amber)]',
    border: 'border-[color:var(--category-amber)]',
  },
  {
    id: 'tool',
    label: 'Tool',
    weakBg: 'bg-[var(--category-violet-weak)]',
    strongBg: 'bg-[var(--category-violet)]',
    text: 'text-[var(--category-violet)]',
    border: 'border-[color:var(--category-violet)]',
  },
  {
    id: 'critical',
    label: 'Critical',
    weakBg: 'bg-[var(--category-red-weak)]',
    strongBg: 'bg-[var(--category-red)]',
    text: 'text-[var(--category-red)]',
    border: 'border-[color:var(--category-red)]',
  },
] as const;

type CategorySwatchId = (typeof categorySwatches)[number]['id'];

export default function ExampleApp() {
  const [activeRow, setActiveRow] = useState<string>('session-01');
  const [view, setView] = useState<'all' | 'active'>('all');
  const [activeSwatches, setActiveSwatches] = useState<Record<ThemeSwatchId, boolean>>({
    accent: true,
    success: true,
    warning: false,
    danger: false,
    info: false,
  });
  const [activeCategorySwatches, setActiveCategorySwatches] = useState<Record<CategorySwatchId, boolean>>({
    user: true,
    assistant: true,
    thinking: false,
    tool: true,
    critical: false,
  });
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
    <ArtifactThemeRoot className="min-h-screen border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
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
                  className={[
                    'h-8 px-2 text-xs font-medium transition-colors motion-reduce:transition-none',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
                    'relative focus-visible:z-10',
                    view === 'all'
                      ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  All
                </button>
                <button
                  type="button"
                  aria-pressed={view === 'active'}
                  onClick={() => setView('active')}
                  className={[
                    'h-8 px-2 text-xs font-medium transition-colors motion-reduce:transition-none',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
                    'relative focus-visible:z-10',
                    view === 'active'
                      ? 'bg-[var(--accent-weak)] text-[var(--accent)]'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
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
                className={[
                  // Only animate background so divider borders don't flash during list changes.
                  'w-full text-left px-3 py-2.5 flex items-center justify-between gap-4 transition-[background-color] motion-reduce:transition-none cursor-pointer border-l-2',
                  'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-strong)] focus:outline-none focus-visible:bg-[var(--surface-strong)]',
                  // Apply transparent left border only when not selected; prevents utility order from hiding selection.
                  activeRow === row.id
                    ? 'bg-[var(--surface-muted)] border-l-[color:var(--accent)]'
                    : 'border-l-transparent',
                ]
                  .filter(Boolean)
                  .join(' ')}
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
            icon={<CapsLockIcon className="h-3.5 w-3.5" />}
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

          <div className="flex flex-wrap gap-2">
            {themeSwatches.map((swatch) => (
              <button
                key={swatch.id}
                type="button"
                aria-pressed={activeSwatches[swatch.id]}
                onClick={() =>
                  setActiveSwatches((prev) => ({
                    ...prev,
                    [swatch.id]: !prev[swatch.id],
                  }))
                }
                className={[
                  'inline-flex items-center gap-2 border px-2 py-1 text-xs font-medium transition-[background-color] motion-reduce:transition-none',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
                  activeSwatches[swatch.id]
                    ? `${swatch.border} ${swatch.weakBg} ${swatch.text}`
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className={`h-2 w-2 border ${swatch.border} ${swatch.strongBg}`} aria-hidden />
                {swatch.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {themeSwatches.map((swatch) => (
              <div
                key={`${swatch.id}-chip`}
                className={`inline-flex items-center gap-2 border ${swatch.border} ${swatch.weakBg} ${swatch.text} px-2 py-1 text-xs font-medium`}
              >
                <span className={`h-2 w-2 ${swatch.strongBg}`} aria-hidden />
                {swatch.label} state
              </div>
            ))}
          </div>
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

          <div className="flex flex-wrap gap-2">
            {categorySwatches.map((swatch) => (
              <button
                key={swatch.id}
                type="button"
                aria-pressed={activeCategorySwatches[swatch.id]}
                onClick={() =>
                  setActiveCategorySwatches((prev) => ({
                    ...prev,
                    [swatch.id]: !prev[swatch.id],
                  }))
                }
                className={[
                  'inline-flex items-center gap-2 border px-2 py-1 text-xs font-medium transition-[background-color] motion-reduce:transition-none',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]',
                  activeCategorySwatches[swatch.id]
                    ? `${swatch.border} ${swatch.weakBg} ${swatch.text}`
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className={`h-2 w-2 border ${swatch.border} ${swatch.strongBg}`} aria-hidden />
                {swatch.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {categorySwatches.map((swatch) => (
              <div
                key={`${swatch.id}-chip`}
                className={`inline-flex items-center gap-2 border ${swatch.border} ${swatch.weakBg} ${swatch.text} px-2 py-1 text-xs font-medium`}
              >
                <span className={`h-2 w-2 ${swatch.strongBg}`} aria-hidden />
                {swatch.label} type
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </ArtifactThemeRoot>
  );
}
