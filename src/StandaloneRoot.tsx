import { Suspense } from 'react';
import { type ArtifactEntry, findArtifactById } from './artifacts';
import StandaloneFallback from './StandaloneFallback';

const StandaloneNotFound = ({ id }: { id: string }) => (
  <div className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="inline-flex items-center gap-2 border border-rose-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-600 dark:border-rose-800 dark:bg-zinc-900 dark:text-rose-300">
        Artifact not found
      </div>
      <div className="border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-3xl">{id}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Double-check the artifact folder name under <span className="font-mono">src/artifacts/</span>.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default function StandaloneRoot({ id }: { id: string }) {
  const artifact: ArtifactEntry | undefined = findArtifactById(id);

  if (!artifact) {
    return <StandaloneNotFound id={id} />;
  }

  return (
    <Suspense fallback={<StandaloneFallback title={artifact.name} subtitle={artifact.subtitle} />}>
      <artifact.Component />
    </Suspense>
  );
}
