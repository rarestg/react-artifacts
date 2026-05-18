import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

import type {
  FindTranscriptRequest,
  FindTranscriptResponse,
  SessionFamilyTimelineRequest,
  SessionFamilyTimelineResponse,
  TranscriptItemDetailsRequest,
  TranscriptItemDetailsResponse,
  TranscriptPageRequest,
  TranscriptPageResponse,
} from '../../src/artifacts/sharp2/conversation';

const sharp2Dir = 'src/artifacts/sharp2';
const sharp2ConversationDir = `${sharp2Dir}/conversation`;
const sharp2ReadmePath = `${sharp2Dir}/README.md`;
const conversationExportReadinessPath = `${sharp2Dir}/conversation-export-readiness.md`;
const importSpecifierPattern =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const sharedPrimitiveNames = [
  'Checkbox',
  'FilterCheckbox',
  'Toggle',
  'SegmentedControl',
  'CopyButton',
  'CopyableLabel',
  'StatusTag',
  'Button',
  'Input',
  'Tag',
  'Panel',
  'ListboxSelect',
  'ArtifactDialog',
  'panelHeaderClasses',
];

type ProductContractRequestResponseSmoke =
  | TranscriptPageRequest
  | TranscriptPageResponse
  | TranscriptItemDetailsRequest
  | TranscriptItemDetailsResponse
  | FindTranscriptRequest
  | FindTranscriptResponse
  | SessionFamilyTimelineRequest
  | SessionFamilyTimelineResponse;

void (undefined as unknown as ProductContractRequestResponseSmoke);

async function readSharp2SourceFiles(dir = sharp2Dir): Promise<Array<{ file: string; source: string }>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: Array<{ file: string; source: string }> = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await readSharp2SourceFiles(entryPath)));
      continue;
    }
    if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue;
    files.push({ file: entryPath, source: await readFile(entryPath, 'utf8') });
  }

  return files;
}

function getImportSpecifiers(source: string) {
  return [...source.matchAll(importSpecifierPattern)]
    .map((match) => match[1] ?? match[2])
    .filter((specifier): specifier is string => Boolean(specifier));
}

function toPosixPath(file: string) {
  return file.replace(/\\/g, '/');
}

function resolveRelativeImport(file: string, specifier: string) {
  if (!specifier.startsWith('.')) return undefined;

  return toPosixPath(path.normalize(path.join(path.dirname(file), specifier)));
}

test('sharp2 no longer defines primitives that belong to src/components', async () => {
  const files = await readSharp2SourceFiles();
  const joined = files.map(({ file, source }) => `\n// ${file}\n${source}`).join('\n');

  for (const name of sharedPrimitiveNames) {
    assert.doesNotMatch(
      joined,
      new RegExp(`^\\s*(?:export\\s+(?:default\\s+)?)?function\\s+${name}\\b`, 'm'),
      `${name} should not be defined under sharp2`,
    );
    assert.doesNotMatch(
      joined,
      new RegExp(`^\\s*(?:export\\s+)?const\\s+${name}\\b`, 'm'),
      `${name} should not be defined under sharp2`,
    );
  }
});

