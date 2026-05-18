import {
  ChevronRight as ChevronIcon,
  Copy as CopyIcon,
  Folder as FolderIcon,
  GitBranch as GitBranchIcon,
  Github as GitRepoIcon,
  MessageSquare as MessageIcon,
  Plug as PlugIcon,
  Search as SearchIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { ArtifactDialog } from '../../components/ArtifactDialog';
import { ArtifactThemeRoot } from '../../components/ArtifactThemeRoot';
import { Button } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { CopyableLabel } from '../../components/CopyableLabel';
import { CopyButton } from '../../components/CopyButton';
import { FilterCheckbox } from '../../components/FilterCheckbox';
import { Input } from '../../components/Input';
import { Panel } from '../../components/Panel';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StatusTag } from '../../components/StatusTag';
import { Tag } from '../../components/Tag';
import { Toggle } from '../../components/Toggle';
import { CodeBlock } from './components/CodeBlock';
import { Popover, popoverActionClass } from './components/Popover';
import { Row } from './components/Row';
import { SearchInput } from './components/SearchInput';
import { Section } from './components/Section';
import { SubSection } from './components/SubSection';
import {
  type ConversationDetailVisibility,
  ConversationTurn,
  getTurnItemVisibleType,
  getTurnKey,
  type RenderMode,
  type VisibleTypes,
} from './conversation';
import { allSearchResults, sampleConversation } from './fixtures';

// ============================================
// DESIGN TOKENS (conceptual)
// ============================================
// Conceptual reference — not consumed in code, kept as a design token inventory
const tokens = {
  surface: {
    0: 'bg-[var(--surface)]', // panel
    1: 'bg-[var(--surface-muted)]', // muted grouping
    2: 'bg-[var(--surface-strong)]', // pressed/strong hover
  },
  border: {
    default: 'border-[var(--border)]',
    muted: 'border-[color:var(--border)]',
    strong: 'border-[var(--border-strong)]',
  },
  text: {
    0: 'text-[var(--text)]', // primary
    1: 'text-[var(--text-muted)]', // secondary
    2: 'text-[var(--text-subtle)]', // muted
  },
};
void tokens;

