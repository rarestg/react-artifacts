import exampleMeta from './artifacts/example/meta';
import exampleAppMeta from './artifacts/example-app/meta';
import jsonlStructureViewerMeta from './artifacts/jsonl-structure-viewer/meta';
import messageUnescaperMeta from './artifacts/message-unescaper/meta';
import paletteLabMeta from './artifacts/palette-lab/meta';
import pdfOcrMeta from './artifacts/pdf-ocr/meta';
import promptLibraryMeta from './artifacts/prompt-library/meta';
import sharp2Meta from './artifacts/sharp2/meta';

export type ArtifactMeta = {
  name?: string;
  subtitle?: string;
  kind?: 'single' | 'app';
  model?: string;
  version?: string;
  /** Keep this artifact out of the sitemap and serve its pages with a robots noindex tag. */
  noindex?: boolean;
};

export type ArtifactManifestEntry = {
  id: string;
  meta?: ArtifactMeta;
};

/**
 * Explicit registry of artifact folders for the Worker (SEO meta injection, sitemap), which
 * cannot use import.meta.glob. Every folder under src/artifacts/ must be listed here —
 * tests/app/artifactManifest.test.ts fails when the list drifts.
 */
export const artifactManifest: readonly ArtifactManifestEntry[] = [
  { id: 'prompt-library', meta: promptLibraryMeta },
  { id: 'message-unescaper', meta: messageUnescaperMeta },
  { id: 'jsonl-structure-viewer', meta: jsonlStructureViewerMeta },
  { id: 'palette-lab', meta: paletteLabMeta },
  { id: 'pdf-ocr', meta: pdfOcrMeta },
  { id: 'sharp2', meta: sharp2Meta },
  { id: 'example', meta: exampleMeta },
  { id: 'example-app', meta: exampleAppMeta },
];
