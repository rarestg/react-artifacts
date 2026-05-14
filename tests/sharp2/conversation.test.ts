import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ConversationTurn } from '../../src/artifacts/sharp2/conversation/ConversationTurn';
import { getTurnItemKey, getTurnKey } from '../../src/artifacts/sharp2/conversation/keys';
import { MessageCard } from '../../src/artifacts/sharp2/conversation/MessageCard';
import { getDefaultRenderMode, splitMessageContent } from '../../src/artifacts/sharp2/conversation/markdown';
import { SubagentNotification } from '../../src/artifacts/sharp2/conversation/SubagentNotification';
import {
  getTokenUsageSummary,
  TokenCounter,
  tokenCounterPropsFromTelemetry,
} from '../../src/artifacts/sharp2/conversation/TokenCounter';
import { ToolCall } from '../../src/artifacts/sharp2/conversation/ToolCall';
import { type ConversationTurnData, getTurnItemVisibleType } from '../../src/artifacts/sharp2/conversation/types';

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
});

test('MessageCard follows role defaults for real rendering', () => {
  const cases = [
    { role: 'user', content: 'User **bold** content' },
    { role: 'assistant', content: 'Assistant **bold** content' },
    { role: 'thinking', content: 'Thinking **bold** content' },
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

test('MessageCard uses the intended role accent color mapping', () => {
  const userMarkup = renderToStaticMarkup(createElement(MessageCard, { role: 'user', content: 'User text' }));
  const assistantMarkup = renderToStaticMarkup(
    createElement(MessageCard, { role: 'assistant', content: 'Assistant text' }),
  );
  const thinkingMarkup = renderToStaticMarkup(createElement(MessageCard, { role: 'thinking', content: 'Thinking' }));

  assert.match(userMarkup, /border-l-\[var\(--category-green\)\]/);
  assert.match(userMarkup, /text-\[var\(--category-green\)\]/);
  assert.match(assistantMarkup, /border-l-\[var\(--category-blue\)\]/);
  assert.match(assistantMarkup, /text-\[var\(--category-blue\)\]/);
  assert.match(thinkingMarkup, /border-l-\[var\(--category-amber\)\]/);
  assert.match(thinkingMarkup, /text-\[var\(--category-amber\)\]/);
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
  assert.match(markup, /title="Switch between raw text and rendered Markdown output"/);
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

test('MessageCard keeps render controls assistant-only', () => {
  const userMarkup = renderToStaticMarkup(
    createElement(MessageCard, {
      role: 'user',
      content: 'User **bold** input',
      renderMode: 'rendered',
      onToggleRender: () => {},
    }),
  );
  const thinkingMarkup = renderToStaticMarkup(
    createElement(MessageCard, {
      role: 'thinking',
      content: 'Thinking **bold** note',
      renderMode: 'literal',
      onToggleRender: () => {},
    }),
  );

  assert.doesNotMatch(userMarkup, /aria-pressed/);
  assert.match(userMarkup, /\*\*bold\*\*/);
  assert.doesNotMatch(userMarkup, /<strong/);
  assert.doesNotMatch(thinkingMarkup, /aria-pressed/);
  assert.match(thinkingMarkup, /<strong/);
  assert.match(thinkingMarkup, />bold<\/strong>/);
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

  assert.notEqual(
    getTurnItemKey({
      type: 'tool_call',
      tool: 'functions.spawn_agent',
      timestamp: '10:00',
      input: 'spawn worker',
      output: 'running',
    }),
    getTurnItemKey({
      type: 'tool_call',
      toolKind: 'subagent_spawn',
      tool: 'functions.spawn_agent',
      timestamp: '10:00',
      input: 'spawn worker',
      output: 'running',
    }),
  );

  assert.notEqual(
    getTurnItemKey({
      type: 'subagent_notification',
      agentId: 'child-thread-123',
      status: 'completed',
      summary: 'first result',
    }),
    getTurnItemKey({
      type: 'subagent_notification',
      agentId: 'child-thread-123',
      status: 'completed',
      summary: 'second result',
    }),
  );
});

test('getTurnItemVisibleType categorizes subagent lifecycle activity separately', () => {
  const subagentToolKinds = [
    'subagent_spawn',
    'subagent_wait',
    'subagent_send_input',
    'subagent_resume',
    'subagent_close',
  ] as const;

  for (const toolKind of subagentToolKinds) {
    assert.equal(
      getTurnItemVisibleType({
        type: 'tool_call',
        toolKind,
        tool: toolKind,
        input: 'agent operation',
        output: 'done',
      }),
      'subagentActivity',
    );
  }

  assert.equal(
    getTurnItemVisibleType({
      type: 'subagent_notification',
      agentId: 'child-thread-123',
      status: 'completed',
      summary: 'done',
    }),
    'subagentActivity',
  );
  assert.equal(
    getTurnItemVisibleType({ type: 'tool_call', tool: 'bash', input: 'npm test', output: 'PASS' }),
    'toolCalls',
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
        subagentActivity: false,
        tokenCounters: true,
      },
    }),
  );

  assert.match(markup, /Question/);
  assert.match(markup, /Answer/);
  assert.doesNotMatch(markup, /Reasoning/);
  assert.doesNotMatch(markup, /npm test/);
});

test('ConversationTurn shows visible and available item counts when filters hide rows', () => {
  const markup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items: [
        { id: 'user', role: 'user', content: 'Question' },
        { id: 'thinking', role: 'thinking', content: 'Reasoning' },
        { id: 'assistant', role: 'assistant', content: 'Answer' },
      ],
      visibleTypes: {
        user: true,
        assistant: true,
        thinking: false,
        toolCalls: false,
        subagentActivity: false,
        tokenCounters: false,
      },
    }),
  );

  assert.match(markup, /title="2 of 3 transcript rows visible for Turn 1"/);
  assert.match(markup, />2 \/ 3 visible</);
});

