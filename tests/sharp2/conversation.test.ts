import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ConversationTurn } from '../../src/artifacts/sharp2/conversation/ConversationTurn';
import { getTurnItemKey, getTurnKey } from '../../src/artifacts/sharp2/conversation/keys';
import { MessageCard } from '../../src/artifacts/sharp2/conversation/MessageCard';
import { getDefaultRenderMode, splitMessageContent } from '../../src/artifacts/sharp2/conversation/markdown';
import {
  getTokenUsageSummary,
  TokenCounter,
  tokenCounterPropsFromTelemetry,
} from '../../src/artifacts/sharp2/conversation/TokenCounter';
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

  assert.doesNotMatch(markup, /aria-pressed/);
});

test('MessageCard shows render mode toggle state when a toggle handler is provided', () => {
  const markup = renderToStaticMarkup(
    createElement(MessageCard, {
      role: 'assistant',
      content: 'Plain assistant message',
      onToggleRender: () => {},
    }),
  );

  assert.match(markup, /aria-pressed="true"/);
  assert.match(markup, /<span[^>]*aria-hidden="true"[^>]*>\s*Rendered\s*<\/span>/);
  assert.match(markup, /<span(?![^>]*aria-hidden)[^>]*>\s*Rendered\s*<\/span>/);
});

test('MessageCard render mode toggle marks raw mode unpressed while reserving rendered width', () => {
  const markup = renderToStaticMarkup(
    createElement(MessageCard, {
      role: 'assistant',
      content: 'Plain assistant message',
      renderMode: 'literal',
      onToggleRender: () => {},
    }),
  );

  assert.match(markup, /aria-pressed="false"/);
  assert.match(markup, /<span[^>]*aria-hidden="true"[^>]*>\s*Rendered\s*<\/span>/);
  assert.match(markup, /<span(?![^>]*aria-hidden)[^>]*>\s*Raw\s*<\/span>/);
});

test('conversation key helpers prefer supplied ids', () => {
  const turn: ConversationTurnData = { id: 'turn-id', turnNumber: 1, items: [] };

  assert.equal(getTurnKey(turn), 'turn-id');
  assert.equal(getTurnItemKey({ id: 'message-id', role: 'user', content: 'Hi' }), 'message-id');
  assert.equal(getTurnItemKey({ id: 'message-id', role: 'user', content: 'Hi' }, 12), 'message-id-12');
});

test('TokenCounter shows invalid limits explicitly in visible and copied summaries', () => {
  const props = { used: 75, limit: 0, label: 'Budget' };
  const summary = getTokenUsageSummary(props);
  const markup = renderToStaticMarkup(createElement(TokenCounter, props));

  assert.deepEqual(summary, {
    usageText: '75 / invalid limit',
    usedText: '75',
    limitText: 'invalid limit',
    percentageText: 'percentage unavailable',
    copyText: 'Budget: 75 / invalid limit (percentage unavailable)',
    percentage: null,
    filledBlocks: 0,
    emptyBlocks: 20,
    cachedText: null,
  });
  assert.match(markup, /Used: 75/);
  assert.match(markup, /Limit: invalid limit/);
  assert.match(markup, /percentage unavailable/);
  assert.doesNotMatch(markup, /75 \/ 0 tokens/);
  assert.doesNotMatch(markup, /75 \/ 1 tokens/);
  assert.doesNotMatch(markup, /100% Used/);
});

test('TokenCounter marks invalid used values unavailable in visible and copied summaries', () => {
  const invalidUsedValues = [Number.NaN, Number.POSITIVE_INFINITY, -1];

  for (const used of invalidUsedValues) {
    assert.deepEqual(getTokenUsageSummary({ used, limit: 200000, label: 'Budget' }), {
      usageText: 'invalid usage / 200,000',
      usedText: 'invalid usage',
      limitText: '200,000',
      percentageText: 'percentage unavailable',
      copyText: 'Budget: invalid usage / 200000 tokens (percentage unavailable)',
      percentage: null,
      filledBlocks: 0,
      emptyBlocks: 20,
      cachedText: null,
    });
  }

  const markup = renderToStaticMarkup(
    createElement(TokenCounter, {
      used: Number.NaN,
      limit: 200000,
      label: 'Budget',
    }),
  );

  assert.match(markup, /Used: invalid usage/);
  assert.match(markup, /Limit: 200,000/);
  assert.match(markup, /percentage unavailable/);
  assert.doesNotMatch(markup, /NaN/);
});

