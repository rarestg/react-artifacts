import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getMobileArtifactRedirectUrl } from '../../src/lib/artifactUrl';

const ids = ['message-unescaper', 'palette-lab'] as const;

test('getMobileArtifactRedirectUrl maps a valid ?artifact= to the standalone URL', () => {
  assert.equal(getMobileArtifactRedirectUrl('?artifact=palette-lab', ids), '/artifact/palette-lab');
});

test('getMobileArtifactRedirectUrl ignores unknown artifact ids', () => {
  assert.equal(getMobileArtifactRedirectUrl('?artifact=definitely-not-real', ids), undefined);
});

test('getMobileArtifactRedirectUrl ignores an absent or empty artifact param', () => {
  assert.equal(getMobileArtifactRedirectUrl('', ids), undefined);
  assert.equal(getMobileArtifactRedirectUrl('?other=1', ids), undefined);
  assert.equal(getMobileArtifactRedirectUrl('?artifact=', ids), undefined);
});

test('getMobileArtifactRedirectUrl percent-encodes the id in the target URL', () => {
  assert.equal(getMobileArtifactRedirectUrl('?artifact=a%20b', ['a b']), '/artifact/a%20b');
});