test('ConversationTurn keeps timestamp beside the turn label and duration units lowercase', () => {
  const markup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 7,
      timestamp: '10:44:30',
      duration: '3.1s',
      items: [{ id: 'assistant', role: 'assistant', content: 'Done' }],
    }),
  );
  const turnIndex = markup.indexOf('Turn 7');
  const timestampTitleIndex = markup.indexOf('10:44:30 AM local time');
  const timestampDisplayIndex = markup.indexOf('10:44 AM');
  const durationIndex = markup.indexOf('3.1s');
  const countIndex = markup.indexOf('1 / 1 visible');

  assert.ok(turnIndex !== -1);
  assert.ok(timestampTitleIndex > turnIndex);
  assert.ok(timestampDisplayIndex > timestampTitleIndex);
  assert.ok(durationIndex > timestampDisplayIndex);
  assert.match(markup, /title="3\.1s elapsed in Turn 7"/);
  assert.ok(countIndex > durationIndex);
  assert.match(markup, /normal-case[^"]*text-\[var\(--text-muted\)\][^"]*tabular-nums">\s*3\.1s/);
  assert.doesNotMatch(markup, /3\.1S/);
});

test('MessageCard renders row timestamps as copyable UTC timestamp buttons', () => {
  const markup = renderToStaticMarkup(
    createElement(MessageCard, {
      role: 'assistant',
      content: 'Done',
      timestamp: '10:44:30',
    }),
  );

  assert.match(markup, /aria-label="Copy UTC timestamp 10:44:30"/);
  assert.match(markup, /title="10:44:30 AM local time; click to copy UTC timestamp 10:44:30"/);
  assert.match(markup, />10:44 AM</);
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

test('ConversationTurn only applies render toggles and overrides to assistant rows', () => {
  const markup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items: [
        { id: 'user', role: 'user', content: 'User **bold** input' },
        { id: 'thinking', role: 'thinking', content: 'Thinking **bold** note' },
        { id: 'assistant', role: 'assistant', content: 'Assistant **bold** output' },
      ],
      renderModes: ['rendered', 'literal', 'literal'],
      onToggleRender: () => undefined,
    }),
  );

  assert.equal(markup.match(/aria-pressed=/g)?.length ?? 0, 1);
  assert.match(markup, /User \*\*bold\*\* input/);
  assert.match(markup, /Thinking <strong\b[^>]*>bold<\/strong> note/);
  assert.match(markup, /Assistant \*\*bold\*\* output/);
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
        subagentActivity: true,
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
        subagentActivity: true,
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
  assert.match(summaryOnlyMarkup, />3 \/ 3 visible</);
  assert.match(intermediateMarkup, /Used: 100/);
  assert.match(intermediateMarkup, /Used: 200/);
  assert.match(intermediateMarkup, />4 \/ 4 visible</);
});

