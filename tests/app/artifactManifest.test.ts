import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { artifactManifest } from '../../src/artifactManifest';

test('artifact manifest exactly matches the folders under src/artifacts', () => {
  const artifactsDir = fileURLToPath(new URL('../../src/artifacts', import.meta.url));
  const folders = readdirSync(artifactsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const ids = artifactManifest.map((entry) => entry.id).sort();

  assert.deepEqual(ids, folders);
});
