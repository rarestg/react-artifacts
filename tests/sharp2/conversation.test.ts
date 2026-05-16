import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  ConversationTurn,
  type ConversationTurnData,
  getTurnItemVisibleType,
  getTurnKey,
  tokenCounterPropsFromTelemetry,
} from '../../src/artifacts/sharp2/conversation';
import {
  AgentIdentityTags,
  agentIdentityToneNames,
  EventDescriptor,
  EventPreviewPill,
  getAgentIdentityToneName,
  getAgentIdSuffix,
} from '../../src/artifacts/sharp2/conversation/EventRowParts';
import { getTurnItemKey } from '../../src/artifacts/sharp2/conversation/keys';
import { MessageCard } from '../../src/artifacts/sharp2/conversation/MessageCard';
import { getDefaultRenderMode, splitMessageContent } from '../../src/artifacts/sharp2/conversation/markdown';
import { SubagentNotification } from '../../src/artifacts/sharp2/conversation/SubagentNotification';
import { getTokenUsageSummary, TokenCounter } from '../../src/artifacts/sharp2/conversation/TokenCounter';
import { ToolCall } from '../../src/artifacts/sharp2/conversation/ToolCall';
import { ExpandableTranscriptRow, TranscriptRow } from '../../src/artifacts/sharp2/conversation/TranscriptRow';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const SUBAGENT_ID = '019e27af-615f-7bf0-a26a-ee42ecd83783';
const SUBAGENT_ID_SUFFIX = 'd83783';

function countMatches(source: string, pattern: RegExp) {
  return source.match(pattern)?.length ?? 0;
}

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

  assert.match(userMarkup, /--transcript-row-accent:var\(--category-green\)/);
  assert.match(userMarkup, /text-\[var\(--category-green\)\]/);
  assert.match(assistantMarkup, /--transcript-row-accent:var\(--category-blue\)/);
  assert.match(assistantMarkup, /text-\[var\(--category-blue\)\]/);
  assert.match(thinkingMarkup, /--transcript-row-accent:var\(--category-amber\)/);
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
  assert.match(markup, /aria-label="Rendered"/);
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
  assert.match(markup, /aria-label="Raw"/);
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
      agentId: SUBAGENT_ID,
      status: 'completed',
      summary: 'first result',
    }),
    getTurnItemKey({
      type: 'subagent_notification',
      agentId: SUBAGENT_ID,
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
      agentId: SUBAGENT_ID,
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
      renderModesByItemIndex: ['rendered', 'literal', 'literal'],
      onToggleRenderMode: () => undefined,
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
      renderModesByItemIndex: ['literal', 'rendered'],
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

  assert.match(markup, />TOOL</);
  assert.match(markup, /npm test/);
  assert.match(markup, />bash</);
  assert.doesNotMatch(markup, /Success/);
  assert.doesNotMatch(markup, /success-weak/);
  assert.match(markup, /aria-expanded="false"/);
  assert.equal(countMatches(markup, /aria-expanded=/g), 1);
  assert.match(markup, /aria-label="Expand bash tool details"/);
  assert.doesNotMatch(markup, /aria-label="Copy tool input and output"/);
  assert.doesNotMatch(markup, /title="Copy tool input and output"/);
  assert.doesNotMatch(markup, />Input</);
  assert.doesNotMatch(markup, />Output</);
  assert.doesNotMatch(markup, /PASS/);
  assert.match(markup, />3 \/ 3 visible</);
});

