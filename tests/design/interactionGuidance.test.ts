import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('artifact design guide requires pointer cursor affordance for enabled click targets', async () => {
  const guide = await readFile('design/ARTIFACT_DESIGN_GUIDE.md', 'utf8');

  assert.match(guide, /pointer cursor/i);
  assert.match(guide, /cursor-not-allowed/i);
  assert.match(guide, /Do not use `pointer-events-none` as the default disabled state for real controls/i);
});
