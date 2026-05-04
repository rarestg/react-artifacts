import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ConversationTurn } from '../../src/artifacts/sharp2/conversation/ConversationTurn';
import { getTurnItemKey, getTurnKey } from '../../src/artifacts/sharp2/conversation/keys';
import { MessageCard } from '../../src/artifacts/sharp2/conversation/MessageCard';
import { getDefaultRenderMode, splitMessageContent } from '../../src/artifacts/sharp2/conversation/markdown';
import { getTokenUsageSummary, TokenCounter } from '../../src/artifacts/sharp2/conversation/TokenCounter';
import { ToolCall } from '../../src/artifacts/sharp2/conversation/ToolCall';
import type { ConversationTurnData } from '../../src/artifacts/sharp2/conversation/types';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

test('splitMessageContent keeps fenced code blocks literal', () => {
  const parts = splitMessageContent('Intro\n\n```ts\nconst value = `raw`;\n```\n\nOutro');

  assert.deepEqual(
    parts.map((part) => part.type),
    ['text', 'code', 'text'],
  );
  assert.equal(parts[1]?.type, 'code');
  assert.equal(parts[1]?.content, 'const value = `raw`;\n');
});

test('getDefaultRenderMode follows role defaults', () => {
  assert.equal(getDefaultRenderMode('user'), 'literal');
  assert.equal(getDefaultRenderMode('assistant'), 'rendered');
  assert.equal(getDefaultRenderMode('thinking'), 'rendered');
  assert.equal(getDefaultRenderMode('tool'), 'literal');
});

test('MessageCard follows role defaults for real rendering', () => {
  const cases = [
    { role: 'user', content: 'User **bold** content' },
    { role: 'assistant', content: 'Assistant **bold** content' },
    { role: 'thinking', content: 'Thinking **bold** content' },
    { role: 'tool', content: 'Tool **bold** content' },
  ] as const;

  for (const { role, content } of cases) {
    const markup = renderToStaticMarkup(
      createElement(MessageCard, {
        role,
        content,
      }),
    );

    if (getDefaultRenderMode(role) === 'literal') {
      assert.match(markup, /\*\*bold\*\*/);
      assert.doesNotMatch(markup, /<strong/);
    } else {
      assert.match(markup, /<strong/);
      assert.match(markup, />bold<\/strong>/);
    }
  }
});

test('MessageCard hides render mode toggle when no toggle handler is provided', () => {
  const markup = renderToStaticMarkup(
    createElement(MessageCard, {
      role: 'assistant',
      content: 'Plain assistant message',
    }),
  );

  assert.doesNotMatch(markup, />Rendered<\/button>/);
});

test('MessageCard shows render mode toggle when a toggle handler is provided', () => {
  const markup = renderToStaticMarkup(
    createElement(MessageCard, {
      role: 'assistant',
      content: 'Plain assistant message',
      onToggleRender: () => {},
    }),
  );

  assert.match(markup, />Rendered<\/button>/);
});

test('conversation key helpers prefer supplied ids', () => {
  const turn: ConversationTurnData = { id: 'turn-id', turnNumber: 1, items: [] };

  assert.equal(getTurnKey(turn), 'turn-id');
  assert.equal(getTurnItemKey({ id: 'message-id', role: 'user', content: 'Hi' }, 12), 'message-id');
});

test('TokenCounter shows invalid limits explicitly in visible and copied summaries', () => {
  const props = { used: 75, limit: 0, label: 'Budget' };
  const summary = getTokenUsageSummary(props);
  const markup = renderToStaticMarkup(createElement(TokenCounter, props));

  assert.deepEqual(summary, {
    usageText: '75 / invalid limit',
    percentageText: 'percentage unavailable',
    copyText: 'Budget: 75 / invalid limit (percentage unavailable)',
    percentage: null,
    filledBlocks: 0,
    emptyBlocks: 20,
  });
  assert.match(markup, /75 \/ invalid limit/);
  assert.match(markup, /percentage unavailable/);
  assert.doesNotMatch(markup, /75 \/ 0 tokens/);
  assert.doesNotMatch(markup, /75 \/ 1 tokens/);
  assert.doesNotMatch(markup, /100% Used/);
});