test('ConversationTurn renders collapsed tool summaries by default', () => {
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
        subagentActivity: true,
        tokenCounters: false,
      },
    }),
  );

  assert.match(markup, /Tool Call/);
  assert.match(markup, /npm test/);
  assert.doesNotMatch(markup, />bash</);
  assert.match(markup, /Success/);
  assert.match(markup, /aria-expanded="false"/);
  assert.match(markup, /aria-label="Expand bash tool details"/);
  assert.doesNotMatch(markup, /aria-label="Copy tool input and output"/);
  assert.doesNotMatch(markup, /title="Copy tool input and output"/);
  assert.doesNotMatch(markup, />Input</);
  assert.doesNotMatch(markup, />Output</);
  assert.doesNotMatch(markup, /PASS/);
  assert.match(markup, />3 \/ 3 visible</);
});

test('ConversationTurn filters subagent lifecycle activity independently from ordinary tools', () => {
  const items: ConversationTurnData['items'] = [
    { id: 'tool', type: 'tool_call', tool: 'bash', input: 'npm test', output: 'PASS' },
    {
      id: 'spawn',
      type: 'tool_call',
      toolKind: 'subagent_spawn',
      tool: 'spawn_agent',
      summary: 'spawn_agent -> Ada',
      input: 'spawn worker',
      output: 'running',
      status: 'pending',
    },
    {
      id: 'wait',
      type: 'tool_call',
      toolKind: 'subagent_wait',
      tool: 'wait_agent',
      summary: 'wait_agent -> Ada',
      input: 'wait for worker',
      output: 'completed',
      status: 'success',
    },
    {
      id: 'notification',
      type: 'subagent_notification',
      agentId: 'child-thread-123',
      agentNickname: 'Ada',
      status: 'completed',
      summary: 'The parser is treating inherited metadata as current-session metadata.',
    },
  ];

  const onlySubagentMarkup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items,
      visibleTypes: {
        user: false,
        assistant: false,
        thinking: false,
        toolCalls: false,
        subagentActivity: true,
        tokenCounters: false,
      },
    }),
  );
  const onlyOrdinaryToolMarkup = renderToStaticMarkup(
    createElement(ConversationTurn, {
      turnNumber: 1,
      items,
      visibleTypes: {
        user: false,
        assistant: false,
        thinking: false,
        toolCalls: true,
        subagentActivity: false,
        tokenCounters: false,
      },
    }),
  );

  assert.match(onlySubagentMarkup, /Spawn Agent/);
  assert.match(onlySubagentMarkup, /spawn_agent -&gt; Ada/);
  assert.match(onlySubagentMarkup, /wait_agent -&gt; Ada/);
  assert.match(onlySubagentMarkup, /Subagent Notification/);
  assert.match(onlySubagentMarkup, /The parser is treating inherited metadata/);
  assert.match(onlySubagentMarkup, />3 \/ 4 visible</);
  assert.doesNotMatch(onlySubagentMarkup, /npm test/);
  assert.match(onlyOrdinaryToolMarkup, /Tool Call/);
  assert.match(onlyOrdinaryToolMarkup, /npm test/);
  assert.match(onlyOrdinaryToolMarkup, />1 \/ 4 visible</);
  assert.doesNotMatch(onlyOrdinaryToolMarkup, /Spawn Agent/);
  assert.doesNotMatch(onlyOrdinaryToolMarkup, /Subagent Notification/);
});

