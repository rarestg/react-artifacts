import { ArrowBigUpDash as CapsLockIcon } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { AppHeader } from './components/AppHeader';
import { Button, Panel, Tag } from './components/Primitives';
import { StatCard } from './components/StatCard';
import './theme.css';

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

type StatusTagProps = {
  label: string;
  reserveLabel?: string;
  active?: boolean;
  icon?: ReactNode;
};

function StatusTag({ label, reserveLabel, active = true, icon }: StatusTagProps) {
  const resolvedReserveLabel = reserveLabel ?? label;

  return (
    <span
      className={[
        'inline-flex items-center gap-2 border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] leading-none',
        'transition-[background-color,color,border-color] motion-reduce:transition-none',
        active
          ? 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]'
          : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]',
      ].join(' ')}
    >
      {icon && <span className={`shrink-0 ${active ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{icon}</span>}
      <span
        className={[
          'h-2 w-2 shrink-0 border',
          active ? 'border-[color:var(--success)] bg-[var(--success)]' : 'border-[var(--border-strong)] bg-transparent',
        ].join(' ')}
        aria-hidden="true"
      />
      <span className="relative inline-grid min-w-0">
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          {resolvedReserveLabel}
        </span>
        <span className="col-start-1 row-start-1 min-w-0 truncate">{label}</span>
      </span>
      <span className="sr-only">{active ? 'On' : 'Off'}</span>
    </span>
  );
}

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
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [capsLockSeen, setCapsLockSeen] = useState(false);

  const sessions = useMemo<SessionRow[]>(
    () => [
      { id: 'session-01', title: 'Onboarding flow', updated: '2m ago', status: 'active' },
      { id: 'session-02', title: 'Auth overhaul', updated: '38m ago', status: 'paused' },
      { id: 'session-03', title: 'Tooling review', updated: 'Yesterday', status: 'archived' },
    ],
    [],
  );

  const visibleSessions = view === 'active' ? sessions.filter((row) => row.status === 'active') : sessions;

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

  return (
    <div className="example-app-theme min-h-screen border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
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
            <div className="flex items-center gap-2">
              <Tag variant="muted">Filter</Tag>
              <Button variant={view === 'all' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('all')}>
                All
              </Button>
              <Button variant={view === 'active' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('active')}>
                Active only
              </Button>
            </div>
            <Button variant="default" size="sm">
              New Session
            </Button>
          </div>

          <div className="border border-[var(--border)] divide-y divide-[color:var(--border)] bg-[var(--surface)]">
            {visibleSessions.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setActiveRow(row.id)}
                className={[
                  // Only animate background so divider borders don't flash during list changes.
                  'w-full text-left px-3 py-2.5 flex items-center justify-between gap-4 transition-[background-color] motion-reduce:transition-none cursor-pointer border-l-2',
                  'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-strong)] focus:outline-none focus-visible:bg-[var(--surface-muted)]',
                  // Apply transparent left border only when not selected; prevents utility order from hiding selection.
                  activeRow === row.id
                    ? 'bg-[var(--surface-muted)] border-l-[color:var(--primary)]'
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
      </div>
    </div>
  );
}
