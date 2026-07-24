import type { MouseEvent as ReactMouseEvent } from 'react';

import type { ArtifactEntry } from '../artifacts';
import { getStandaloneArtifactUrl } from '../lib/artifactUrl';

export type IndexEntryArtifact = Pick<ArtifactEntry, 'id' | 'name' | 'subtitle' | 'kind' | 'model' | 'version'>;

type IndexEntryProps = {
  artifact: IndexEntryArtifact;
  /**
   * When given, plain primary clicks are intercepted and delegated here (in-workbench
   * selection); modified or middle clicks fall through to the real standalone link.
   * Omit to keep native navigation (mobile index).
   */
  onSelect?: (id: string) => void;
};

export function IndexEntry({ artifact, onSelect }: IndexEntryProps) {
  const byline = [artifact.kind, artifact.model, artifact.version].filter(Boolean).join(' · ');

  const handleClick = onSelect
    ? (event: ReactMouseEvent<HTMLAnchorElement>) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onSelect(artifact.id);
      }
    : undefined;

  return (
    <li>
      <a
        href={getStandaloneArtifactUrl(artifact.id)}
        onClick={handleClick}
        className="group block py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white active:bg-gray-50 dark:focus-visible:ring-offset-slate-950 dark:active:bg-slate-900"
      >
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-baseline md:gap-x-6">
          <span className="block text-[17px] font-medium tracking-tight text-gray-900 decoration-gray-300 underline-offset-4 group-hover:underline md:col-start-1 md:row-start-1 dark:text-slate-100 dark:decoration-slate-600">
            {artifact.name}
          </span>
          {artifact.subtitle && (
            <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-gray-600 md:col-start-1 md:row-start-2 dark:text-slate-400">
              {artifact.subtitle}
            </p>
          )}
          {byline && (
            <span className="mt-2 block font-mono text-[11px] uppercase tracking-[0.12em] text-gray-500 md:col-start-2 md:row-start-1 md:mt-0 dark:text-slate-400">
              {byline}
            </span>
          )}
        </div>
      </a>
    </li>
  );
}
