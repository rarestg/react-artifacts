import { Suspense } from 'react';
import { findArtifactById } from './artifacts';

export default function StandaloneRoot({ id }: { id: string }) {
  const artifact = findArtifactById(id);

  if (!artifact) {
    return <>Artifact not found.</>;
  }

  return (
    <Suspense fallback={null}>
      <artifact.Component />
    </Suspense>
  );
}