test('sharp2 imports shared primitives from src/components at usage sites', async () => {
  const files = await readSharp2SourceFiles();
  const joined = files.map(({ source }) => source).join('\n');

  for (const name of [
    'Button',
    'Input',
    'Tag',
    'Panel',
    'Checkbox',
    'FilterCheckbox',
    'Toggle',
    'SegmentedControl',
    'CopyButton',
    'CopyableLabel',
  ]) {
    assert.match(joined, new RegExp(`import \\{[^}]*${name}[^}]*\\} from ['"](?:\\.\\.\\/)+components\\/${name}['"]`));
  }
  assert.match(joined, /import \{ StatusTag \} from ['"](?:\.\.\/)+components\/StatusTag['"]/);
});

test('sharp2 documentation describes ArtifactThemeRoot and import-based shared components', async () => {
  const guide = await readFile(sharp2ReadmePath, 'utf8');

  assert.match(guide, /ArtifactThemeRoot/);
  assert.match(guide, /src\/components/);
  assert.match(guide, /import/i);
  assert.match(guide, /reference showcase/i);
  assert.match(guide, /not the design policy source of truth/i);
  assert.doesNotMatch(guide, /self-contained React file/i);
  assert.doesNotMatch(guide, /any React environment/i);
  assert.doesNotMatch(guide, /copy any component directly/i);
  assert.doesNotMatch(guide, /Copy Components Directly/i);
  assert.doesNotMatch(guide, /\bcopy the entire function\b/i);
  assert.doesNotMatch(guide, /\bcopy\b[^.\n]*\binto your (?:app|codebase)\b/i);
  assert.doesNotMatch(guide, /\bpaste\b[^.\n]*\bcomponent\b/i);
});

test('sharp2 README lists shared primitive ownership and showcase status', async () => {
  const guide = await readFile(sharp2ReadmePath, 'utf8');

  assert.match(guide, /Shared primitive APIs\s*\|\s*`src\/components\/\*`/);
  assert.match(guide, /`ListboxSelect`\s*\|\s*Shared but not currently demonstrated here\./);
  assert.match(guide, /`panelHeaderClasses`\s*\|\s*Shared but not currently demonstrated here\./);
  assert.match(guide, /`ArtifactDialog`\s*\|\s*Demonstrated in the modal section\./);

  for (const name of sharedPrimitiveNames) {
    assert.ok(guide.includes(`| \`${name}\``), `${name} should be listed in the sharp2 README`);
  }

  assert.doesNotMatch(guide, /`Button`[^|\n]*\|[^|\n]*\|[^|\n]*`size`: `sm`, `default`, `lg`/);
  assert.doesNotMatch(guide, /`(?:Checkbox|Toggle)`[^|\n]*\|[^|\n]*\|[^|\n]*`onChange`/);
});

test('Row remains sharp2-local and is not exported from src/components', async () => {
  const files = await readSharp2SourceFiles();
  const joined = files.map(({ source }) => source).join('\n');

  assert.match(joined, /function Row\b|export function Row\b/);

  await assert.rejects(readFile('src/components/Row.tsx', 'utf8'), /ENOENT/);
});

test('sharp2 keeps Panel structural instead of adding interactive affordances to it', async () => {
  const files = await readSharp2SourceFiles();

  for (const { file, source } of files) {
    assert.doesNotMatch(
      source,
      /<Panel\b[^>]*className="[^"]*(?:cursor-pointer|hover:bg|active:bg)/s,
      `${file} should not pass interactive affordance classes to shared Panel`,
    );
  }
});

test('sharp2 message filters use the shared FilterCheckbox primitive directly', async () => {
  const source = await readFile(`${sharp2Dir}/index.tsx`, 'utf8');

  assert.match(source, /import \{ FilterCheckbox \} from ['"](?:\.\.\/)+components\/FilterCheckbox['"]/);
  assert.match(source, /<FilterCheckbox\b/);
  assert.match(source, /borderStyle="neutral"/);
  await assert.rejects(readFile(`${sharp2Dir}/conversation/MessageTypeFilter.tsx`, 'utf8'), /ENOENT/);
  await assert.rejects(readFile(`${sharp2Dir}/conversation/MessageTypeToggle.tsx`, 'utf8'), /ENOENT/);
});

test('sharp2 conversation exposes a narrow local public barrel', async () => {
  const source = await readFile(`${sharp2Dir}/conversation/index.ts`, 'utf8');

  for (const name of [
    'ConversationTurn',
    'ConversationTurnProps',
    'ConversationTurnData',
    'ConversationVisibilityOptions',
    'ConversationDetailVisibility',
    'RenderMode',
    'VisibleTypes',
    'getTurnKey',
    'getTurnItemVisibleType',
    'tokenCounterPropsFromTelemetry',
    'TokenTelemetryPayload',
    'TokenUsageViewModel',
    'KnownOrUnknown',
    'ApiInfo',
    'TranscriptPageRequest',
    'TranscriptPageResponse',
    'TranscriptItem',
    'TranscriptItemDetailsRequest',
    'TranscriptItemDetailsResponse',
    'TranscriptVisibility',
    'ToolSummary',
    'AgentEventSummary',
    'ProductError',
  ]) {
    assert.match(source, new RegExp(`\\b${name}\\b`), `${name} should be exported from the conversation barrel`);
  }

  for (const privateName of [
    'MessageCard',
    'ToolCall',
    'SubagentNotification',
    'TranscriptRow',
    'EventDescriptor',
    'AgentIdentityTags',
    'TimestampBadge',
    'RenderErrorBoundary',
    'splitMessageContent',
  ]) {
    assert.doesNotMatch(
      source,
      new RegExp(`\\b${privateName}\\b`),
      `${privateName} should stay private to conversation internals`,
    );
  }
});

test('sharp2 conversation export-readiness doc states the product contract boundary', async () => {
  const guide = await readFile(sharp2ReadmePath, 'utf8');
  const doc = await readFile(conversationExportReadinessPath, 'utf8');

  assert.match(guide, /conversation-export-readiness\.md/);
  assert.match(doc, /codexscope\.product\.v1/);
  assert.match(doc, /getTranscriptPage/);
  assert.match(doc, /getTranscriptItemDetails/);
  assert.match(doc, /unknown product enum values must use runtime fallback labels/i);
  assert.match(doc, /ArtifactThemeRoot/);
  assert.match(doc, /theme tokens/i);
  assert.match(doc, /ParsedSessionFile[\s\S]*non-contract|non-contract[\s\S]*ParsedSessionFile/);
  assert.match(doc, /AnchorWindowEntry[\s\S]*non-contract|non-contract[\s\S]*AnchorWindowEntry/);
  assert.doesNotMatch(doc, /Target Product Contract[\s\S]{0,200}targets? (?:parser IR|raw JSONL|anchors)/i);
});

test('sharp2 temporary product types stay type-only and avoid parser contracts', async () => {
  const productTypes = await readFile(`${sharp2ConversationDir}/productTypes.ts`, 'utf8');
  const barrel = await readFile(`${sharp2ConversationDir}/index.ts`, 'utf8');
  const publicSurface = `${productTypes}\n${barrel}`;

  assert.match(productTypes, /Temporary product transcript\/read contract outline/);
  assert.match(productTypes, /codexscope-model/);
  assert.match(productTypes, /TranscriptPageRequest/);
  assert.match(productTypes, /TranscriptItemDetailsRequest/);
  assert.doesNotMatch(productTypes, /\bimport\b/);
  assert.doesNotMatch(productTypes, /from ['"]react['"]/);

  for (const parserTerm of ['ParsedSessionFile', 'AnchorWindowEntry', 'graph_events', 'lineage_evidence']) {
    assert.doesNotMatch(publicSurface, new RegExp(`\\b${parserTerm}\\b`), `${parserTerm} should not be a public type`);
  }
});

test('sharp2 product DTO smoke fixtures cover paged rows, details, and family timeline', () => {
  const apiInfo = {
    contractVersion: 'codexscope.product.v1',
    capabilities: ['transcript_page', 'item_details', 'family_timeline'],
  } as const;
  const visibility = {
    thinking: false,
    tools: true,
    toolOutput: false,
    telemetry: false,
    metadata: false,
    rolledBack: false,
  };
  const productError = {
    code: 'DETAILS_NOT_INDEXED',
    message: 'Raw debug details are not available yet.',
    recoverable: true,
    recoveryAction: 'reindex',
    detailsForDebug: 'missing evidence snapshot',
  } as const;

  const pageRequest = {
    mode: 'around',
    sessionId: 'root-thread-001',
    matchId: 'match-1',
    limit: 50,
    visibility,
    contentMode: 'future_content_mode',
  } satisfies TranscriptPageRequest;

  const aroundRequestBase = {
    mode: 'around',
    sessionId: 'root-thread-001',
    limit: 50,
    visibility,
    contentMode: 'future_content_mode',
  } as const;
  const itemAnchoredPageRequest = {
    ...aroundRequestBase,
    transcriptItemId: 'item-message-1',
  } satisfies TranscriptPageRequest;
  // @ts-expect-error around requests require transcriptItemId or matchId
  const anchorlessAroundRequest = aroundRequestBase satisfies TranscriptPageRequest;
  void itemAnchoredPageRequest;
  void anchorlessAroundRequest;

  const pageResponse = {
    apiInfo,
    header: {
      sessionId: 'root-thread-001',
      displayTitle: 'Inspect the parser issue',
      titleSource: 'first_user_message',
      workspacePath: '/workspace/app',
      repoIdentity: {
        repoIdentityId: 'repo-1',
        label: 'react-artifacts',
        source: 'git_remote',
      },
      startedAt: '2026-04-21T04:40:00.000Z',
      lastActivityAt: '2026-04-21T04:41:20.201Z',
    },
    items: [
      {
        transcriptItemId: 'item-message-1',
        jumpTargetId: 'jump-message-1',
        sessionId: 'root-thread-001',
        role: 'assistant',
        visibility: 'default',
        category: 'message',
        defaultVisible: true,
        forceVisibleReason: 'search_match',
        rolledBack: false,
        timestamp: '2026-04-21T04:41:00.000Z',
        textPreview: 'I will start a worker.',
        isTruncated: false,
        detailsAvailable: false,
        tool: null,
        agentEvent: null,
        rawDebugAvailable: false,
      },
      {
        transcriptItemId: 'item-agent-event-1',
        jumpTargetId: 'jump-agent-event-1',
        sessionId: 'root-thread-001',
        role: 'agent',
        visibility: 'optional',
        category: 'agent_event',
        defaultVisible: false,
        forceVisibleReason: null,
        rolledBack: false,
        timestamp: '2026-04-21T04:41:05.100Z',
        textPreview: 'Inspect the failing parser case and report back.',
        isTruncated: true,
        detailsAvailable: true,
        tool: {
          name: 'spawn_agent',
          callId: 'call_spawn_002',
          status: 'deferred_by_host',
          targetSessionIds: ['child-thread-123'],
          argumentsPreview: 'Inspect the failing parser case and report back.',
        },
        agentEvent: {
          eventType: 'handoff',
          status: 'paused',
          nickname: 'Ada',
          role: 'worker',
          targetSessionId: 'child-thread-123',
          provisional: true,
          unresolved: false,
        },
        rawDebugAvailable: true,
      },
    ],
    beforeCursor: 'before-cursor',
    afterCursor: 'after-cursor',
    targetTranscriptItemId: 'item-message-1',
    selectedMatchId: 'match-1',
    highlights: [{ matchId: 'match-1', transcriptItemId: 'item-message-1', startOffset: 0, endOffset: 7 }],
    error: productError,
  } satisfies TranscriptPageResponse;

  const detailsResponse = {
    apiInfo,
    transcriptItemId: 'item-agent-event-1',
    fullText: null,
    tool: {
      raw: '{"message":"Inspect the failing parser case and report back."}',
      parsedJson: { message: 'Inspect the failing parser case and report back.' },
      parseError: null,
      normalizedStatus: 'deferred_by_host',
    },
    rawDebug: {
      evidenceIds: ['evidence-1'],
      sourceRefs: [{ line: 42 }],
      rawJson: '{"type":"response_item"}',
    },
    error: productError,
  } satisfies TranscriptItemDetailsResponse;

  const findResponse = {
    apiInfo,
    matches: [
      {
        matchId: 'match-1',
        transcriptItemId: 'item-message-1',
        sessionId: 'root-thread-001',
        preview: 'Inspect the parser issue',
        highlights: [{ matchId: 'match-1', transcriptItemId: 'item-message-1', startOffset: 0, endOffset: 7 }],
      },
    ],
    beforeCursor: null,
    afterCursor: 'find-after-cursor',
  } satisfies FindTranscriptResponse;

  const familyResponse = {
    apiInfo,
    rootSessionId: 'root-thread-001',
    nodes: [
      {
        sessionId: 'child-thread-123',
        parentSessionId: 'root-thread-001',
        depth: 1,
        nickname: 'Ada',
        role: 'worker',
        path: null,
        workspacePath: '/workspace/app',
        repoIdentity: null,
        source: 'subagent',
        provisional: true,
        unresolved: true,
      },
    ],
    events: [
      {
        eventId: 'event-spawn-1',
        eventType: 'spawn',
        status: 'spawned',
        parentJumpTargetId: 'jump-agent-event-1',
        childJumpTargetId: null,
        evidenceIds: ['evidence-1'],
        groupedWithEventIds: ['event-notification-1'],
        targetSessionIds: ['child-thread-123'],
        rawDebugAvailable: true,
        timestamp: '2026-04-21T04:41:05.100Z',
      },
    ],
  } satisfies SessionFamilyTimelineResponse;

  assert.equal(pageRequest.contentMode, 'future_content_mode');
  assert.equal(pageResponse.items[1]?.tool?.status, 'deferred_by_host');
  assert.equal(pageResponse.items[1]?.agentEvent?.eventType, 'handoff');
  assert.equal(detailsResponse.rawDebug?.rawJson, '{"type":"response_item"}');
  assert.equal(findResponse.afterCursor, 'find-after-cursor');
  assert.equal(familyResponse.nodes[0]?.unresolved, true);
});

test('sharp2 production code avoids deep imports into conversation internals', async () => {
  const files = (await readSharp2SourceFiles()).filter(
    ({ file }) => !toPosixPath(file).startsWith(`${sharp2ConversationDir}/`),
  );
  const violations: string[] = [];

  for (const { file, source } of files) {
    for (const specifier of getImportSpecifiers(source)) {
      const resolvedImport = resolveRelativeImport(file, specifier);

      if (resolvedImport?.startsWith(`${sharp2ConversationDir}/`)) {
        violations.push(`${file} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test('sharp2 avoids viewport breakpoints in preview-sensitive showcase layout', async () => {
  const files = await readSharp2SourceFiles();
  const joined = files.map(({ file, source }) => `\n// ${file}\n${source}`).join('\n');

  assert.doesNotMatch(joined, /\b(?:sm|md|lg|xl|2xl):grid-cols-/);
  assert.doesNotMatch(joined, /grid-cols-\[200px_1fr\]/);
  assert.match(joined, /auto-fit|minmax\(/);
});

test('sharp2 SearchInput uses managed combobox focus instead of focusable option buttons', async () => {
  const source = await readFile('src/artifacts/sharp2/components/SearchInput.tsx', 'utf8');
  const indexSource = await readFile('src/artifacts/sharp2/index.tsx', 'utf8');

  assert.match(source, /role="combobox"/);
  assert.match(source, /ariaLabel/);
  assert.match(source, /aria-label=/);
  assert.match(indexSource, /ariaLabel="Search conversations"/);
  assert.match(source, /aria-expanded=/);
  assert.match(source, /aria-controls=/);
  assert.match(source, /aria-activedescendant=/);
  assert.match(source, /role="option"/);
  assert.match(source, /aria-selected=/);
  assert.match(source, /border-l-\[var\(--accent\)\]/);
  assert.match(source, /No results for/);
  const handleKeyDownStart = source.indexOf('const handleKeyDown');
  const escapeBranch = source.indexOf("event.key === 'Escape'", handleKeyDownStart);
  const emptyResultsReturn = /if \([^)]*results\.length === 0[^)]*\) return;/.exec(source.slice(handleKeyDownStart));
  assert.notEqual(handleKeyDownStart, -1);
  assert.notEqual(escapeBranch, -1);
  assert.ok(
    emptyResultsReturn === null || escapeBranch < handleKeyDownStart + emptyResultsReturn.index,
    'Escape should be handled before any empty-results early return',
  );
  assert.doesNotMatch(source, /<button[^>]*role="option"/s);
  assert.doesNotMatch(source, /focus:bg-\[var\(--surface-muted\)\]/);
  assert.doesNotMatch(source, /role="option"[\s\S]{0,600}focus-visible:/);
  assert.doesNotMatch(source, /role="option"[\s\S]{0,600}tabIndex=/);
  assert.doesNotMatch(source, /tabIndex=[\s\S]{0,600}role="option"/);
});

test('sharp2 Popover stays plain and avoids incomplete composite menu semantics', async () => {
  const source = await readFile('src/artifacts/sharp2/components/Popover.tsx', 'utf8');
  const indexSource = await readFile('src/artifacts/sharp2/index.tsx', 'utf8');

  assert.match(source, /aria-expanded/);
  assert.match(source, /aria-controls/);
  assert.match(source, /Escape/);
  assert.match(source, /focus\(\)/);
  assert.match(source, /focus-visible:bg-\[var\(--surface-muted\)\]/);
  assert.match(source, /focus-visible:ring-2/);
  assert.match(source, /event\.currentTarget instanceof HTMLButtonElement/);
  assert.doesNotMatch(source, /role="menu"/);
  assert.doesNotMatch(indexSource, /role="menuitem"/);
});

test('sharp2 Section exposes a labelled semantic section wrapper', async () => {
  const source = await readFile('src/artifacts/sharp2/components/Section.tsx', 'utf8');

  assert.match(source, /useId/);
  assert.match(source, /<section\b[\s\S]*aria-labelledby=\{titleId\}/);
  assert.match(source, /<h2\b[\s\S]*id=\{titleId\}/);
});
