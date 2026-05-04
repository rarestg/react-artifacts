import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ConversationTurn } from '../../src/artifacts/sharp2/conversation/ConversationTurn';
import { getTurnItemKey, getTurnKey } from '../../src/artifacts/sharp2/conversation/keys';
import { MessageCard } from '../../src/artifacts/sharp2/conversation/MessageCard';
import { getDefaultRenderMode, splitMessageContent } from '../../src/artifacts/sharp2/conversation/markdown';
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

test('MessageCard uses shared role defaults for real rendering', () => {
  const cases = [
    { role: 'user', content: 'Keep **bold** literal' },
    { role: 'assistant', content: 'Render **bold** inline' },
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

test('MessageCard delegates role defaults to getDefaultRenderMode', () => {
  const source = readFileSync('src/artifacts/sharp2/conversation/MessageCard.tsx', 'utf8');

  assert.match(source, /getDefaultRenderMode/);
  assert.doesNotMatch(source, /defaultRender/);
});

test('conversation key helpers prefer supplied ids', () => {
  const turn: ConversationTurnData = { id: 'turn-id', turnNumber: 1, items: [] };

  assert.equal(getTurnKey(turn), 'turn-id');
  assert.equal(getTurnItemKey({ id: 'message-id', role: 'user', content: 'Hi' }), 'message-id');
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
