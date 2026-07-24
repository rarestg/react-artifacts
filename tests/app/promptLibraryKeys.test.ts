import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Window } from 'happy-dom';
import * as React from 'react';
import { act, createElement } from 'react';

import { countResolvedGridColumns, getNextCardIndex } from '../../src/artifacts/prompt-library/cardKeyNavigation';
import { prompts, renderPromptText } from '../../src/artifacts/prompt-library/prompts';
import { filterPromptsByTags } from '../../src/artifacts/prompt-library/search';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

// Base UI Dialog/Autocomplete + floating-ui reference these as bare globals during a client render.
const globalKeys = [
  'CustomEvent',
  'Document',
  'DocumentFragment',
  'Element',
  'Event',
  'HTMLButtonElement',
  'HTMLDivElement',
  'HTMLElement',
  'HTMLInputElement',
  'KeyboardEvent',
  'MouseEvent',
  'MutationObserver',
  'Node',
  'NodeFilter',
  'PointerEvent',
  'ResizeObserver',
  'cancelAnimationFrame',
  'document',
  'getComputedStyle',
  'navigator',
  'requestAnimationFrame',
  'window',
] as const;

test('countResolvedGridColumns parses resolved track lists and falls back on unresolved values', () => {
  assert.equal(countResolvedGridColumns('340px 340px 340px'), 3, 'a resolved px track list counts its tracks');
  assert.equal(countResolvedGridColumns('339.5px 340.25px'), 2, 'decimal track sizes still count');
  assert.equal(countResolvedGridColumns('1fr 1fr'), 2, 'fr tracks count');
  assert.equal(countResolvedGridColumns('50% 50%'), 2, 'percentage tracks count');
  assert.equal(countResolvedGridColumns('664px'), 1, 'a single column resolves to 1');
  assert.equal(countResolvedGridColumns('340px 340px 0px'), 2, 'collapsed auto-fit tracks (0px) hold no cards');
  assert.equal(countResolvedGridColumns('0px'), 1, 'an all-collapsed list still reports one column');
  assert.equal(
    countResolvedGridColumns('repeat(auto-fit, minmax(min(18rem, 100%), 1fr))'),
    1,
    'the authored value seen in layout-less DOMs falls back to one column',
  );
  assert.equal(countResolvedGridColumns(''), 1, 'an empty value falls back');
  assert.equal(countResolvedGridColumns('none'), 1, '"none" falls back');
});

test('getNextCardIndex implements vim moves over an 8-card, 3-column grid', () => {
  // Rows: [0 1 2] [3 4 5] [6 7]
  assert.equal(getNextCardIndex('l', 2, 8, 3), 3, 'l crosses a row boundary linearly');
  assert.equal(getNextCardIndex('h', 3, 8, 3), 2, 'h crosses a row boundary linearly');
  assert.equal(getNextCardIndex('h', 0, 8, 3), null, 'h on the first card no-ops');
  assert.equal(getNextCardIndex('l', 7, 8, 3), null, 'l on the last card no-ops');
  assert.equal(getNextCardIndex('j', 0, 8, 3), 3, 'j moves one visual row down');
  assert.equal(getNextCardIndex('j', 4, 8, 3), 7, 'j into the shorter last row lands on the same column');
  assert.equal(getNextCardIndex('j', 5, 8, 3), 7, 'j past the last row clamps to the last card');
  assert.equal(getNextCardIndex('j', 7, 8, 3), null, 'j on the last card no-ops');
  assert.equal(getNextCardIndex('k', 3, 8, 3), 0, 'k moves one visual row up');
  assert.equal(getNextCardIndex('k', 1, 8, 3), null, 'k above the first row no-ops');
  assert.equal(getNextCardIndex('k', 2, 8, 3), null, 'k never wraps to an earlier row');
  for (const key of ['h', 'j', 'k', 'l']) {
    assert.equal(getNextCardIndex(key, -1, 8, 3), 0, `${key} with nothing focused lands on the first card`);
  }
  assert.equal(getNextCardIndex('x', -1, 8, 3), null, 'non-navigation keys never focus a card');
  assert.equal(getNextCardIndex('j', -1, 0, 3), null, 'an empty grid is a no-op');
});

