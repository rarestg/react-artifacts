import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Window } from 'happy-dom';

import { isEditableEventTarget } from '../../src/lib/isEditableEventTarget';

// The helper resolves `HTMLElement` from the page's globals at call time.
test('isEditableEventTarget flags typing controls and contenteditable regions only', () => {
  const previousDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'HTMLElement');
  const window = new Window({ url: 'https://react-artifacts.test/' });
  Object.defineProperty(globalThis, 'HTMLElement', { configurable: true, value: window.HTMLElement, writable: true });

  try {
    const document = window.document as unknown as Document;

    for (const tag of ['input', 'textarea', 'select'] as const) {
      assert.equal(isEditableEventTarget(document.createElement(tag)), true, `<${tag}> must count as editable`);
    }

    const region = document.createElement('div');
    region.setAttribute('contenteditable', 'true');
    const child = document.createElement('span');
    region.append(child);
    document.body.append(region);
    assert.equal(isEditableEventTarget(region), true, 'a contenteditable region must count as editable');
    assert.equal(isEditableEventTarget(child), true, 'children inherit contenteditable');

    assert.equal(isEditableEventTarget(document.createElement('a')), false, 'plain elements are not editable');
    assert.equal(isEditableEventTarget(document.body), false, 'the body is not editable');
    assert.equal(isEditableEventTarget(window as unknown as EventTarget), false, 'the window is not editable');
    assert.equal(isEditableEventTarget(null), false, 'a null target is not editable');
  } finally {
    window.close();
    if (previousDescriptor === undefined) {
      Reflect.deleteProperty(globalThis, 'HTMLElement');
    } else {
      Object.defineProperty(globalThis, 'HTMLElement', previousDescriptor);
    }
  }
});
