import { Layers, Square, SquareArrowOutUpRight } from 'lucide-react';
import React from 'react';

import type { ArtifactEntry } from '../artifacts';
import { mergeClassNames } from '../lib/classNames';

type ArtifactListItemArtifact = Pick<ArtifactEntry, 'id' | 'name' | 'subtitle' | 'kind' | 'model' | 'version'>;

type ArtifactListItemProps = {
  artifact: ArtifactListItemArtifact;
  selected: boolean;
  onSelect: (id: string) => void;
};

const getStandaloneUrl = (id: string) => {
  const base = import.meta.env?.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}artifact/${encodeURIComponent(id)}`;
};

export function ArtifactListItem({ artifact, selected, onSelect }: ArtifactListItemProps) {
  return React.createElement(
    'li',
    null,
    <div className="group relative text-sm">
      <button
        type="button"
        aria-label={`Select ${artifact.name}`}
        onClick={() => onSelect(artifact.id)}
        className={mergeClassNames(
          'block w-full cursor-pointer px-3 pt-2 pr-12 pb-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
          selected
            ? 'bg-blue-100 font-medium text-blue-800 dark:bg-zinc-800 dark:text-zinc-100'
            : 'text-zinc-700 group-hover:bg-zinc-200 dark:text-zinc-300 dark:group-hover:bg-zinc-800',
        )}
      >
        <div className="flex items-center gap-2">
          {artifact.kind === 'app' ? (
            <Layers className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
          ) : artifact.kind === 'single' ? (
            <Square className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
          ) : null}
          <span className="truncate">{artifact.name}</span>
        </div>
        {artifact.subtitle && (
          <div className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">{artifact.subtitle}</div>
        )}
        {(artifact.model || artifact.version) && (
          <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
            {artifact.model && (
              <span className="inline-flex items-center border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-zinc-600 uppercase dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {artifact.model}
              </span>
            )}
            {artifact.version && (
              <span className="inline-flex items-center border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-zinc-600 uppercase dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {artifact.version}
              </span>
            )}
          </div>
        )}
      </button>
      <a
        href={getStandaloneUrl(artifact.id)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${artifact.name} standalone`}
        title="Open standalone view"
        className={
          'absolute right-2 bottom-2 z-10 inline-flex h-7 w-7 cursor-pointer items-center justify-center border border-transparent text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-offset-zinc-950'
        }
      >
        <SquareArrowOutUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>,
  );
}
