import { useEffect, useId, useRef, useState } from 'react';

import './theme.css';
import { type ThemeId, themes } from './themes';

const storageKey = 'artifact-theme-example';

const tokenRows = [
  { label: 'Surface', token: '--surface', swatchClass: 'bg-[var(--surface)]' },
  { label: 'Surface Muted', token: '--surface-muted', swatchClass: 'bg-[var(--surface-muted)]' },
  { label: 'Surface Strong', token: '--surface-strong', swatchClass: 'bg-[var(--surface-strong)]' },
  { label: 'Text', token: '--text', swatchClass: 'bg-[var(--text)]' },
  { label: 'Text Muted', token: '--text-muted', swatchClass: 'bg-[var(--text-muted)]' },
  { label: 'Border', token: '--border', swatchClass: 'bg-[var(--border)]' },
  { label: 'Border Strong', token: '--border-strong', swatchClass: 'bg-[var(--border-strong)]' },
  { label: 'Ring', token: '--ring', swatchClass: 'bg-[var(--ring)]' },
  { label: 'Primary', token: '--primary', swatchClass: 'bg-[var(--primary)]' },
  { label: 'Primary Hover', token: '--primary-hover', swatchClass: 'bg-[var(--primary-hover)]' },
  { label: 'Primary Active', token: '--primary-active', swatchClass: 'bg-[var(--primary-active)]' },
  { label: 'Primary Contrast', token: '--primary-contrast', swatchClass: 'bg-[var(--primary-contrast)]' },
  { label: 'Accent', token: '--accent', swatchClass: 'bg-[var(--accent)]' },
  { label: 'Accent Weak', token: '--accent-weak', swatchClass: 'bg-[var(--accent-weak)]' },
] as const;

const semanticSwatches = [
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

const defaultTheme: ThemeId = 'base';

export default function Example() {
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }

    const stored = window.localStorage.getItem(storageKey);
    const match = themes.find((item) => item.id === stored);
    return match?.id ?? defaultTheme;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  const activeTheme = themes.find((item) => item.id === theme) ?? themes[0];
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedIndex = themes.findIndex((item) => item.id === theme);

  useEffect(() => {
    if (!menuOpen) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [menuOpen, selectedIndex]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleThemeSelect = (nextTheme: ThemeId) => {
    setTheme(nextTheme);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const activeItem = activeIndex >= 0 ? themes[activeIndex] : null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setMenuOpen(true);
      setActiveIndex((prev) => {
        if (prev === -1) return selectedIndex >= 0 ? selectedIndex : 0;
        if (event.key === 'ArrowDown') return (prev + 1) % themes.length;
        return (prev - 1 + themes.length) % themes.length;
      });
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (menuOpen && activeItem) {
        handleThemeSelect(activeItem.id);
        return;
      }
      setMenuOpen(true);
    } else if (event.key === 'Escape') {
      setMenuOpen(false);
    } else if (menuOpen && event.key === 'Tab') {
      setMenuOpen(false);
    }
  };

  return (
    <div className="example-theme min-h-screen bg-[var(--surface-muted)] text-[var(--text)]" data-theme={theme}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
        <div className="flex flex-col gap-5 border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Single-file artifact
            </div>
            <h1 className="text-2xl font-semibold">Example Artifact</h1>
            <p className="text-sm text-[var(--text-muted)]">
              This artifact hosts its own theme tokens. The shell theme toggle swaps each theme's light/dark set.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]"
              htmlFor="example-theme"
            >
              Theme
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div ref={dropdownRef} className="relative w-52">
                <button
                  id="example-theme"
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  onKeyDown={handleTriggerKeyDown}
                  aria-haspopup="listbox"
                  aria-expanded={menuOpen}
                  aria-controls={listboxId}
                  className="flex h-9 w-full items-center justify-between gap-2 border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-mono text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
                >
                  <span className="truncate">{activeTheme.label}</span>
                  <span className="text-[var(--text-muted)]">▾</span>
                </button>
                {menuOpen && (
                  <div
                    id={listboxId}
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-10 mt-1 border border-[var(--border)] bg-[var(--surface)]"
                  >
                    {themes.map((item, index) => {
                      const isActive = index === activeIndex;
                      const isSelected = item.id === theme;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onMouseEnter={() => setActiveIndex(index)}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleThemeSelect(item.id)}
                          className={[
                            'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-mono cursor-pointer',
                            'hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)]',
                            isActive && 'bg-[var(--surface-muted)]',
                            isSelected && 'border-l-2 border-l-[var(--accent)] pl-[calc(0.75rem-2px)]',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <span className="truncate">{item.label}</span>
                          {isSelected && (
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">On</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-mono text-[var(--text-muted)]">
                active: {activeTheme.label}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Preview</div>

          <div className="flex flex-col gap-3 border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold">Deployment Queue</div>
              <div className="border border-[var(--accent)] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)]">
                Active
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Accent, border, and muted surfaces are pulled from theme variables; dark mode just flips the tokens.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--surface)] px-3 py-2">
                <div className="text-sm font-semibold">Artifact sync</div>
                <div className="text-xs font-mono text-[var(--text-muted)] tabular-nums">00:42</div>
              </div>
              <div className="flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                <div className="text-sm font-semibold">Token audit</div>
                <div className="text-xs font-mono text-[var(--text-muted)] tabular-nums">02:18</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tokenRows.map((token) => (
              <div
                key={token.token}
                className="flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  {token.label}
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
                  <span>{token.token}</span>
                  <span className={`h-4 w-4 border border-[var(--border)] ${token.swatchClass}`} aria-hidden />
                </div>
              </div>
            ))}
          </div>

          <div className="border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Semantic palette
            </div>
            <div className="flex flex-wrap gap-2">
              {semanticSwatches.map((swatch) => (
                <div
                  key={swatch.id}
                  className={`inline-flex items-center gap-2 border ${swatch.border} ${swatch.weakBg} ${swatch.text} px-2 py-1 text-xs font-medium`}
                >
                  <span className={`h-2 w-2 border ${swatch.border} ${swatch.strongBg}`} aria-hidden />
                  {swatch.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