type Harness = {
  window: InstanceType<typeof Window>;
  copiedTexts: string[];
  dispatchKey: (init: KeyboardEventInit, target?: EventTarget) => Promise<KeyboardEvent>;
  titleButtons: () => HTMLButtonElement[];
};

// Renders the full PromptLibrary against a fresh happy-dom window (clipboard stubbed)
// and hands the harness to `run`. Modules are imported after the globals exist so
// Base UI loads in browser mode and portals mount into the DOM.
async function withPromptLibrary(run: (harness: Harness) => Promise<void>) {
  const previousGlobals = new Map<string, PropertyDescriptor | undefined>();
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  const window = new Window({ url: 'https://react-artifacts.test/' });
  const source = window as unknown as Record<string, unknown>;

  for (const key of globalKeys) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: source[key], writable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  const copiedTexts: string[] = [];
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        copiedTexts.push(text);
      },
    },
  });

  const { createRoot } = await import('react-dom/client');
  const { default: PromptLibrary } = await import('../../src/artifacts/prompt-library');

  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container);

  const dispatchKey = async (init: KeyboardEventInit, target?: EventTarget) => {
    const eventTarget = target ?? window.document.activeElement ?? window.document.body;
    const event = new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    await act(async () => {
      eventTarget.dispatchEvent(event as unknown as Event);
    });
    return event as unknown as KeyboardEvent;
  };

  const titleButtons = () =>
    [...window.document.querySelectorAll('[data-prompt-card-title]')] as unknown as HTMLButtonElement[];

  try {
    await act(async () => {
      root.render(createElement(PromptLibrary));
    });
    await run({ window, copiedTexts, dispatchKey, titleButtons });
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    window.close();

    for (const key of globalKeys) {
      const descriptor = previousGlobals.get(key);
      if (descriptor === undefined) {
        Reflect.deleteProperty(globalThis, key);
      } else {
        Object.defineProperty(globalThis, key, descriptor);
      }
    }
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
}

