import { getArtifactSidebarGroupIndex } from '../artifactOrdering';
import { SITE_EXPLAINER, SITE_TITLE } from '../site';
import { IndexEntry, type IndexEntryArtifact } from './IndexEntry';

type MobileIndexProps = {
  artifacts: readonly IndexEntryArtifact[];
};

// Full-screen phone index: same ruled rows as the desktop home, but every entry is a plain
// native link to its standalone page (no onSelect) and the Examples group is left out entirely.
export function MobileIndex({ artifacts }: MobileIndexProps) {
  const tools = artifacts.filter((artifact) => getArtifactSidebarGroupIndex(artifact.id) !== 2);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-xl px-5 py-10">
        <header className="border-b border-gray-200 pb-8 dark:border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
            Index · {tools.length} tools
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">{SITE_TITLE}</h1>
          <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-gray-600 dark:text-slate-400">
            {SITE_EXPLAINER}
          </p>
        </header>
        <ul className="divide-y divide-gray-200 dark:divide-slate-800">
          {tools.map((artifact) => (
            <IndexEntry key={artifact.id} artifact={artifact} />
          ))}
        </ul>
        <footer className="mt-12 border-t border-gray-200 pt-6 dark:border-slate-800">
          <a
            href="https://rares.blog"
            className="text-sm text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-gray-900 dark:text-slate-400 dark:decoration-slate-600 dark:hover:text-slate-100"
          >
            rares.blog
          </a>
        </footer>
      </div>
    </div>
  );
}