test('TokenCounter keeps copied valid token counts exact', () => {
  assert.equal(
    getTokenUsageSummary({ used: 1240, limit: 200000, label: 'Budget' }).copyText,
    'Budget: 1240 / 200000 tokens (1% Used)',
  );
});

test('conversation fallback keys distinguish same-length semantic content', () => {
  assert.notEqual(
    getTurnItemKey({ role: 'user', timestamp: '10:00', content: 'ab' }),
    getTurnItemKey({ role: 'user', timestamp: '10:00', content: 'cd' }),
  );

  assert.notEqual(
    getTurnItemKey({
      type: 'tool_call',
      tool: 'bash',
      timestamp: '10:00',
      input: 'ab',
      output: 'xy',
    }),
    getTurnItemKey({
      type: 'tool_call',
      tool: 'bash',
      timestamp: '10:00',
      input: 'cd',
      output: 'zw',
    }),
  );
});

test('conversation fallback keys use original indexes to distinguish identical siblings', () => {
  const message = { role: 'assistant', content: 'Repeated fallback message' } as const;
  const toolCall = { type: 'tool_call', tool: 'bash', input: 'npm test', output: 'PASS' } as const;

  assert.notEqual(getTurnItemKey(message, 0), getTurnItemKey(message, 1));
  assert.notEqual(getTurnItemKey(toolCall, 2), getTurnItemKey(toolCall, 3));
});

test('ConversationTurn filters hidden item types', () => {
  const turn: ConversationTurnData = {
    id: 'turn-1',
    turnNumber: 1,
    items: [
      { id: 'user', role: 'user', content: 'Question' },
      { id: 'thinking', role: 'thinking', content: 'Reasoning' },
      { id: 'tool', type: 'tool_call', tool: 'bash', input: 'npm test', output: 'PASS' },
      { id: 'assistant', role: 'assistant', content: 'Answer' },
    ],
  };

  const markup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: turn.turnNumber,
      items: turn.items,
      visibleTypes: {
        user: true,
        assistant: true,
        thinking: false,
        toolCalls: false,
        tokenCounters: true,
      },
    }),
  );

  assert.match(markup, /Question/);
  assert.match(markup, /Answer/);
  assert.doesNotMatch(markup, /Reasoning/);
  assert.doesNotMatch(markup, /npm test/);
});

test('ConversationTurn filters tool-role messages with the toolCalls bucket', () => {
  const markup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items: [
        { id: 'user', role: 'user', content: 'Question' },
        { id: 'tool-role', role: 'tool', content: 'Raw tool transcript output' },
        { id: 'assistant', role: 'assistant', content: 'Answer' },
      ],
      visibleTypes: {
        user: true,
        assistant: true,
        thinking: true,
        toolCalls: false,
        tokenCounters: true,
      },
    }),
  );

  assert.match(markup, /Question/);
  assert.match(markup, /Answer/);
  assert.doesNotMatch(markup, /Raw tool transcript output/);
});

test('ConversationTurn omits render mode toggles when no toggle handler is provided', () => {
  const markup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items: [{ id: 'assistant', role: 'assistant', content: 'Plain assistant message' }],
    }),
  );

  assert.doesNotMatch(markup, />Rendered<\/button>/);
});

test('ConversationTurn preserves original indexes for duplicate item references', () => {
  const repeatedMessage = {
    id: 'shared-assistant-message',
    role: 'assistant',
    content: 'Render **this** only for the second entry',
  } as const;

  const markup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items: [repeatedMessage, repeatedMessage],
      renderModes: ['literal', 'rendered'],
    }),
  );

  assert.match(markup, /<strong/);
});

test('ToolCall collapse button has an accessible name, expanded state, and visible focus', () => {
  const markup = renderToStaticMarkup(
    createElement(ToolCall, {
      tool: 'bash',
      input: 'npm test',
      output: 'PASS',
      status: 'success',
    }),
  );

  assert.match(markup, /aria-label="Collapse tool call details"/);
  assert.match(markup, /aria-expanded="true"/);
  assert.match(markup, /focus-visible:ring-2/);
});
