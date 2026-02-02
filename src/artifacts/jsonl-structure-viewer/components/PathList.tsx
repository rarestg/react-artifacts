import { type ReactNode, type RefObject, useMemo } from 'react';

import type { PathNode } from '../types';
import Checkbox from './Checkbox';

const actionButtonBase = [
  'border border-[var(--border)] bg-[var(--surface)]',
  'text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]',
  'hover:bg-[var(--surface-strong)]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]',
].join(' ');

const actionButtonSmall = `${actionButtonBase} px-2 py-1`;
const actionButtonCompact = `${actionButtonBase} px-1.5 py-0.5`;

type PathListProps = {
  tree: PathNode | null;
  flatNodes: PathNode[];
  selection: Record<string, boolean>;
  effectiveSelection: Record<string, boolean>;
  expandedPaths: Record<string, boolean>;
  onToggleExpand: (path: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onTogglePath: (path: string, nextValue: boolean) => void;
  onToggleSubtree: (path: string, nextValue: boolean) => void;
  onSelectAll: (value: boolean) => void;
  onInvert: () => void;
  onResetFilters: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  onlyLeaves: boolean;
  onOnlyLeavesChange: (value: boolean) => void;
};

function highlightText(text: string, query: string) {
  if (!query) return text;
  const lowered = text.toLowerCase();
  const loweredQuery = query.toLowerCase();
  const parts: ReactNode[] = [];
  let index = 0;

  while (index < text.length) {
    const matchIndex = lowered.indexOf(loweredQuery, index);
    if (matchIndex === -1) {
      parts.push(text.slice(index));
      break;
    }
    if (matchIndex > index) {
      parts.push(text.slice(index, matchIndex));
    }
    parts.push(
      <span key={`${text}-${matchIndex}`} className="path-highlight">
        {text.slice(matchIndex, matchIndex + loweredQuery.length)}
      </span>,
    );
    index = matchIndex + loweredQuery.length;
  }

  return parts;
}

function buildMatchMap(root: PathNode, query: string) {
  const map: Record<string, { matches: boolean; hasMatch: boolean }> = {};
  const loweredQuery = query.toLowerCase();

  const walk = (node: PathNode): boolean => {
    const haystack = node.path.toLowerCase();
    const matches = loweredQuery.length > 0 && haystack.includes(loweredQuery);
    let hasMatch = matches;

    node.children.forEach((child) => {
      if (walk(child)) {
        hasMatch = true;
      }
    });

    map[node.path] = { matches, hasMatch };
    return hasMatch;
  };

  walk(root);
  return map;
}

export default function PathList({
  tree,
  flatNodes,
  selection,
  effectiveSelection,
  expandedPaths,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  onTogglePath,
  onToggleSubtree,
  onSelectAll,
  onInvert,
  onResetFilters,
  searchQuery,
  onSearchQueryChange,
  searchInputRef,
  onlyLeaves,
  onOnlyLeavesChange,
}: PathListProps) {
  const normalizedQuery = searchQuery.trim();
  const matchMap = useMemo(() => {
    if (!tree || !normalizedQuery) return null;
    return buildMatchMap(tree, normalizedQuery);
  }, [tree, normalizedQuery]);

  const includedCount = useMemo(
    () => flatNodes.filter((node) => effectiveSelection[node.path] !== false).length,
    [flatNodes, effectiveSelection],
  );

  const rows = useMemo(() => {
    if (!tree) return [] as ReactNode[];

    const result: ReactNode[] = [];

    const walk = (node: PathNode, ancestorExcluded: boolean) => {
      node.children
        .sort((a, b) => a.label.localeCompare(b.label))
        .forEach((child) => {
          const hasChildren = child.children.length > 0;
          const isLeaf = !hasChildren;
          const isExcluded = effectiveSelection[child.path] === false;
          const isDirectOff = selection[child.path] === false;
          const disabled = ancestorExcluded && !isDirectOff;

          const matches = matchMap ? matchMap[child.path]?.matches : true;
          const hasMatch = matchMap ? matchMap[child.path]?.hasMatch : true;

          if (matchMap && !hasMatch) {
            return;
          }

          if (onlyLeaves && !isLeaf) {
            walk(child, ancestorExcluded || isExcluded);
            return;
          }

          const isExpanded = matchMap ? Boolean(matchMap[child.path]?.hasMatch) : (expandedPaths[child.path] ?? false);

          const depthPadding = child.depth * 12;
          const isTopLevel = child.depth === 0;
          const isArray = child.isArray;
          const descendantCount = Math.max(0, child.subtreeCount - 1);

          result.push(
            <div
              key={child.id}
              className={`flex items-center justify-between gap-3 px-3 py-2 text-sm ${disabled ? 'opacity-50' : ''}`}
              style={{ paddingLeft: 12 + depthPadding }}
            >
              <div className="flex items-center gap-2">
                {!onlyLeaves && hasChildren ? (
                  <button
                    type="button"
                    onClick={() => onToggleExpand(child.path)}
                    className="border border-[var(--border)] px-1 text-[10px] font-mono text-[var(--text-muted)] hover:bg-[var(--surface-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? '-' : '+'}
                  </button>
                ) : (
                  <span className="inline-block w-5" aria-hidden="true" />
                )}
                <Checkbox
                  checked={selection[child.path] ?? true}
                  onChange={(event) => onTogglePath(child.path, event.target.checked)}
                  disabled={disabled}
                  ariaLabel={`Toggle ${child.path}`}
                />
                <span
                  className={`font-mono ${
                    isArray ? 'text-[var(--info)]' : isTopLevel ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                  }`}
                >
                  {highlightText(child.label, normalizedQuery)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                {descendantCount > 0 && !onlyLeaves && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleSubtree(child.path, true)}
                      disabled={disabled}
                      className={`${actionButtonCompact} tracking-[0.18em]`}
                    >
                      +{descendantCount}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleSubtree(child.path, false)}
                      disabled={disabled}
                      className={`${actionButtonCompact} tracking-[0.18em]`}
                    >
                      -{descendantCount}
                    </button>
                  </div>
                )}
                <span className="font-mono">{highlightText(child.path, normalizedQuery)}</span>
                {disabled && <span className="text-[10px] uppercase">parent off</span>}
                {!disabled && matches === false && normalizedQuery && (
                  <span className="text-[10px] uppercase">hidden</span>
                )}
              </div>
            </div>,
          );

          if (!onlyLeaves && (isExpanded || matchMap)) {
            walk(child, ancestorExcluded || isExcluded);
          }
        });
    };

    walk(
      {
        id: 'root',
        label: 'root',
        path: '',
        isArray: false,
        depth: -1,
        children: tree.children,
        subtreeCount: 0,
      },
      false,
    );

    return result;
  }, [
    tree,
    selection,
    effectiveSelection,
    expandedPaths,
    matchMap,
    normalizedQuery,
    onlyLeaves,
    onToggleExpand,
    onTogglePath,
    onToggleSubtree,
  ]);

  const visibleCount = rows.length;

  return (
    <div className="flex flex-1 min-h-0 flex-col border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Path Filters</div>
          <div className="text-xs text-[var(--text-muted)]">
            {visibleCount} shown - {includedCount}/{flatNodes.length} included
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExpandAll}
            className={actionButtonSmall}
            disabled={!tree || flatNodes.length === 0 || onlyLeaves}
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            className={actionButtonSmall}
            disabled={!tree || flatNodes.length === 0 || onlyLeaves}
          >
            Collapse All
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="relative flex min-w-[220px] flex-1 items-center">
          <input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search paths"
            ref={searchInputRef}
            aria-label="Search paths"
            className="h-9 w-full border border-[var(--border)] bg-[var(--surface-muted)] px-2 text-sm text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
              aria-label="Clear search"
            >
              x
            </button>
          )}
        </div>
        <Checkbox
          checked={onlyLeaves}
          onChange={(event) => onOnlyLeavesChange(event.target.checked)}
          label="Leaf paths only"
          className="text-xs text-[var(--text-muted)]"
        />
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onSelectAll(true)} className={actionButtonSmall}>
            Select All
          </button>
          <button type="button" onClick={() => onSelectAll(false)} className={actionButtonSmall}>
            Deselect All
          </button>
          <button type="button" onClick={onInvert} className={actionButtonSmall}>
            Invert
          </button>
          <button type="button" onClick={onResetFilters} className={actionButtonSmall}>
            Reset
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {flatNodes.length === 0 ? (
          <div className="m-4 border border-dashed border-[var(--border-strong)] px-4 py-6 text-sm text-[var(--text-muted)]">
            No paths detected yet.
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-[var(--text-muted)]">No paths match your filters.</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">{rows}</div>
        )}
      </div>
    </div>
  );
}
