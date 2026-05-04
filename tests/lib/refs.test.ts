import assert from 'node:assert/strict';
import { test } from 'node:test';

import { assignRef } from '../../src/lib/refs';

type TestNode = {
  id: string;
};

test('assignRef calls callback refs with node and null values', () => {
  const node = { id: 'input' };
  const values: Array<TestNode | null> = [];

  assignRef<TestNode>((value) => values.push(value), node);
  assignRef<TestNode>((value) => values.push(value), null);

  assert.deepEqual(values, [node, null]);
});

test('assignRef updates object ref current values', () => {
  const node = { id: 'button' };
  const ref: { current: TestNode | null } = { current: null };

  assignRef(ref, node);
  assert.equal(ref.current, node);

  assignRef(ref, null);
  assert.equal(ref.current, null);
});

test('assignRef ignores empty refs', () => {
  const node = { id: 'panel' };

  assert.doesNotThrow(() => {
    assignRef<TestNode>(null, node);
    assignRef<TestNode>(undefined, node);
  });
});