test('ToolCall supports row-level expansion for input and output details', () => {
  const summaryMarkup = renderToStaticMarkup(
    createElement(ToolCall, {
      tool: 'bash',
      input: 'npm test',
      output: 'PASS',
      timestamp: '10:44:30',
      status: 'success',
    }),
  );
  const markup = renderToStaticMarkup(
    createElement(ToolCall, {
      tool: 'bash',
      input: 'npm test',
      output: 'PASS',
      status: 'success',
      defaultExpanded: true,
    }),
  );

  assert.match(summaryMarkup, /Tool Call/);
  assert.match(summaryMarkup, /npm test/);
  assert.doesNotMatch(summaryMarkup, />bash</);
  assert.match(summaryMarkup, /Success/);
  assert.match(summaryMarkup, /title="10:44:30 AM local time"/);
  assert.doesNotMatch(summaryMarkup, /Copy UTC timestamp/);
  assert.match(summaryMarkup, /aria-expanded="false"/);
  assert.match(summaryMarkup, /aria-label="Expand bash tool details"/);
  assert.doesNotMatch(summaryMarkup, /PASS/);
  assert.match(markup, /aria-expanded="true"/);
  assert.match(markup, /aria-label="Collapse bash tool details"/);
  assert.match(markup, />Input</);
  assert.match(markup, /npm test/);
  assert.match(markup, />Output</);
  assert.match(markup, /PASS/);
  assert.match(markup, /aria-label="Copy tool input"/);
  assert.match(markup, /aria-label="Copy tool output"/);
  assert.doesNotMatch(markup, />Copy input</);
  assert.doesNotMatch(markup, />Copy output</);
  assert.equal(markup.match(/>Copy<\/span>/g)?.length ?? 0, 2);
  assert.match(markup, /focus-visible:ring-2/);
});

test('ToolCall gives subagent lifecycle rows their own labels and category color', () => {
  const cases = [
    ['subagent_spawn', 'spawn_agent', 'Spawn Agent', 'spawn_agent -> Ada'],
    ['subagent_wait', 'wait_agent', 'Wait Agent', 'wait_agent -> Ada'],
    ['subagent_send_input', 'send_input', 'Send Input', 'send_input -> Ada follow-up'],
    ['subagent_resume', 'resume_agent', 'Resume Agent', 'resume_agent -> Ada'],
    ['subagent_close', 'close_agent', 'Close Agent', 'close_agent -> Ada'],
  ] as const;

  for (const [toolKind, tool, label, summary] of cases) {
    const markup = renderToStaticMarkup(
      createElement(ToolCall, {
        tool,
        toolKind,
        summary,
        input: 'agent operation',
        output: 'done',
        status: 'pending',
      }),
    );

    assert.match(markup, new RegExp(label));
    assert.match(markup, /--tool-call-color:var\(--category-cyan\)/);
    assert.match(markup, /Running/);
    assert.match(markup, new RegExp(`aria-label="Expand ${tool} tool details"`));
    assert.doesNotMatch(markup, />Tool Call</);
  }
});

test('SubagentNotification renders machine-delivered results outside ordinary user messages', () => {
  const markup = renderToStaticMarkup(
    createElement(SubagentNotification, {
      agentId: 'child-thread-123',
      agentNickname: 'Ada',
      agentRole: 'worker',
      status: 'completed',
      summary: 'The parser is treating inherited metadata as current-session metadata.',
      rawPayload:
        '<subagent_notification>\n{"agent_path":"child-thread-123","status":{"completed":"done"}}\n</subagent_notification>',
      timestamp: '10:46:29',
    }),
  );

  assert.match(markup, /Subagent Notification/);
  assert.match(markup, /Completed/);
  assert.match(markup, /Ada \/ worker/);
  assert.match(markup, /The parser is treating inherited metadata/);
  assert.match(markup, /aria-label="Copy subagent notification for Ada"/);
  assert.match(markup, /title="10:46:29 AM local time"/);
  assert.doesNotMatch(markup, />User</);
});
