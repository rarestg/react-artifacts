import assert from 'node:assert/strict';
import { test } from 'node:test';

import { computeResizePlan, type ResizeRect } from '../../src/artifacts/jsonl-structure-viewer/lib/resizePlan';

const rect = (top: number, bottom: number): ResizeRect => ({
  top,
  bottom,
  height: bottom - top,
});

test('computeResizePlan adds internal slack to viewport slack', () => {
  const plan = computeResizePlan({
    windowInnerHeight: 1000,
    elementRect: rect(500, 700),
    panelRect: rect(400, 800),
    gridRect: rect(400, 830),
    contentRect: rect(0, 900),
    panelContentRect: rect(400, 780),
    panelContentIsLast: true,
    minHeight: 150,
  });

  assert.equal(plan.viewportSlack, 100);
  assert.equal(plan.gridSlack, 30);
  assert.equal(plan.panelSlack, 20);
  assert.equal(plan.internalSlack, 50);
  assert.equal(plan.slack, 150);
  assert.equal(plan.safeSlack, 149);
  assert.equal(plan.nextHeight, 349);
  assert.equal(plan.shouldExpand, true);
});

test('computeResizePlan skips expansion when no slack is available', () => {
  const plan = computeResizePlan({
    windowInnerHeight: 800,
    elementRect: rect(0, 200),
    panelRect: rect(0, 800),
    gridRect: rect(0, 800),
    contentRect: rect(0, 800),
    panelContentRect: rect(0, 800),
    panelContentIsLast: true,
    minHeight: 240,
  });

  assert.equal(plan.slack, 0);
  assert.equal(plan.safeSlack, 0);
  assert.equal(plan.nextHeight, 240);
  assert.equal(plan.shouldExpand, false);
});