test('TokenCounter keeps copied valid token counts exact', () => {
  assert.equal(
    getTokenUsageSummary({ used: 1240, limit: 200000, label: 'Budget' }).copyText,
    'Budget: 1240 / 200000 tokens (0.6%)',
  );
});

test('TokenCounter displays prototype-style meter glyphs and copies cached counts when explicitly provided', () => {
  const summary = getTokenUsageSummary({ used: 6500, limit: 8096, cached: 0, label: 'Context Window' });
  const markup = renderToStaticMarkup(
    createElement(TokenCounter, {
      used: 6500,
      limit: 8096,
      cached: 0,
      label: 'Context Window',
    }),
  );

  assert.equal(summary.cachedText, '0');
  assert.equal(summary.usedText, '6,500');
  assert.equal(summary.limitText, '8,096');
  assert.equal(summary.percentageText, '80.3%');
  assert.equal(summary.copyText, 'Context Window: 6500 / 8096 tokens | 0 cached (80.3%)');
  assert.match(markup, /▮/);
  assert.match(markup, /---/);
  assert.doesNotMatch(markup, /░/);
  assert.match(markup, /Used: 6,500/);
  assert.match(markup, /Limit: 8,096/);
  assert.match(markup, /Cached: 0/);
});

test('tokenCounterPropsFromTelemetry maps context usage without rate-limit percentages', () => {
  const props = tokenCounterPropsFromTelemetry({
    info: {
      total_token_usage: {
        input_tokens: 3000,
        cached_input_tokens: 1200,
        output_tokens: 900,
        reasoning_output_tokens: 400,
        total_tokens: 6500,
      },
      last_token_usage: {
        input_tokens: 100,
        cached_input_tokens: 0,
        output_tokens: 25,
        reasoning_output_tokens: 5,
        total_tokens: 130,
      },
      model_context_window: 8096,
    },
    rate_limits: {
      primary: { used_percent: 99 },
      secondary: { used_percent: 88 },
    },
  });

  assert.equal(props.used, 6500);
  assert.equal(props.limit, 8096);
  assert.equal(props.cached, 1200);
  assert.equal(props.inputTokens, 3000);
  assert.equal(props.outputTokens, 900);
  assert.equal(props.reasoningOutputTokens, 400);
  assert.deepEqual(props.lastUsage, {
    inputTokens: 100,
    cachedInputTokens: 0,
    outputTokens: 25,
    reasoningOutputTokens: 5,
    totalTokens: 130,
  });
  assert.equal(getTokenUsageSummary(props).percentageText, '80.3%');
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

test('conversation explicit item keys use original indexes to distinguish duplicate ids', () => {
  const firstMessage = { id: 'shared-message', role: 'assistant', content: 'First message' } as const;
  const secondMessage = { id: 'shared-message', role: 'assistant', content: 'Second message' } as const;

  assert.equal(getTurnItemKey(firstMessage, 0), 'shared-message-0');
  assert.equal(getTurnItemKey(secondMessage, 1), 'shared-message-1');
  assert.notEqual(getTurnItemKey(firstMessage, 0), getTurnItemKey(secondMessage, 1));
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
  const hiddenMarkup = renderToStaticMarkup(
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

  assert.match(hiddenMarkup, /Question/);
  assert.match(hiddenMarkup, /Answer/);
  assert.doesNotMatch(hiddenMarkup, /Raw tool transcript output/);
});

test('ConversationTurn hides tool-role detail rows when tool details are disabled', () => {
  const items: ConversationTurnData['items'] = [
    { id: 'user', role: 'user', content: 'Question' },
    { id: 'tool-role', role: 'tool', content: 'Raw tool transcript output' },
    { id: 'assistant', role: 'assistant', content: 'Answer' },
  ];

  const summaryOnlyMarkup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items,
      visibleTypes: {
        user: true,
        assistant: true,
        thinking: true,
        toolCalls: true,
        tokenCounters: true,
      },
      detailVisibility: {
        showToolSummaries: true,
        showToolDetails: false,
      },
    }),
  );
  const detailMarkup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items,
      visibleTypes: {
        user: true,
        assistant: true,
        thinking: true,
        toolCalls: true,
        tokenCounters: true,
      },
      detailVisibility: {
        showToolSummaries: true,
        showToolDetails: true,
      },
    }),
  );

  assert.match(summaryOnlyMarkup, /Question/);
  assert.match(summaryOnlyMarkup, /Answer/);
  assert.doesNotMatch(summaryOnlyMarkup, /Raw tool transcript output/);
  assert.match(summaryOnlyMarkup, />2 items</);
  assert.match(detailMarkup, /Raw tool transcript output/);
  assert.match(detailMarkup, />3 items</);
});

