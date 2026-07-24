import { type ComponentType, lazy } from 'react';

import type { ArtifactMeta } from './artifactManifest';
import { sortArtifactsForSidebar } from './artifactOrdering';

const modules = import.meta.glob<{ default: ComponentType }>('./artifacts/*/index.tsx');
const metaModules = import.meta.glob<{ default: ArtifactMeta }>('./artifacts/*/meta.ts', { eager: true });

export const artifacts = sortArtifactsForSidebar(
  Object.entries(modules).map(([path, loader]) => {
    const folder = path.replace('./artifacts/', '').replace('/index.tsx', '');
    const meta = metaModules[`./artifacts/${folder}/meta.ts`]?.default;
    return {
      id: folder,
      name: meta?.name ?? folder,
      subtitle: meta?.subtitle,
      kind: meta?.kind,
      model: meta?.model,
      version: meta?.version,
      Component: lazy(loader),
    };
  }),
);

export type ArtifactEntry = (typeof artifacts)[number];

export const findArtifactById = (id?: string) => artifacts.find((a) => a.id === id);