test('TranscriptRow owns the shared transcript row shell contract', () => {
  const rowMarkup = renderToStaticMarkup(
    createElement(
      TranscriptRow,
      {
        accentColor: 'var(--category-blue)',
        left: 'Label',
        right: 'Actions',
      },
      createElement('span', null, 'Body'),
    ),
  );
  const expandableMarkup = renderToStaticMarkup(
    createElement(
      ExpandableTranscriptRow,
      {
        accentColor: 'var(--category-violet)',
        expanded: true,
        controlsId: 'tool-details',
        summaryAriaLabel: 'Collapse tool details',
        onToggle: () => undefined,
        left: 'Tool',
        rightLeading: 'Meta',
      },
      createElement('span', null, 'Details'),
    ),
  );

  for (const markup of [rowMarkup, expandableMarkup]) {
    assert.match(
      markup,
      /class="border-l-2 border-l-\[color:var\(--transcript-row-accent\)\] bg-\[var\(--surface\)\]"/,
    );
    assert.match(markup, /flex min-w-0 flex-1 items-center gap-1\.5/);
    assert.match(markup, /flex shrink-0 items-center gap-1\.5/);
  }

  assert.match(rowMarkup, /style="--transcript-row-accent:var\(--category-blue\)"/);
  assert.match(rowMarkup, /<div class="p-3"><div class="flex min-w-0 items-center justify-between gap-3">/);
  assert.match(expandableMarkup, /style="--transcript-row-accent:var\(--category-violet\)"/);
  assert.match(expandableMarkup, /flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 p-3/);
  assert.match(expandableMarkup, /absolute inset-0 z-0 cursor-pointer bg-transparent/);
  assert.equal(countMatches(expandableMarkup, /aria-expanded=/g), 1);
  assert.match(expandableMarkup, /pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-1\.5/);
  assert.match(expandableMarkup, /pointer-events-none relative z-10 flex shrink-0 items-center gap-1\.5/);
  assert.match(expandableMarkup, /grid grid-cols-\[4\.75rem_auto_1\.5rem\] items-center gap-1\.5/);
  assert.match(expandableMarkup, /aria-hidden="true" class="inline-flex size-6 shrink-0/);
  assert.doesNotMatch(expandableMarkup, /pointer-events-auto inline-flex size-6/);
  assert.doesNotMatch(expandableMarkup, /class="min-w-0 flex-1 cursor-pointer text-left/);
  assert.doesNotMatch(expandableMarkup, /pointer-events-auto relative z-10 flex shrink-0/);
  assert.match(expandableMarkup, /hover:bg-\[var\(--surface-muted\)\]/);
  assert.match(expandableMarkup, /focus-visible:ring-2/);
  assert.match(expandableMarkup, /id="tool-details" class="space-y-3 px-3 pb-3"/);
});

test('conversation event rows use the shared TranscriptRow accent and inset shell', () => {
  const messageMarkup = renderToStaticMarkup(createElement(MessageCard, { role: 'user', content: 'Question' }));
  const toolMarkup = renderToStaticMarkup(
    createElement(ToolCall, {
      tool: 'bash',
      input: 'npm test',
      output: 'PASS',
    }),
  );
  const notificationMarkup = renderToStaticMarkup(
    createElement(SubagentNotification, {
      agentId: SUBAGENT_ID,
      agentNickname: 'Ada',
      status: 'completed',
      summary: 'Done',
    }),
  );
  const rowShellPattern =
    /class="border-l-2 border-l-\[color:var\(--transcript-row-accent\)\] bg-\[var\(--surface\)\]"/;

  assert.match(messageMarkup, rowShellPattern);
  assert.match(toolMarkup, rowShellPattern);
  assert.match(notificationMarkup, rowShellPattern);
  assert.match(messageMarkup, /style="--transcript-row-accent:var\(--category-green\)"/);
  assert.match(toolMarkup, /style="--transcript-row-accent:var\(--category-violet\)"/);
  assert.match(notificationMarkup, /style="--transcript-row-accent:var\(--category-cyan\)"/);
  assert.match(messageMarkup, /<div class="p-3"><div class="flex min-w-0 items-center justify-between gap-3">/);
  assert.match(toolMarkup, /flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 p-3/);
  assert.match(notificationMarkup, /flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 p-3/);
  assert.match(toolMarkup, /grid grid-cols-\[4\.75rem_auto_1\.5rem\] items-center gap-1\.5/);
  assert.match(notificationMarkup, /grid grid-cols-\[4\.75rem_auto_1\.5rem\] items-center gap-1\.5/);
  assert.match(toolMarkup, /pointer-events-none relative z-10 flex shrink-0 items-center gap-1\.5/);
  assert.match(toolMarkup, /aria-hidden="true" class="inline-flex size-6 shrink-0/);
  assert.match(notificationMarkup, /aria-hidden="true" class="inline-flex size-6 shrink-0/);
  assert.equal(countMatches(toolMarkup, /aria-expanded=/g), 1);
  assert.equal(countMatches(notificationMarkup, /aria-expanded=/g), 1);
  assert.doesNotMatch(toolMarkup, /pointer-events-auto inline-flex size-6/);
  assert.doesNotMatch(notificationMarkup, /pointer-events-auto inline-flex size-6/);
  assert.doesNotMatch(toolMarkup, /gap-3 px-4 py-3/);
  assert.doesNotMatch(notificationMarkup, /gap-3 px-4 py-3/);
});

test('EventDescriptor reserves event action width for rows with previews', () => {
  const rowActions = ['bash', 'Spawn', 'Wait', 'Close', 'Notification'];

  for (const action of rowActions) {
    const markup = renderToStaticMarkup(
      createElement(EventDescriptor, {
        category: action === 'bash' ? 'TOOL' : 'SUBAGENT',
        colorClassName: action === 'bash' ? 'text-[var(--category-violet)]' : 'text-[var(--category-cyan)]',
        sections: [{ value: action, width: 'action' }],
      }),
    );

    assert.match(markup, action === 'bash' ? />TOOL</ : />SUBAGENT</);
    assert.match(markup, new RegExp(`>${action}<`));
    assert.match(markup, /data-section-width="action"/);
    assert.match(markup, /min-w-\[12ch\]/);
    assert.match(markup, /shrink-0/);
  }

  const ordinaryToolMarkup = renderToStaticMarkup(
    createElement(EventDescriptor, {
      category: 'TOOL',
      colorClassName: 'text-[var(--category-violet)]',
      sections: [{ value: 'bash' }],
    }),
  );

  assert.match(ordinaryToolMarkup, />TOOL</);
  assert.match(ordinaryToolMarkup, />bash</);
  assert.doesNotMatch(ordinaryToolMarkup, /data-section-width="action"/);
  assert.doesNotMatch(ordinaryToolMarkup, /min-w-\[12ch\]/);
});

test('EventPreviewPill leaves width policy to row callers', () => {
  const baseMarkup = renderToStaticMarkup(createElement(EventPreviewPill, { title: 'Preview title' }, 'Preview text'));
  const fillMarkup = renderToStaticMarkup(
    createElement(EventPreviewPill, { title: 'Preview title', className: 'flex-1' }, 'Preview text'),
  );

  assert.match(baseMarkup, /inline-flex h-6 min-w-0 items-center/);
  assert.doesNotMatch(baseMarkup, /max-w-\[24rem\]/);
  assert.doesNotMatch(baseMarkup, /flex-\[1_1_10rem\]/);
  assert.match(fillMarkup, /inline-flex h-6 min-w-0 items-center/);
  assert.match(fillMarkup, /flex-1/);
  assert.doesNotMatch(fillMarkup, /max-w-\[24rem\]/);
});

test('transcript event previews fill available row space without a fixed cap', () => {
  const longCommand = 'node --import tsx --test --test-name-pattern="debounced transcript preview layout"';
  const markups = [
    renderToStaticMarkup(createElement(ToolCall, { tool: 'bash', input: longCommand, output: 'PASS' })),
    renderToStaticMarkup(
      createElement(ToolCall, {
        tool: 'wait_agent',
        toolKind: 'subagent_wait',
        agentId: SUBAGENT_ID,
        agentNickname: 'Ada',
        input: longCommand,
        output: 'done',
      }),
    ),
    renderToStaticMarkup(
      createElement(SubagentNotification, {
        agentId: SUBAGENT_ID,
        agentNickname: 'Ada',
        status: 'completed',
        summary: longCommand,
      }),
    ),
  ];

  for (const markup of markups) {
    assert.match(markup, /inline-flex h-6 min-w-0 items-center[^"]*flex-1/);
    assert.doesNotMatch(markup, /max-w-\[24rem\]/);
    assert.doesNotMatch(markup, /flex-\[1_1_10rem\]/);
  }
});

test('getAgentIdSuffix handles UUID-like ids and preserves non-UUID fallback behavior', () => {
  assert.equal(getAgentIdSuffix(SUBAGENT_ID), SUBAGENT_ID_SUFFIX);
  assert.equal(getAgentIdSuffix(SUBAGENT_ID.toUpperCase()), SUBAGENT_ID_SUFFIX);
  assert.equal(getAgentIdSuffix(SUBAGENT_ID.replace(/-/g, '')), SUBAGENT_ID_SUFFIX);
  assert.equal(getAgentIdSuffix('child-thread-123'), 'ad-123');
  assert.equal(getAgentIdSuffix('  child-thread-123  '), 'ad-123');
});

test('AgentIdentityTags renders nickname and short id as separate deterministic-tone tags', () => {
  const firstTone = getAgentIdentityToneName(SUBAGENT_ID);
  const secondTone = getAgentIdentityToneName(SUBAGENT_ID);
  const distributedTones = new Set(
    Array.from({ length: 8 }, (_, index) => getAgentIdentityToneName(`child-thread-${index}`)),
  );
  const markup = renderToStaticMarkup(
    createElement(AgentIdentityTags, {
      agentId: SUBAGENT_ID,
      agentNickname: 'Ada',
      agentRole: 'worker',
    }),
  );

  assert.equal(firstTone, secondTone);
  assert.notEqual(firstTone, 'metadata');
  assert.ok(distributedTones.size > 1);
  assert.match(markup, new RegExp(`data-agent-tone="${firstTone}"`));
  assert.match(markup, /inline-flex min-w-0 shrink-0 items-center gap-1\.5/);
  assert.match(markup, /--agent-tag-color:var\(--category-/);
  assert.match(markup, /data-agent-identity-tag="nickname"/);
  assert.match(markup, /border-transparent/);
  assert.doesNotMatch(markup, /border-\[color:var\(--agent-tag-color\)\]/);
  assert.match(markup, />Ada</);
  assert.match(markup, /data-agent-identity-tag="id"/);
  assert.match(markup, />d83783</);
  assert.doesNotMatch(markup, /Ada \/ d83783/);
  assert.doesNotMatch(markup, /<button/);
});

test('agent identity tone palette excludes semantic-looking status tones', () => {
  const excludedTones = new Set(['green', 'red', 'lime', 'amber']);
  const representativeIds = [
    SUBAGENT_ID,
    SUBAGENT_ID.toUpperCase(),
    SUBAGENT_ID.replace(/-/g, ''),
    ...Array.from({ length: 64 }, (_, index) => `${SUBAGENT_ID}-${index}`),
  ];

  assert.deepEqual(agentIdentityToneNames, ['blue', 'violet', 'pink', 'cyan']);

  for (const toneName of agentIdentityToneNames) {
    assert.equal(excludedTones.has(toneName), false);
  }

  for (const id of representativeIds) {
    assert.equal(excludedTones.has(getAgentIdentityToneName(id)), false);
  }
});

test('AgentIdentityTags copy mode exposes separate nickname and full-id copy targets', () => {
  const markup = renderToStaticMarkup(
    createElement(AgentIdentityTags, {
      agentId: SUBAGENT_ID,
      agentNickname: 'Ada',
      agentRole: 'worker',
      mode: 'copy',
    }),
  );

  assert.match(markup, /<button/);
  assert.match(markup, /data-agent-identity-tag="nickname"/);
  assert.match(markup, /title="Copy nickname"/);
  assert.match(markup, /aria-label="Copy agent nickname Ada"/);
  assert.match(markup, /data-copy-value="Ada"/);
  assert.match(markup, /--copy-button-tag-bg:var\(--category-/);
  assert.match(markup, /--copy-button-tag-text:var\(--category-/);
  assert.match(markup, /--copy-button-tag-hover-bg:var\(--surface\)/);
  assert.match(markup, /opacity-0 pointer-events-none">\s*Copied/);
  assert.match(markup, /px-2/);
  assert.match(markup, /border-transparent/);
  assert.doesNotMatch(markup, /border-\[color:var\(--agent-tag-color\)\]/);
  assert.doesNotMatch(markup, /lucide-copy/);
  assert.match(markup, /data-agent-identity-tag="id"/);
  assert.match(markup, /title="Copy full agent ID"/);
  assert.match(markup, /aria-label="Copy full agent ID 019e27af-615f-7bf0-a26a-ee42ecd83783"/);
  assert.match(markup, /data-copy-value="019e27af-615f-7bf0-a26a-ee42ecd83783"/);
  assert.doesNotMatch(markup, /Nickname: Ada \/ Agent ID/);
  assert.doesNotMatch(markup, /click to copy 019e27af/);
});

test('ConversationTurn filters subagent lifecycle activity independently from ordinary tools', () => {
  const items: ConversationTurnData['items'] = [
    { id: 'tool', type: 'tool_call', tool: 'bash', input: 'npm test', output: 'PASS' },
    {
      id: 'spawn',
      type: 'tool_call',
      toolKind: 'subagent_spawn',
      tool: 'spawn_agent',
      agentId: SUBAGENT_ID,
      agentNickname: 'Ada',
      agentRole: 'worker',
      preview: 'Inspect the parser identity bug',
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
      agentId: SUBAGENT_ID,
      agentNickname: 'Ada',
      agentRole: 'worker',
      preview: 'Completed within 10m',
      summary: 'wait_agent -> Ada',
      input: 'wait for worker',
      output: 'completed',
      status: 'success',
    },
    {
      id: 'notification',
      type: 'subagent_notification',
      agentId: SUBAGENT_ID,
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

  assert.match(onlySubagentMarkup, />SUBAGENT</);
  assert.match(onlySubagentMarkup, />Spawn</);
  assert.match(onlySubagentMarkup, /Inspect the parser identity bug/);
  assert.match(onlySubagentMarkup, /Completed within 10m/);
  assert.doesNotMatch(onlySubagentMarkup, /spawn_agent &gt; Ada/);
  assert.doesNotMatch(onlySubagentMarkup, /wait_agent &gt; Ada/);
  assert.match(onlySubagentMarkup, /data-agent-identity-tag="nickname"/);
  assert.match(onlySubagentMarkup, />Ada</);
  assert.match(onlySubagentMarkup, /data-agent-identity-tag="id"/);
  assert.match(onlySubagentMarkup, />d83783</);
  assert.match(onlySubagentMarkup, />Notification</);
  assert.match(onlySubagentMarkup, /The parser is treating inherited metadata/);
  assert.doesNotMatch(onlySubagentMarkup, />Completed</);
  assert.match(onlySubagentMarkup, />3 \/ 4 visible</);
  assert.doesNotMatch(onlySubagentMarkup, /npm test/);
  assert.match(onlyOrdinaryToolMarkup, />TOOL</);
  assert.match(onlyOrdinaryToolMarkup, /npm test/);
  assert.match(onlyOrdinaryToolMarkup, />1 \/ 4 visible</);
  assert.doesNotMatch(onlyOrdinaryToolMarkup, />SUBAGENT</);
  assert.doesNotMatch(onlyOrdinaryToolMarkup, />Notification</);
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

  assert.match(summaryMarkup, />TOOL</);
  assert.match(summaryMarkup, /npm test/);
  assert.match(summaryMarkup, />bash</);
  assert.match(summaryMarkup, /data-section-width="action"/);
  assert.match(summaryMarkup, /min-w-\[12ch\]/);
  assert.doesNotMatch(summaryMarkup, /Success/);
  assert.doesNotMatch(summaryMarkup, /success-weak/);
  assert.match(summaryMarkup, /aria-label="Copy UTC timestamp 10:44:30"/);
  assert.match(summaryMarkup, /title="10:44:30 AM local time; click to copy UTC timestamp 10:44:30"/);
  assert.match(summaryMarkup, /aria-expanded="false"/);
  assert.equal(countMatches(summaryMarkup, /aria-expanded=/g), 1);
  assert.equal(countMatches(summaryMarkup, /<button/g), 2);
  assert.match(summaryMarkup, /aria-label="Expand bash tool details"/);
  assert.match(summaryMarkup, /absolute inset-0 z-0 cursor-pointer bg-transparent/);
  assert.match(summaryMarkup, /aria-hidden="true" class="inline-flex size-6 shrink-0/);
  assert.doesNotMatch(summaryMarkup, /pointer-events-auto inline-flex size-6/);
  assert.match(summaryMarkup, /lucide-chevron-right/);
  assert.doesNotMatch(summaryMarkup, /PASS/);
  assert.match(markup, /aria-expanded="true"/);
  assert.equal(countMatches(markup, /aria-expanded=/g), 1);
  assert.match(markup, /aria-label="Collapse bash tool details"/);
  assert.match(markup, />Input</);
  assert.match(markup, /npm test/);
  assert.match(markup, />Output</);
  assert.match(markup, /PASS/);
  assert.match(markup, /aria-label="Copy tool input"/);
  assert.match(markup, /aria-label="Copy tool output"/);
  assert.doesNotMatch(markup, />Copy input</);
  assert.doesNotMatch(markup, />Copy output</);
  assert.doesNotMatch(markup, />Copy<\/span>/);
  assert.equal(markup.match(/lucide-copy/g)?.length ?? 0, 2);
  assert.equal(markup.match(/size-6 justify-center p-0/g)?.length ?? 0, 2);
  assert.match(markup, /focus-visible:ring-2/);
});

test('ordinary ToolCall collapsed previews keep summary and input fallback behavior', () => {
  const summaryMarkup = renderToStaticMarkup(
    createElement(ToolCall, {
      tool: 'bash',
      summary: 'Run focused tests',
      input: 'npm test',
      output: 'PASS',
    }),
  );
  const inputFallbackMarkup = renderToStaticMarkup(
    createElement(ToolCall, {
      tool: 'bash',
      input: '\n  npm run check\n',
      output: 'PASS',
    }),
  );

  assert.match(summaryMarkup, /Run focused tests/);
  assert.doesNotMatch(summaryMarkup, /npm test/);
  assert.match(inputFallbackMarkup, /npm run check/);
});

test('ToolCall gives subagent lifecycle rows a consistent subagent label grammar', () => {
  const cases = [
    ['subagent_spawn', 'spawn_agent', 'Spawn', 'Inspect the failing parser case.'],
    ['subagent_wait', 'wait_agent', 'Wait', 'Completed within 10m'],
    ['subagent_send_input', 'send_input', 'Input', 'Follow up with the smallest fix.'],
    ['subagent_resume', 'resume_agent', 'Resume', 'Pending init'],
    ['subagent_close', 'close_agent', 'Close', 'Previous status: completed'],
  ] as const;

  for (const [toolKind, tool, label, preview] of cases) {
    const markup = renderToStaticMarkup(
      createElement(ToolCall, {
        tool,
        toolKind,
        agentId: SUBAGENT_ID,
        agentNickname: 'Ada',
        agentRole: 'worker',
        preview,
        summary: `${tool} -> Ada`,
        input: 'agent operation',
        output: 'done',
        status: 'pending',
      }),
    );

    assert.match(markup, />SUBAGENT</);
    assert.match(markup, new RegExp(label));
    assert.match(markup, /data-section-width="action"/);
    assert.match(markup, /min-w-\[12ch\]/);
    assert.match(markup, /data-agent-identity-tag="nickname"/);
    assert.match(markup, />Ada</);
    assert.match(markup, /data-agent-identity-tag="id"/);
    assert.match(markup, />d83783</);
    assert.match(markup, new RegExp(preview.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(markup, new RegExp(`${tool} &gt; Ada`));
    assert.match(markup, /--transcript-row-accent:var\(--category-cyan\)/);
    assert.match(markup, /Running/);
    assert.match(markup, new RegExp(`aria-label="Expand ${tool} tool details"`));
    assert.match(markup, /absolute inset-0 z-0 cursor-pointer bg-transparent/);
    assert.equal(countMatches(markup, /aria-expanded=/g), 1);
    assert.match(markup, /aria-hidden="true" class="inline-flex size-6 shrink-0/);
    assert.doesNotMatch(markup, /pointer-events-auto inline-flex size-6/);
    assert.doesNotMatch(markup, />TOOL</);
    assert.match(markup, /aria-label="Copy agent nickname Ada"/);
    assert.match(markup, /data-copy-value="Ada"/);
    assert.match(markup, /aria-label="Copy full agent ID 019e27af-615f-7bf0-a26a-ee42ecd83783"/);
    assert.match(markup, /data-copy-value="019e27af-615f-7bf0-a26a-ee42ecd83783"/);
    assert.equal(countMatches(markup, /<button/g), 3);
  }
});

test('ToolCall uses nonredundant subagent fallback previews without preview data', () => {
  const cases = [
    ['subagent_spawn', 'spawn_agent', 'Spawn request', false],
    ['subagent_wait', 'wait_agent', 'Wait request', true],
    ['subagent_send_input', 'send_input', 'Follow-up submitted', true],
    ['subagent_resume', 'resume_agent', 'Resume requested', true],
    ['subagent_close', 'close_agent', 'Close requested', true],
  ] as const;

  for (const [toolKind, tool, fallback, includeAgentMetadata] of cases) {
    const markup = renderToStaticMarkup(
      createElement(ToolCall, {
        tool,
        toolKind,
        agentId: includeAgentMetadata ? SUBAGENT_ID : undefined,
        agentNickname: includeAgentMetadata ? 'Ada' : undefined,
        agentRole: includeAgentMetadata ? 'worker' : undefined,
        summary: `${tool} -> Ada`,
        input: 'agent operation',
        output: 'done',
      }),
    );

    assert.match(markup, new RegExp(`>${fallback}<`));
    assert.doesNotMatch(markup, new RegExp(`${tool} &gt; Ada`));
    if (includeAgentMetadata) {
      assert.match(markup, /data-agent-identity-tag="nickname"/);
    } else {
      assert.doesNotMatch(markup, /data-agent-identity-tag=/);
    }
  }
});

test('expanded subagent tool details do not repeat header agent identity tags', () => {
  const markup = renderToStaticMarkup(
    createElement(ToolCall, {
      tool: 'spawn_agent',
      toolKind: 'subagent_spawn',
      agentId: SUBAGENT_ID,
      agentNickname: 'Ada',
      agentRole: 'worker',
      summary: 'spawn_agent -> Ada',
      input: 'agent operation',
      output: 'done',
      defaultExpanded: true,
    }),
  );

  assert.doesNotMatch(markup, />Agent</);
  assert.match(markup, /aria-label="Copy agent nickname Ada"/);
  assert.match(markup, /data-copy-value="Ada"/);
  assert.match(markup, /aria-label="Copy full agent ID 019e27af-615f-7bf0-a26a-ee42ecd83783"/);
  assert.match(markup, /data-copy-value="019e27af-615f-7bf0-a26a-ee42ecd83783"/);
  assert.equal(markup.match(/data-agent-identity-tag="nickname"/g)?.length ?? 0, 1);
  assert.equal(markup.match(/data-agent-identity-tag="id"/g)?.length ?? 0, 1);
  assert.match(markup, />Input</);
  assert.match(markup, />Output</);
});

test('SubagentNotification collapsed row keeps inspectable details behind disclosure', () => {
  const rawPayload =
    '<subagent_notification>\n{"agent_path":"019e27af-615f-7bf0-a26a-ee42ecd83783","status":{"completed":"done"}}\n</subagent_notification>';
  const markup = renderToStaticMarkup(
    createElement(SubagentNotification, {
      agentId: SUBAGENT_ID,
      agentNickname: 'Ada',
      agentRole: 'worker',
      status: 'completed',
      summary: 'The parser is treating inherited metadata as current-session metadata.',
      rawPayload,
      timestamp: '10:46:29',
    }),
  );

  assert.match(markup, />SUBAGENT</);
  assert.match(markup, />Notification</);
  assert.match(markup, /data-section-width="action"/);
  assert.match(markup, /min-w-\[12ch\]/);
  assert.doesNotMatch(markup, /Completed/);
  assert.doesNotMatch(markup, /success-weak/);
  assert.match(markup, /data-agent-identity-tag="nickname"/);
  assert.match(markup, /data-agent-identity-tag="id"/);
  assert.match(markup, />d83783</);
  assert.match(markup, /The parser is treating inherited metadata/);
  assert.match(markup, /aria-expanded="false"/);
  assert.equal(countMatches(markup, /aria-expanded=/g), 1);
  assert.match(markup, /aria-label="Expand subagent notification details for Ada \(d83783\)"/);
  assert.match(markup, /aria-hidden="true" class="inline-flex size-6 shrink-0/);
  assert.doesNotMatch(markup, /pointer-events-auto inline-flex size-6/);
  assert.match(markup, /lucide-chevron-right/);
  assert.equal(countMatches(markup, /<button/g), 4);
  assert.match(markup, /aria-label="Copy agent nickname Ada"/);
  assert.match(markup, /data-copy-value="Ada"/);
  assert.match(markup, /aria-label="Copy full agent ID 019e27af-615f-7bf0-a26a-ee42ecd83783"/);
  assert.match(markup, /data-copy-value="019e27af-615f-7bf0-a26a-ee42ecd83783"/);
  assert.doesNotMatch(markup, /Copy subagent notification result/);
  assert.doesNotMatch(markup, /Copy raw subagent notification payload/);
  assert.match(markup, /aria-label="Copy UTC timestamp 10:46:29"/);
  assert.match(markup, /title="10:46:29 AM local time; click to copy UTC timestamp 10:46:29"/);
  assert.doesNotMatch(markup, /agent_path/);
  assert.doesNotMatch(markup, />User</);
});

test('expanded SubagentNotification exposes result and source without repeated identity detail', () => {
  const rawPayload =
    '<subagent_notification>\n{"agent_path":"019e27af-615f-7bf0-a26a-ee42ecd83783","status":{"completed":"done"}}\n</subagent_notification>';
  const markup = renderToStaticMarkup(
    createElement(SubagentNotification, {
      agentId: SUBAGENT_ID,
      agentNickname: 'Ada',
      agentRole: 'worker',
      status: 'completed',
      summary: 'The parser is treating inherited metadata as current-session metadata.',
      rawPayload,
      timestamp: '10:46:29',
      defaultExpanded: true,
    }),
  );

  assert.match(markup, /aria-expanded="true"/);
  assert.equal(countMatches(markup, /aria-expanded=/g), 1);
  assert.match(markup, /aria-label="Collapse subagent notification details for Ada \(d83783\)"/);
  assert.match(markup, /lucide-chevron-down/);
  assert.doesNotMatch(markup, />Agent</);
  assert.match(markup, /aria-label="Copy agent nickname Ada"/);
  assert.match(markup, /data-copy-value="Ada"/);
  assert.match(markup, /aria-label="Copy full agent ID 019e27af-615f-7bf0-a26a-ee42ecd83783"/);
  assert.match(markup, /data-copy-value="019e27af-615f-7bf0-a26a-ee42ecd83783"/);
  assert.equal(markup.match(/data-agent-identity-tag="nickname"/g)?.length ?? 0, 1);
  assert.equal(markup.match(/data-agent-identity-tag="id"/g)?.length ?? 0, 1);
  assert.match(markup, /aria-label="Copy UTC timestamp 10:46:29"/);
  assert.match(markup, />Result</);
  assert.match(markup, /aria-label="Copy subagent notification result for Ada \(d83783\)"/);
  assert.match(markup, />Raw Payload</);
  assert.match(markup, /aria-label="Copy raw subagent notification payload for Ada \(d83783\)"/);
  assert.match(markup, /agent_path/);
  assert.doesNotMatch(markup, />Copy<\/span>/);
  assert.equal(markup.match(/lucide-copy/g)?.length ?? 0, 2);
  assert.equal(markup.match(/size-6 justify-center p-0/g)?.length ?? 0, 2);
});
