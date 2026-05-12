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
          'block w-full cursor-pointer px-3 pt-2 pr-12 pb-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
          selected
            ? 'bg-blue-100 font-medium text-blue-800 dark:bg-slate-800 dark:text-slate-100'
            : 'text-gray-700 group-hover:bg-gray-200 dark:text-slate-300 dark:group-hover:bg-slate-800',
        )}
      >
        <div className="flex items-center gap-2">
          {artifact.kind === 'app' ? (
            <Layers className="size-3.5 text-gray-500 dark:text-slate-400" aria-hidden="true" />
          ) : artifact.kind === 'single' ? (
            <Square className="size-3.5 text-gray-500 dark:text-slate-400" aria-hidden="true" />
          ) : null}
          <span className="truncate">{artifact.name}</span>
        </div>
        {artifact.subtitle && (
          <div className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-slate-400">{artifact.subtitle}</div>
        )}
        {(artifact.model || artifact.version) && (
          <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
            {artifact.model && (
              <span className="inline-flex items-center border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-gray-600 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {artifact.model}
              </span>
            )}
            {artifact.version && (
              <span className="inline-flex items-center border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-gray-600 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
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
          'absolute right-2 bottom-2 z-10 inline-flex size-7 cursor-pointer items-center justify-center border border-transparent text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-offset-slate-950'
        }
      >
        <SquareArrowOutUpRight className="size-3.5" aria-hidden="true" />
      </a>
    </div>,
  );
}