test('ConversationTurn omits render mode toggles when no toggle handler is provided', () => {
  const markup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items: [{ id: 'assistant', role: 'assistant', content: 'Plain assistant message' }],
    }),
  );

  assert.doesNotMatch(markup, /aria-pressed/);
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

  assert.equal(markup.match(/\*\*this\*\*/g)?.length ?? 0, 1);
  assert.equal(markup.match(/<strong\b[^>]*>this<\/strong>/g)?.length ?? 0, 1);
});

test('ConversationTurn shows only the final token counter unless intermediate counters are enabled', () => {
  const items: ConversationTurnData['items'] = [
    { id: 'user', role: 'user', content: 'Question' },
    { id: 'token-1', type: 'token_counter', used: 100, limit: 1000, label: 'Context Window' },
    { id: 'assistant', role: 'assistant', content: 'Answer' },
    { id: 'token-2', type: 'token_counter', used: 200, limit: 1000, label: 'Context Window' },
  ];

  const summaryOnlyMarkup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items,
      visibleTypes: {
        user: true,
        assistant: true,
        thinking: true,
        toolCalls: true,
        tokenCounters: true,
      },
      detailVisibility: {
        showTokenCounters: true,
        showIntermediateTokenCounters: false,
      },
    }),
  );
  const intermediateMarkup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items,
      visibleTypes: {
        user: true,
        assistant: true,
        thinking: true,
        toolCalls: true,
        tokenCounters: true,
      },
      detailVisibility: {
        showTokenCounters: true,
        showIntermediateTokenCounters: true,
      },
    }),
  );

  assert.doesNotMatch(summaryOnlyMarkup, /Used: 100/);
  assert.match(summaryOnlyMarkup, /Used: 200/);
  assert.match(summaryOnlyMarkup, /Limit: 1,000/);
  assert.match(summaryOnlyMarkup, />3 items</);
  assert.match(intermediateMarkup, /Used: 100/);
  assert.match(intermediateMarkup, /Used: 200/);
  assert.match(intermediateMarkup, />4 items</);
});

test('ConversationTurn renders tool summaries without details when detail mode is off', () => {
  const markup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items: [
        { id: 'user', role: 'user', content: 'Run tests' },
        { id: 'tool', type: 'tool_call', tool: 'bash', input: 'npm test', output: 'PASS', status: 'success' },
        { id: 'assistant', role: 'assistant', content: 'Done' },
      ],
      visibleTypes: {
        user: true,
        assistant: true,
        thinking: true,
        toolCalls: true,
        tokenCounters: false,
      },
      detailVisibility: {
        showToolSummaries: true,
        showToolDetails: false,
      },
    }),
  );

  assert.match(markup, /Tool Call/);
  assert.match(markup, /bash/);
  assert.match(markup, /Success/);
  assert.match(markup, /aria-label="Copy tool input and output"/);
  assert.doesNotMatch(markup, />Input</);
  assert.doesNotMatch(markup, /npm test/);
  assert.doesNotMatch(markup, />Output</);
  assert.doesNotMatch(markup, /PASS/);
  assert.match(markup, />3 items</);
});

test('ToolCall supports summary-only and detail rendering without expandable affordances', () => {
  const summaryMarkup = renderToStaticMarkup(
    createElement(ToolCall, {
      tool: 'bash',
      input: 'npm test',
      output: 'PASS',
      status: 'success',
      showDetails: false,
    }),
  );
  const markup = renderToStaticMarkup(
    createElement(ToolCall, {
      tool: 'bash',
      input: 'npm test',
      output: 'PASS',
      status: 'success',
      showDetails: true,
    }),
  );

  assert.match(summaryMarkup, /Tool Call/);
  assert.match(summaryMarkup, /bash/);
  assert.match(summaryMarkup, /Success/);
  assert.doesNotMatch(summaryMarkup, /aria-expanded/);
  assert.doesNotMatch(summaryMarkup, /npm test/);
  assert.doesNotMatch(summaryMarkup, /PASS/);
  assert.match(markup, />Input</);
  assert.match(markup, /npm test/);
  assert.match(markup, />Output</);
  assert.match(markup, /PASS/);
  assert.match(markup, /aria-label="Copy tool input"/);
  assert.match(markup, /aria-label="Copy tool output"/);
  assert.match(markup, /focus-visible:ring-2/);
});
