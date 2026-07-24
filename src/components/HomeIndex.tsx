import { getArtifactSidebarGroupIndex } from '../artifactOrdering';
import { SITE_EXPLAINER, SITE_TITLE } from '../site';
import { IndexEntry, type IndexEntryArtifact } from './IndexEntry';

type HomeIndexProps = {
  artifacts: readonly IndexEntryArtifact[];
  onSelectArtifact: (id: string) => void;
};

export function HomeIndex({ artifacts, onSelectArtifact }: HomeIndexProps) {
  const tools = artifacts.filter((artifact) => getArtifactSidebarGroupIndex(artifact.id) !== 2);
  const examples = artifacts.filter((artifact) => getArtifactSidebarGroupIndex(artifact.id) === 2);

  return (
    <div className="mx-auto max-w-3xl px-8 py-16 md:px-12">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
          Index · {tools.length} tools
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">{SITE_TITLE}</h1>
        <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-gray-600 dark:text-slate-400">{SITE_EXPLAINER}</p>
      </header>
      <ul className="mt-12 divide-y divide-gray-200 dark:divide-slate-800">
        {tools.map((artifact) => (
          <IndexEntry key={artifact.id} artifact={artifact} onSelect={onSelectArtifact} />
        ))}
      </ul>
      {examples.length > 0 && (
        <section className="mt-12">
          <h2 className="border-b border-gray-200 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:border-slate-800 dark:text-slate-400">
            Examples
          </h2>
          <ul className="divide-y divide-gray-200 dark:divide-slate-800">
            {examples.map((artifact) => (
              <IndexEntry key={artifact.id} artifact={artifact} onSelect={onSelectArtifact} />
            ))}
          </ul>
        </section>
      )}
      <footer className="mt-12 border-t border-gray-200 pt-6 dark:border-slate-800">
        <a
          href="https://rares.blog"
          className="text-sm text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-gray-900 dark:text-slate-400 dark:decoration-slate-600 dark:hover:text-slate-100"
        >
          rares.blog
        </a>
      </footer>
    </div>
  );
}