test('grid hjkl navigation walks cards, c copies the focused card, and every guard holds', async () => {
  await withPromptLibrary(async ({ window, copiedTexts, dispatchKey, titleButtons }) => {
    const activeElement = () => window.document.activeElement;
    assert.equal(titleButtons().length, prompts.length, 'every prompt renders a card title button');

    // First keypress focuses the first card; happy-dom reports the authored
    // grid-template-columns, so the stride falls back to 1 and j/k act as next/prev.
    await dispatchKey({ key: 'j' });
    assert.equal(activeElement(), titleButtons()[0], 'a navigation key with nothing focused lands on the first card');

    await dispatchKey({ key: 'l' });
    assert.equal(activeElement(), titleButtons()[1], 'l focuses the next card');
    await dispatchKey({ key: 'l', repeat: true });
    assert.equal(activeElement(), titleButtons()[2], 'held-key repeats keep walking for movement keys');
    await dispatchKey({ key: 'h' });
    assert.equal(activeElement(), titleButtons()[1], 'h focuses the previous card');
    await dispatchKey({ key: 'j' });
    assert.equal(activeElement(), titleButtons()[2], 'j falls back to next-card under the 1-column stride');
    await dispatchKey({ key: 'k' });
    assert.equal(activeElement(), titleButtons()[1], 'k falls back to previous-card under the 1-column stride');

    await dispatchKey({ key: 'h' });
    const edgeH = await dispatchKey({ key: 'h' });
    assert.equal(activeElement(), titleButtons()[0], 'h on the first card is an edge no-op');
    assert.equal(edgeH.defaultPrevented, false, 'edge no-ops do not consume the key');
    await dispatchKey({ key: 'k' });
    assert.equal(activeElement(), titleButtons()[0], 'k above the first row is an edge no-op');

    const last = titleButtons().length - 1;
    titleButtons()[last]?.focus();
    await dispatchKey({ key: 'l' });
    assert.equal(activeElement(), titleButtons()[last], 'l on the last card is an edge no-op');
    await dispatchKey({ key: 'j' });
    assert.equal(activeElement(), titleButtons()[last], 'j on the last card is an edge no-op');

    // Modifier, IME, shift-layer, and already-handled keystrokes never move focus.
    titleButtons()[1]?.focus();
    for (const init of [
      { key: 'l', ctrlKey: true },
      { key: 'l', metaKey: true },
      { key: 'l', altKey: true },
      { key: 'l', isComposing: true },
      { key: 'L' },
      { key: 'H' },
    ] satisfies KeyboardEventInit[]) {
      await dispatchKey(init);
      assert.equal(activeElement(), titleButtons()[1], `${JSON.stringify(init)} must not move focus`);
    }
    const preventFirst = (event: Event) => event.preventDefault();
    window.addEventListener('keydown', preventFirst, { capture: true });
    await dispatchKey({ key: 'l' });
    window.removeEventListener('keydown', preventFirst, { capture: true });
    assert.equal(activeElement(), titleButtons()[1], 'an already-handled keystroke is ignored');

    // Editable targets keep their keys, even with no card focused.
    const input = window.document.createElement('input');
    window.document.body.append(input);
    input.focus();
    await dispatchKey({ key: 'l' });
    assert.equal(activeElement(), input, 'typing l into an editable target does not steal focus');
    await dispatchKey({ key: 'c' });
    assert.deepEqual(copiedTexts, [], 'typing c into an editable target does not copy');
    input.remove();

    // c copies the focused card through its own CopyButton.
    const secondTitle = titleButtons()[1];
    assert.ok(secondTitle);
    secondTitle.focus();
    await dispatchKey({ key: 'c' });
    const secondPrompt = prompts[1];
    assert.ok(secondPrompt);
    assert.deepEqual(copiedTexts, [renderPromptText(secondPrompt)], 'c copies the focused card rendered prompt');
    assert.equal(activeElement(), secondTitle, 'copying keeps focus on the title button');
    const secondCard = secondTitle.closest('[data-prompt-card]');
    const announcement = secondCard?.querySelector('[data-prompt-card-copy] [aria-live]');
    assert.equal(announcement?.textContent, 'Copied to clipboard', 'feedback lands on the visible card button');

    // c also fires with focus elsewhere inside the card (the copy button itself).
    const secondCopyButton = secondCard?.querySelector('[data-prompt-card-copy]') as unknown as HTMLButtonElement;
    secondCopyButton.focus();
    await dispatchKey({ key: 'c' });
    assert.equal(copiedTexts.length, 2, 'c fires from anywhere inside the card');

    // Copy guards: repeat, shift layer, native shortcuts, and no focused card.
    for (const init of [
      { key: 'c', repeat: true },
      { key: 'C' },
      { key: 'c', ctrlKey: true },
      { key: 'c', metaKey: true },
    ] satisfies KeyboardEventInit[]) {
      await dispatchKey(init);
      assert.equal(copiedTexts.length, 2, `${JSON.stringify(init)} must not copy`);
    }
    (activeElement() as unknown as HTMLElement).blur();
    await dispatchKey({ key: 'c' }, window.document.body);
    assert.equal(copiedTexts.length, 2, 'c with no card focused is a no-op');

    // The command palette suspends the whole scheme; closing it restores the keys.
    await dispatchKey({ key: 'k', metaKey: true }, window.document.body);
    await dispatchKey({ key: 'l' });
    assert.ok(!titleButtons().includes(activeElement() as unknown as HTMLButtonElement), 'l is inert while open');
    await dispatchKey({ key: 'c' });
    assert.equal(copiedTexts.length, 2, 'c is inert while the palette is open');
    await dispatchKey({ key: 'k', metaKey: true }, window.document.body);
    (activeElement() as unknown as HTMLElement | null)?.blur?.();
    await dispatchKey({ key: 'j' }, window.document.body);
    assert.equal(activeElement(), titleButtons()[0], 'closing the palette restores navigation');

    // Filtering re-derives the card list at keypress time. Base UI checkboxes
    // toggle on Space (keydown + keyup) per the ARIA checkbox pattern.
    const filterToggle = window.document.querySelector(
      'section[aria-label="Prompt tags"] [role="checkbox"]',
    ) as unknown as HTMLElement;
    assert.ok(filterToggle);
    filterToggle.focus();
    await dispatchKey({ key: ' ' }, filterToggle);
    await act(async () => {
      filterToggle.dispatchEvent(new window.KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true }));
    });
    const firstTag = (await import('../../src/artifacts/prompt-library/prompts')).promptTags[0];
    assert.ok(firstTag);
    const filtered = filterPromptsByTags(prompts, [firstTag.id]);
    assert.notEqual(filtered.length, prompts.length, 'the first tag actually filters the grid');
    assert.equal(titleButtons().length, filtered.length, 'filtered cards re-render');
    (activeElement() as unknown as HTMLElement | null)?.blur?.();
    await dispatchKey({ key: 'j' }, window.document.body);
    assert.equal(
      (activeElement() as unknown as HTMLElement).textContent,
      filtered[0]?.title,
      'navigation targets the freshly filtered card list',
    );
  });
});

