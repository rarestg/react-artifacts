import './theme.css';
import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { ListboxSelect } from '../../components/ListboxSelect';
import { Panel } from '../../components/Panel';
import { useLocalStorageState } from '../../lib/useLocalStorageState';
import { Stack } from '../../ui/layout';
import { typo } from '../../ui/recipes';
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
  const [storedTheme, setTheme] = useLocalStorageState<ThemeId>(storageKey, defaultTheme);
  // Guard against stale/foreign stored values before they reach data-theme.
  const theme = themes.some((item) => item.id === storedTheme) ? storedTheme : defaultTheme;

  const activeTheme = themes.find((item) => item.id === theme) ?? themes[0];
  const themeOptions = themes.map((item) => ({ value: item.id, label: item.label }));

  return (
    <ArtifactThemeRoot
      className="example-theme min-h-screen bg-[var(--surface-muted)] text-[var(--text)]"
      data-theme={theme}
    >
      <Stack gap="section" className="mx-auto max-w-3xl p-8">
        <Panel className="p-6 space-y-4">
          <Stack gap="row">
            <div className={typo.controlLabel}>Single-file artifact</div>
            <h1 className={typo.pageTitle}>Example Artifact</h1>
            <p className="text-sm text-[var(--text-muted)]">
              This artifact uses the shared Sharp UI tokens. The shell theme toggle swaps light/dark tokens, while the
              palette menu overrides the accent/surface mix.
            </p>
          </Stack>

          <Stack gap="row">
            <label className={typo.controlLabel} htmlFor="example-theme">
              Theme
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <ListboxSelect
                id="example-theme"
                ariaLabel="Theme"
                className="w-52"
                triggerClassName="font-mono"
                optionClassName="font-mono"
                closeOnSelect={false}
                options={themeOptions}
                value={theme}
                onChange={setTheme}
              />
              <div className="border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-mono text-[var(--text-muted)]">
                active: {activeTheme.label}
              </div>
            </div>
          </Stack>
        </Panel>

        <Panel className="p-6 space-y-4">
          <div className={typo.controlLabel}>Preview</div>

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
            <Stack gap="row">
              <div className="flex items-center justify-between gap-3 border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--surface)] px-3 py-2">
                <div className="text-sm font-semibold">Artifact sync</div>
                <div className="text-xs font-mono text-[var(--text-muted)] tabular-nums">00:42</div>
              </div>
              <div className="flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                <div className="text-sm font-semibold">Token audit</div>
                <div className="text-xs font-mono text-[var(--text-muted)] tabular-nums">02:18</div>
              </div>
            </Stack>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tokenRows.map((token) => (
              <div
                key={token.token}
                className="flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2"
              >
                <div className={typo.controlLabel}>{token.label}</div>
                <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
                  <span>{token.token}</span>
                  <span className={`h-4 w-4 border border-[var(--border)] ${token.swatchClass}`} aria-hidden />
                </div>
              </div>
            ))}
          </div>

          <div className="border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
            <div className={typo.controlLabel}>Semantic palette</div>
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
        </Panel>
      </Stack>
    </ArtifactThemeRoot>
  );
}
