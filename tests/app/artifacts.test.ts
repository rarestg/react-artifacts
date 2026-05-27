import assert from 'node:assert/strict';
import test from 'node:test';

import { getArtifactSidebarGroupIndex, sortArtifactsForSidebar } from '../../src/artifactOrdering';

test('artifact sidebar order keeps tools first, unpinned artifacts in the middle, and examples last', () => {
  const sortedIds = sortArtifactsForSidebar([
    { id: 'example-app', name: 'Example App' },
    { id: 'zebra-tool', name: 'Zebra Tool' },
    { id: 'palette-lab', name: 'Palette Lab' },
    { id: 'alpha-tool', name: 'Alpha Tool' },
    { id: 'example', name: 'Example' },
    { id: 'jsonl-structure-viewer', name: 'JSONL Structure Viewer' },
    { id: 'message-unescaper', name: 'Message Unescaper' },
    { id: 'prompt-library', name: 'Prompt Library' },
  ]).map((artifact) => artifact.id);

  assert.deepEqual(sortedIds, [
    'prompt-library',
    'message-unescaper',
    'jsonl-structure-viewer',
    'palette-lab',
    'alpha-tool',
    'zebra-tool',
    'example',
    'example-app',
  ]);
});

test('example artifacts are assigned to the bottom sidebar group', () => {
  for (const id of ['example', 'example-app']) {
    assert.equal(getArtifactSidebarGroupIndex(id), 2);
  }
});