test('detail dialog scopes c to its footer copy button without hijacking the Stepper', async () => {
  await withPromptLibrary(async ({ window, copiedTexts, dispatchKey, titleButtons }) => {
    const stepperPrompt = prompts.find((entry) => entry.id === 'parallel-draft-synthesis');
    assert.ok(stepperPrompt, 'the Stepper-equipped prompt exists');
    const stepperIndex = prompts.indexOf(stepperPrompt);
    const title = titleButtons()[stepperIndex];
    assert.ok(title);

    await act(async () => {
      title.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    const dialog = window.document.querySelector('[role="dialog"]');
    assert.ok(dialog, 'clicking a card title opens the detail dialog');

    // Grid navigation is inert while the dialog is open.
    const focusBefore = window.document.activeElement;
    await dispatchKey({ key: 'l' });
    assert.equal(window.document.activeElement, focusBefore, 'l does not walk the background grid');
    assert.ok(
      !titleButtons().includes(window.document.activeElement as unknown as HTMLButtonElement),
      'no background card steals focus while the dialog is open',
    );

    // c triggers the footer Copy Prompt button with the currently rendered prompt.
    await dispatchKey({ key: 'c' });
    const renderedPrompt = dialog.querySelector('[data-prompt-detail-section="prompt"] pre')?.textContent;
    assert.ok(renderedPrompt);
    assert.deepEqual(copiedTexts, [renderedPrompt], 'c copies exactly what the dialog displays');
    const footerCopy = dialog.querySelector(`[aria-label="Copy ${stepperPrompt.title}"] [aria-live]`);
    assert.equal(footerCopy?.textContent, 'Copied to clipboard', 'feedback lands on the footer button');

    // Guards: held key, native shortcut, and the Stepper's editable number input.
    await dispatchKey({ key: 'c', repeat: true });
    await dispatchKey({ key: 'c', ctrlKey: true });
    await dispatchKey({ key: 'c', metaKey: true });
    assert.equal(copiedTexts.length, 1, 'repeat and modifier chords never copy');

    const stepperInput = dialog.querySelector('input[type="number"]');
    assert.ok(stepperInput, 'the dialog renders the Stepper number input');
    (stepperInput as unknown as HTMLInputElement).focus();
    await dispatchKey({ key: 'c' }, stepperInput);
    assert.equal(copiedTexts.length, 1, 'typing c into the Stepper input does not copy');

    // Cmd+K stacks the palette over the dialog; c must stay inert until it closes.
    await dispatchKey({ key: 'k', metaKey: true }, window.document.body);
    await dispatchKey({ key: 'c' }, window.document.body);
    assert.equal(copiedTexts.length, 1, 'c is inert while the palette covers the dialog');
    await dispatchKey({ key: 'k', metaKey: true }, window.document.body);
    await dispatchKey({ key: 'c' }, window.document.body);
    assert.equal(copiedTexts.length, 2, 'closing the palette re-arms the dialog copy key');
  });
});

test('focus polish: card-level ring, header legend, and contextual C chip classes are wired', async () => {
  await withPromptLibrary(async ({ window, titleButtons }) => {
    // The moving ring belongs to the card, scoped to the title's :focus-visible only, and offsets
    // against the page background the card actually sits on.
    const cards = [...window.document.querySelectorAll('[data-prompt-card]')];
    assert.equal(cards.length, prompts.length, 'every prompt renders a card');
    for (const card of cards) {
      const cardClasses = (card.getAttribute('class') ?? '').split(/\s+/);
      assert.ok(cardClasses.includes('group/prompt-card'), 'the card is the named group for the chip reveal');
      for (const ringClass of [
        'has-[[data-prompt-card-title]:focus-visible]:ring-2',
        'has-[[data-prompt-card-title]:focus-visible]:ring-[var(--ring)]',
        'has-[[data-prompt-card-title]:focus-visible]:ring-offset-1',
        'has-[[data-prompt-card-title]:focus-visible]:ring-offset-[color:var(--surface-muted)]',
      ]) {
        assert.ok(cardClasses.includes(ringClass), `the card carries ${ringClass}`);
      }
    }
    for (const title of titleButtons()) {
      const titleClasses = (title.getAttribute('class') ?? '').split(/\s+/);
      assert.ok(titleClasses.includes('focus:outline-none'), 'the title button still suppresses the UA outline');
      assert.ok(
        !titleClasses.some((className) => className.includes('focus-visible:ring')),
        'the title button no longer draws its own focus ring',
      );
    }

    // The header legend is decorative, sits in the header, and hides where a keyboard is unlikely.
    const legend = window.document.querySelector('[data-prompt-keys-legend]');
    assert.ok(legend, 'the header renders the keyboard legend');
    assert.ok(window.document.querySelector('header')?.contains(legend), 'the legend lives in the page header');
    assert.equal(legend.getAttribute('aria-hidden'), 'true', 'the legend is decorative');
    const legendClasses = (legend.getAttribute('class') ?? '').split(/\s+/);
    assert.ok(legendClasses.includes('max-md:hidden'), 'the legend hides on narrow viewports');
    assert.ok(legendClasses.includes('pointer-coarse:hidden'), 'the legend hides for coarse pointers');
    assert.deepEqual(
      [...legend.querySelectorAll('kbd')].map((chip) => chip.textContent),
      ['H', 'J', 'K', 'L', 'C'],
      'the legend lists the movement keys and the copy key',
    );
    assert.match(legend.textContent ?? '', /move/, 'the legend labels the movement cluster');
    assert.match(legend.textContent ?? '', /copy/, 'the legend labels the copy key');

    // Every card copy button carries the C chip, revealed only while its own card holds focus.
    for (const card of cards) {
      const chip = card.querySelector('[data-prompt-card-copy] kbd');
      assert.ok(chip, 'the card copy button carries the C chip');
      assert.equal(chip.textContent, 'C');
      assert.equal(chip.getAttribute('aria-hidden'), 'true', 'the chip is decorative');
      const chipClasses = (chip.getAttribute('class') ?? '').split(/\s+/);
      assert.ok(chipClasses.includes('hidden'), 'the chip is hidden at rest');
      for (const revealClass of [
        'group-has-[[data-prompt-card-title]:focus-visible]/prompt-card:inline-flex',
        'group-has-[[data-prompt-card-copy]:focus-visible]/prompt-card:inline-flex',
      ]) {
        assert.ok(chipClasses.includes(revealClass), `the chip carries ${revealClass}`);
      }
    }
  });
});