// ============================================
// MAIN DESIGN SYSTEM SHOWCASE
// ============================================
export default function DesignSystem() {
  const [selectedRow, setSelectedRow] = useState<number>(1);
  const [checkboxes, setCheckboxes] = useState<{ a: boolean; b: boolean; c: boolean }>({
    a: true,
    b: false,
    c: false,
  });
  const [toggles, setToggles] = useState<{ a: boolean; b: boolean }>({ a: true, b: false });
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview');
  const [outputMode, setOutputMode] = useState<'raw' | 'rendered'>('rendered');
  const [modalOpen, setModalOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchingActive, setSearchingActive] = useState(true);
  const dialogPortalRef = useRef<HTMLDivElement>(null);

  const filteredResults = searchValue
    ? allSearchResults.filter((r) => {
        const query = searchValue.toLowerCase();
        return r.title.toLowerCase().includes(query) || (r.subtitle?.toLowerCase().includes(query) ?? false);
      })
    : allSearchResults;

  // Conversation render modes (per-message toggle between literal/rendered)
  const [conversationRenderModes, setConversationRenderModes] = useState<Record<string, RenderMode>>({});
  const [demoCheckbox, setDemoCheckbox] = useState(false);

  // Message type visibility (thinking, tool calls, subagent events, token counters off by default)
  const [visibleTypes, setVisibleTypes] = useState<VisibleTypes>({
    user: true,
    assistant: true,
    thinking: false,
    toolCalls: false,
    subagentActivity: false,
    tokenCounters: false,
  });
  const [detailVisibility, setDetailVisibility] = useState<
    Pick<ConversationDetailVisibility, 'showIntermediateTokenCounters'>
  >({
    showIntermediateTokenCounters: false,
  });

  const toggleMessageRender = (itemId: string) => {
    setConversationRenderModes((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === 'literal' ? 'rendered' : 'literal',
    }));
  };

  // Count items by type across all turns
  const itemCounts = sampleConversation.reduce(
    (acc, turn) => {
      turn.items.forEach((item) => {
        acc[getTurnItemVisibleType(item)]++;
      });
      return acc;
    },
    { user: 0, assistant: 0, thinking: 0, toolCalls: 0, subagentActivity: 0, tokenCounters: 0 },
  );
  const finalTokenCounterCount = sampleConversation.reduce(
    (count, turn) => count + (turn.items.some((item) => item.type === 'token_counter') ? 1 : 0),
    0,
  );
  return (
    <ArtifactThemeRoot className="min-h-screen bg-[var(--surface-strong)] p-8 text-[var(--text)]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-[var(--border-strong)] pb-6">
          <h1 className="text-2xl font-semibold text-[var(--text)]">Sharp UI System</h1>
          <p className="text-sm text-[var(--text-subtle)] mt-1">
            Design primitives for Codex Conversation Manager — scan-first, dense, accessible
          </p>
        </div>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-4">
            <SubSection label="Text hierarchy">
              <div className="space-y-2">
                <p className="text-[var(--text)] text-base">text-0 — Primary content (var(--text))</p>
                <p className="text-[var(--text-muted)] text-base">text-1 — Secondary content (var(--text-muted))</p>
                <p className="text-[var(--text-subtle)] text-base">text-2 — Muted content (var(--text-subtle))</p>
              </div>
            </SubSection>
            <SubSection label="Label styles">
              <div className="flex flex-wrap gap-4 items-baseline">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Section header
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-subtle)]">
                  Sub-label
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-subtle)]">
                  Tag label
                </span>
              </div>
            </SubSection>
            <SubSection label="Inline code">
              <p className="text-sm text-[var(--text)]">
                Use{' '}
                <code className="px-1 py-0.5 border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text)] text-xs">
                  inline code
                </code>{' '}
                for technical references like{' '}
                <code className="px-1 py-0.5 border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text)] text-xs">
                  className
                </code>{' '}
                props.
              </p>
            </SubSection>
          </div>
        </Section>

        {/* Surfaces */}
        <Section title="Surfaces & Containers">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),1fr))] gap-4">
            <SubSection label="Panel (default)">
              <Panel className="p-4">
                <p className="text-sm text-[var(--text-muted)]">Bordered, opaque, sharp edges</p>
              </Panel>
            </SubSection>
            <SubSection label="Panel (muted)">
              <Panel variant="muted" className="p-4">
                <p className="text-sm text-[var(--text-muted)]">Subtle background for grouping</p>
              </Panel>
            </SubSection>
            <SubSection label="Panel (dashed)">
              <Panel variant="dashed" className="p-4">
                <p className="text-sm text-[var(--text-subtle)]">Empty/placeholder states</p>
              </Panel>
            </SubSection>
          </div>
        </Section>

        {/* Tags */}
        <Section title="Tags & Status Indicators">
          <div className="space-y-6">
            <SubSection label="Tag variants">
              <div className="flex flex-wrap gap-2">
                <Tag variant="base">Base tag</Tag>
                <Tag variant="muted">Muted tag</Tag>
                <Tag variant="solid">Solid tag</Tag>
              </div>
            </SubSection>
            <SubSection label="Status tags (with indicator)">
              <div className="flex flex-wrap gap-3">
                <StatusTag
                  label="Connected"
                  active={true}
                  reserveLabel="Disconnected"
                  icon={<PlugIcon className="size-3.5" />}
                />
                <StatusTag
                  label="Disconnected"
                  active={false}
                  reserveLabel="Disconnected"
                  icon={<PlugIcon className="size-3.5" />}
                />
                <StatusTag label="Indexed" active={true} />
                <StatusTag label="Offline" active={false} />
                <div className="decision-frame decision-theme-amber inline-flex">
                  <span className="decision-badge">
                    <span className="decision-badge-label">Click me</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchingActive((prev) => !prev)}
                    className="decision-ring inline-flex cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]"
                  >
                    <StatusTag
                      label={searchingActive ? 'Searching' : 'Done'}
                      reserveLabel="Searching"
                      active={searchingActive}
                    />
                  </button>
                </div>
              </div>
            </SubSection>
            <SubSection label="Metadata tags">
              <div className="flex flex-wrap gap-2 items-center">
                <Tag variant="base">main</Tag>
                <Tag variant="muted">v2.4.1</Tag>
                <Tag variant="base" className="tabular-nums">
                  142 items
                </Tag>
                <Tag variant="muted" className="tabular-nums">
                  3.2kb
                </Tag>
              </div>
            </SubSection>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="space-y-6">
            <SubSection label="Variants">
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="primary">Primary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </SubSection>
            <SubSection label="Sizes">
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </SubSection>
            <SubSection label="With icons">
              <div className="flex flex-wrap gap-3">
                <Button variant="default">
                  <SearchIcon className="size-4" />
                  Search
                </Button>
                <Button variant="primary">
                  <MessageIcon className="size-4" />
                  New Chat
                </Button>
                <Button variant="ghost" size="sm" aria-label="Copy example">
                  <CopyIcon className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </SubSection>
            <SubSection label="States">
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <CopyButton text="Hello world" />
              </div>
            </SubSection>
          </div>
        </Section>

        {/* Copyable Labels */}
        <Section title="Copyable Labels">
          <div className="space-y-6">
            <SubSection label="Session metadata (hover to see copy affordance)">
              <div className="flex flex-wrap gap-2">
                <CopyableLabel value="/users/rares/projects/codex-manager" icon={<FolderIcon className="size-3.5" />} />
                <CopyableLabel value="rarestg/codex-manager" icon={<GitRepoIcon className="size-3.5" />} />
                <CopyableLabel value="(feat) integrate-waves" icon={<GitBranchIcon className="size-3.5" />} />
              </div>
            </SubSection>
            <SubSection label="Behavior">
              <div className="p-3 border border-[var(--border)] bg-[var(--surface-muted)] text-xs text-[var(--text-muted)] space-y-1">
                <div>
                  <strong>Idle:</strong> Shows [icon] + [value]
                </div>
                <div>
                  <strong>Hover:</strong> Shows [icon] + "Copy" (indicates click action)
                </div>
                <div>
                  <strong>Copied:</strong> Shows [icon] + "Copied ✓" (green state)
                </div>
                <div>
                  <strong>Failed:</strong> Shows [icon] + "Failed ✗" (red state)
                </div>
                <div className="pt-2 text-[var(--text-subtle)]">
                  Uses reserve label pattern for stable width. Tooltip shows full value.
                </div>
              </div>
            </SubSection>
            <SubSection label="Without icons">
              <div className="flex flex-wrap gap-2">
                <CopyableLabel value="abc123def456" />
                <CopyableLabel value="session-2024-01-15" />
              </div>
            </SubSection>
            <SubSection label="In context (simulated turn header)">
              <div className="border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-muted)]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[var(--text)]">Turn 1</span>
                    <span className="text-[10px] text-[var(--text-subtle)] tabular-nums">10:42:15</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyableLabel value="~/projects/app" icon={<FolderIcon className="size-3" />} />
                    <CopyableLabel value="main" icon={<GitBranchIcon className="size-3" />} />
                    <Tag variant="muted" className="tabular-nums">
                      2.3s
                    </Tag>
                  </div>
                </div>
                <div className="p-3 text-sm text-[var(--text-subtle)]">Message content would appear here...</div>
              </div>
            </SubSection>
          </div>
        </Section>

        {/* Search Input */}
        <Section title="Search Input">
          <div className="space-y-6">
            <SubSection label="With floating typeahead results (click to focus)">
              <div className="max-w-md">
                <SearchInput
                  ariaLabel="Search conversations"
                  placeholder="Search conversations..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  showResults={searchFocused}
                  results={filteredResults}
                  onSelect={(result) => {
                    setSearchValue(result.title);
                    setSearchFocused(false);
                  }}
                />
              </div>
            </SubSection>
            <div className="p-3 border border-[var(--border)] bg-[var(--surface-muted)] text-xs text-[var(--text-subtle)]">
              <strong>Float behavior:</strong> The dropdown is absolutely positioned with{' '}
              <code className="px-1 bg-[var(--surface)] border border-[var(--border)]">position: absolute</code> and
              <code className="px-1 bg-[var(--surface)] border border-[var(--border)]">z-50</code>. It floats over
              content below without affecting document flow. The content below this box stays in place when results
              appear.
            </div>
          </div>
        </Section>

        {/* Inputs & Controls */}
        <Section title="Inputs & Controls">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(16rem,100%),1fr))] gap-6">
            <div className="min-w-0 space-y-4">
              <SubSection label="Text input">
                <Input aria-label="Example text input" placeholder="Enter text..." />
              </SubSection>
              <SubSection label="With label">
                <Input label="Workspace name" placeholder="my-project" />
              </SubSection>
              <SubSection label="Error state">
                <Input label="Email" placeholder="email@example.com" error="Invalid email address" />
              </SubSection>
            </div>
            <div className="min-w-0 space-y-4">
              <SubSection label="Checkboxes">
                <div className="space-y-1">
                  <Checkbox
                    label="Show hidden files"
                    reserveLabel="Show hidden files"
                    checked={checkboxes.a}
                    onCheckedChange={(checked) => setCheckboxes((s) => ({ ...s, a: checked }))}
                  />
                  <Checkbox
                    label="Enable auto-save"
                    reserveLabel="Enable auto-save"
                    checked={checkboxes.b}
                    onCheckedChange={(checked) => setCheckboxes((s) => ({ ...s, b: checked }))}
                  />
                  <Checkbox
                    label="Disabled option"
                    reserveLabel="Disabled option"
                    checked={checkboxes.c}
                    onCheckedChange={(checked) => setCheckboxes((s) => ({ ...s, c: checked }))}
                    disabled
                  />
                </div>
              </SubSection>
              <SubSection label="Toggles">
                <div className="space-y-1">
                  <Toggle
                    label="Dark mode"
                    reserveLabel="Notifications"
                    checked={toggles.a}
                    onCheckedChange={(checked) => setToggles((s) => ({ ...s, a: checked }))}
                  />
                  <Toggle
                    label="Notifications"
                    reserveLabel="Notifications"
                    checked={toggles.b}
                    onCheckedChange={(checked) => setToggles((s) => ({ ...s, b: checked }))}
                  />
                </div>
              </SubSection>
              <SubSection label="Segmented controls">
                <div className="space-y-3">
                  <SegmentedControl
                    ariaLabel="View mode"
                    value={viewMode}
                    onValueChange={setViewMode}
                    tone="neutral"
                    fullWidth
                    options={[
                      { value: 'overview', label: 'Overview' },
                      { value: 'details', label: 'Details' },
                    ]}
                  />
                  <SegmentedControl
                    ariaLabel="Output mode"
                    value={outputMode}
                    onValueChange={setOutputMode}
                    tone="accent"
                    size="compact"
                    options={[
                      { value: 'raw', label: 'Raw' },
                      { value: 'rendered', label: 'Rendered' },
                    ]}
                  />
                </div>
              </SubSection>
            </div>
          </div>
        </Section>

        {/* Lists & Rows */}
        <Section title="Lists & Rows">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(16rem,100%),1fr))] gap-6">
            <SubSection label="Interactive list with selection" className="min-w-0">
              <Panel className="divide-y divide-[color:var(--border)]">
                {[
                  { id: 0, title: 'Project Setup', meta: '12 messages', time: '2m ago' },
                  { id: 1, title: 'API Integration', meta: '8 messages', time: '1h ago' },
                  { id: 2, title: 'Bug Investigation', meta: '24 messages', time: '3h ago' },
                  { id: 3, title: 'Code Review', meta: '6 messages', time: 'Yesterday' },
                ].map((item) => (
                  <Row key={item.id} selected={selectedRow === item.id} onClick={() => setSelectedRow(item.id)}>
                    <MessageIcon className="size-4 text-[var(--text-subtle)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--text)] truncate">{item.title}</div>
                      <div className="text-xs text-[var(--text-subtle)]">{item.meta}</div>
                    </div>
                    <div className="text-xs text-[var(--text-subtle)] tabular-nums">{item.time}</div>
                    <ChevronIcon className="size-4 text-[var(--text-subtle)]" />
                  </Row>
                ))}
              </Panel>
            </SubSection>
            <SubSection label="Static list (workspaces)" className="min-w-0">
              <Panel className="divide-y divide-[color:var(--border)]">
                {[
                  { name: 'frontend', count: 42 },
                  { name: 'backend-api', count: 18 },
                  { name: 'documentation', count: 7 },
                ].map((ws) => (
                  <div key={ws.name} className="px-3 py-2.5 flex items-center gap-3">
                    <FolderIcon className="size-4 text-[var(--text-subtle)]" />
                    <span className="flex-1 text-sm text-[var(--text)]">{ws.name}</span>
                    <Tag variant="muted" className="tabular-nums">
                      {ws.count}
                    </Tag>
                  </div>
                ))}
              </Panel>
            </SubSection>
          </div>
        </Section>

        {/* Conversation Rendering */}
        <Section title="Conversation Rendering">
          <div className="space-y-6">
            {/* Message type filter toggles */}
            <SubSection label="Message type filters">
              <div className="flex flex-wrap gap-1 border border-[var(--border)] bg-[var(--surface)] p-2">
                <FilterCheckbox
                  label="User"
                  count={itemCounts.user}
                  checked={visibleTypes.user ?? false}
                  onCheckedChange={(checked) => setVisibleTypes((v) => ({ ...v, user: checked }))}
                  tone="green"
                  borderStyle="neutral"
                />
                <FilterCheckbox
                  label="Assistant"
                  count={itemCounts.assistant}
                  checked={visibleTypes.assistant ?? false}
                  onCheckedChange={(checked) => setVisibleTypes((v) => ({ ...v, assistant: checked }))}
                  tone="blue"
                  borderStyle="neutral"
                />
                <FilterCheckbox
                  label="Subagents"
                  count={itemCounts.subagentActivity}
                  checked={visibleTypes.subagentActivity ?? false}
                  onCheckedChange={(checked) => setVisibleTypes((v) => ({ ...v, subagentActivity: checked }))}
                  tone="cyan"
                  borderStyle="neutral"
                />
                <FilterCheckbox
                  label="Thinking"
                  count={itemCounts.thinking}
                  checked={visibleTypes.thinking ?? false}
                  onCheckedChange={(checked) => setVisibleTypes((v) => ({ ...v, thinking: checked }))}
                  tone="amber"
                  borderStyle="neutral"
                />
                <FilterCheckbox
                  label="Tools"
                  count={itemCounts.toolCalls}
                  checked={visibleTypes.toolCalls ?? false}
                  onCheckedChange={(checked) => setVisibleTypes((v) => ({ ...v, toolCalls: checked }))}
                  tone="violet"
                  borderStyle="neutral"
                />
                <FilterCheckbox
                  label="Context Window"
                  count={finalTokenCounterCount}
                  checked={visibleTypes.tokenCounters ?? false}
                  onCheckedChange={(checked) => setVisibleTypes((v) => ({ ...v, tokenCounters: checked }))}
                  tone="metadata"
                  borderStyle="neutral"
                />
                <FilterCheckbox
                  label="All"
                  // All is a dependent control for Context Window, so avoid repeating that count here.
                  checked={detailVisibility.showIntermediateTokenCounters}
                  onCheckedChange={(checked) =>
                    setDetailVisibility((visibility) => ({
                      ...visibility,
                      showIntermediateTokenCounters: checked,
                    }))
                  }
                  tone="metadata"
                  borderStyle="neutral"
                  disabled={!visibleTypes.tokenCounters}
                  className={!visibleTypes.tokenCounters ? 'opacity-50' : undefined}
                />
              </div>
            </SubSection>

            <div className="p-3 border border-[var(--border)] bg-[var(--surface-muted)] text-xs text-[var(--text-muted)] space-y-2">
              <p>
                <strong>Rendering rules (terminal-adjacent):</strong>
              </p>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),1fr))] gap-2 text-[var(--text-subtle)]">
                <div>
                  <span className="inline-block size-2 bg-[var(--category-green)] mr-2" />
                  User: literal by default (preserves exact input)
                </div>
                <div>
                  <span className="inline-block size-2 bg-[var(--category-blue)] mr-2" />
                  Assistant: rendered markdown by default
                </div>
                <div>
                  <span className="inline-block size-2 bg-[var(--category-amber)] mr-2" />
                  Thinking: rendered markdown by default
                </div>
                <div>
                  <span className="inline-block size-2 bg-[var(--category-violet)] mr-2" />
                  Tool Call: summary first, click to show details
                </div>
                <div>
                  <span className="inline-block size-2 bg-[var(--category-cyan)] mr-2" />
                  Subagents: spawn, wait, follow-up, notification, close
                </div>
                <div>
                  <span className="inline-block size-2 bg-[var(--text-muted)] mr-2" />
                  Token Counter: final context row by default
                </div>
              </div>
              <p className="text-[var(--text-subtle)]">
                Toggle message types above. Thinking, subagents, tools, and token counters are hidden by default; tool
                rows reveal their own details, and intermediate token counters are an explicit detail mode.
              </p>
            </div>

            <div className="space-y-4">
              {sampleConversation.map((turn) => (
                <ConversationTurn
                  key={getTurnKey(turn)}
                  turnNumber={turn.turnNumber}
                  timestamp={turn.timestamp}
                  duration={turn.duration}
                  items={turn.items}
                  visibleTypes={visibleTypes}
                  detailVisibility={{
                    showIntermediateTokenCounters:
                      visibleTypes.tokenCounters && detailVisibility.showIntermediateTokenCounters,
                  }}
                  renderModesByItemId={conversationRenderModes}
                  onToggleRenderModeForItem={toggleMessageRender}
                />
              ))}
            </div>

            <SubSection label="Typography contract">
              <div className="p-3 border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-muted)] font-mono space-y-1">
                <div>• All message content uses monospace font (font-mono)</div>
                <div>• Markdown headings use weight, not font-family change</div>
                <div>• Code blocks: sharp containers, no radius, solid bg</div>
                <div>• Inline code: minimal border + bg, no pill styling</div>
                <div>• whitespace-pre-wrap for literal text (no horizontal scroll for prose)</div>
              </div>
            </SubSection>
          </div>
        </Section>

        {/* Code Blocks */}
        <Section title="Code Blocks">
          <div className="space-y-4">
            <SubSection label="With language label and copy">
              <CodeBlock language="typescript">
                {`interface StatusTagProps {
  label: string;
  reserveLabel?: string;
  active?: boolean;
  icon?: ReactNode;
}`}
              </CodeBlock>
            </SubSection>
          </div>
        </Section>

        {/* Modals & Overlays */}
        <Section title="Modals & Overlays">
          <div className="flex flex-wrap gap-4 items-start">
            <SubSection label="Modal">
              <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
              <ArtifactDialog
                open={modalOpen}
                onOpenChange={(nextOpen) => {
                  if (!nextOpen) setModalOpen(false);
                }}
                title="Confirm Action"
                closeLabel="Close modal"
                container={dialogPortalRef.current}
                placement="viewport"
                align="center"
                contentClassName="max-w-md shadow-none"
                bodyClassName="p-4"
              >
                <p className="mb-4 text-sm text-[var(--text-muted)]">
                  Are you sure you want to proceed? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={() => setModalOpen(false)}>
                    Confirm
                  </Button>
                </div>
              </ArtifactDialog>
            </SubSection>
            <SubSection label="Popover">
              <Popover
                open={popoverOpen}
                onOpenChange={(nextOpen) => setPopoverOpen(nextOpen)}
                trigger={<Button>Open Popover</Button>}
              >
                <div className="p-2 space-y-1">
                  <button type="button" className={`${popoverActionClass} text-[var(--text)]`}>
                    Edit
                  </button>
                  <button type="button" className={`${popoverActionClass} text-[var(--text)]`}>
                    Duplicate
                  </button>
                  <button type="button" className={`${popoverActionClass} text-[var(--danger)]`}>
                    Delete
                  </button>
                </div>
              </Popover>
            </SubSection>
          </div>
        </Section>

        {/* Layout Grid */}
        <Section title="Layout & Grid">
          <div className="space-y-6">
            <SubSection label="Two-column layout">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(16rem,100%),1fr))] gap-4">
                <Panel className="p-4">
                  <div className="text-sm text-[var(--text-muted)]">Left panel</div>
                </Panel>
                <Panel className="p-4">
                  <div className="text-sm text-[var(--text-muted)]">Right panel</div>
                </Panel>
              </div>
            </SubSection>
            <SubSection label="Sidebar + content">
              <div className="flex flex-wrap gap-4">
                <Panel className="min-w-[12rem] flex-[1_1_12rem] p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)] mb-3">
                    Navigation
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      className="w-full cursor-pointer px-2 py-1.5 text-left text-sm text-[var(--text)] bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                    >
                      Sessions
                    </button>
                    <button
                      type="button"
                      className="w-full cursor-pointer px-2 py-1.5 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                    >
                      Workspaces
                    </button>
                    <button
                      type="button"
                      className="w-full cursor-pointer px-2 py-1.5 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                    >
                      Settings
                    </button>
                  </div>
                </Panel>
                <Panel className="min-w-[16rem] flex-[999_1_20rem] p-4">
                  <div className="text-sm text-[var(--text-muted)]">
                    Main content area with min-w-0 for safe truncation
                  </div>
                </Panel>
              </div>
            </SubSection>
            <SubSection label="Stacked panels (interactive rows)">
              <div className="space-y-2">
                <Row className="justify-between border-l-transparent">
                  <span className="text-sm text-[var(--text)]">First item</span>
                  <Tag variant="muted">Active</Tag>
                </Row>
                <Row className="justify-between border-l-transparent">
                  <span className="text-sm text-[var(--text)]">Second item</span>
                  <Tag variant="base">Pending</Tag>
                </Row>
                <Row className="justify-between border-l-transparent">
                  <span className="text-sm text-[var(--text)]">Third item</span>
                  <Tag variant="muted">Archived</Tag>
                </Row>
              </div>
            </SubSection>
          </div>
        </Section>

        {/* Focus States */}
        <Section title="Focus & Keyboard">
          <div className="space-y-4">
            <SubSection label="Tab through these elements to see focus states (checkbox is interactive)">
              <div className="flex flex-wrap gap-3 items-center">
                <Button>Button</Button>
                <Input aria-label="Keyboard focus example input" placeholder="Input" className="w-40" />
                <Checkbox label="Checkbox" checked={demoCheckbox} onCheckedChange={setDemoCheckbox} />
              </div>
            </SubSection>
            <div className="p-3 border border-[var(--border)] bg-[var(--surface-muted)] text-xs text-[var(--text-subtle)] space-y-2">
              <div>
                <strong>Focus contract:</strong> Focus-visible rings are allowed and preferred for keyboard clarity.
                Focus must never be clipped and should use a small offset so the ring does not touch the control edge.
                Use{' '}
                <code className="px-1 bg-[var(--surface)] border border-[var(--border)]">
                  focus-visible:ring-2 focus-visible:ring-offset-1
                </code>{' '}
                and a high-contrast ring color.
              </div>
              <div>
                <strong>Clickability indicators:</strong> All clickable elements must have:
                <div className="mt-1 ml-3 space-y-0.5">
                  <div>
                    • <code className="px-1 bg-[var(--surface)] border border-[var(--border)]">cursor-pointer</code> —
                    pointer cursor on hover
                  </div>
                  <div>• Visible hover state (background shift, border change, or text change)</div>
                  <div>• Active/pressed state for feedback</div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Design Rules Summary */}
        <Section title="Sharp UI Rules (Summary)">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(16rem,100%),1fr))] gap-6 text-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="size-2 mt-1.5 bg-[var(--success)] shrink-0" />
                <span className="text-[var(--text)]">No rounded corners (radius = 0)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="size-2 mt-1.5 bg-[var(--success)] shrink-0" />
                <span className="text-[var(--text)]">No translucency / glass / blur</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="size-2 mt-1.5 bg-[var(--success)] shrink-0" />
                <span className="text-[var(--text)]">No shadows for hierarchy</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="size-2 mt-1.5 bg-[var(--success)] shrink-0" />
                <span className="text-[var(--text)]">Border-driven hierarchy</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="size-2 mt-1.5 bg-[var(--success)] shrink-0" />
                <span className="text-[var(--text)]">Preserve keyboard focus visibility</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="size-2 mt-1.5 bg-[var(--success)] shrink-0" />
                <span className="text-[var(--text)]">Color is never the only cue</span>
              </div>
            </div>
          </div>
        </Section>
      </div>
      <div ref={dialogPortalRef} className="pointer-events-none" />
    </ArtifactThemeRoot>
  );
}
