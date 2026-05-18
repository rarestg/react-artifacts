/**
 * Temporary product transcript/read contract outline for sharp2 conversation export planning.
 *
 * These type-only DTOs intentionally mirror the proposed codexscope.product.v1 shape without importing
 * UI code, renderer internals, parser IR, or generated backend models. Replace this file with generated
 * codexscope-model types once that package is available to the product host.
 */

export type KnownOrUnknown<T extends string> = T | (string & {});

export type ApiInfo = {
  contractVersion: 'codexscope.product.v1';
  capabilities: readonly string[];
};

export type ProductError = {
  code: string;
  message: string;
  recoverable: boolean;
  recoveryAction: KnownOrUnknown<'choose_root' | 'retry' | 'reindex' | 'open_debug'> | null;
  detailsForDebug: string | null;
};

export type RepoIdentitySummary = {
  repoIdentityId: string;
  label: string;
  source: KnownOrUnknown<'git_remote' | 'repo_root' | 'unknown'>;
};

export type TranscriptContentMode = KnownOrUnknown<'current' | 'include_rolled_back'>;

export type TranscriptVisibility = {
  thinking: boolean;
  tools: boolean;
  toolOutput: boolean;
  telemetry: boolean;
  metadata: boolean;
  rolledBack: boolean;
};

export type TranscriptPageRequest =
  | {
      mode: 'beginning';
      sessionId: string;
      limit: number;
      visibility: TranscriptVisibility;
      contentMode: TranscriptContentMode;
    }
  | {
      mode: 'around';
      sessionId: string;
      transcriptItemId: string;
      matchId?: string;
      limit: number;
      visibility: TranscriptVisibility;
      contentMode: TranscriptContentMode;
    }
  | {
      mode: 'around';
      sessionId: string;
      matchId: string;
      transcriptItemId?: string;
      limit: number;
      visibility: TranscriptVisibility;
      contentMode: TranscriptContentMode;
    }
  | {
      mode: 'latest';
      sessionId: string;
      follow: boolean;
      limit: number;
      visibility: TranscriptVisibility;
      contentMode: TranscriptContentMode;
    }
  | {
      mode: 'page_before';
      sessionId: string;
      beforeCursor: string;
      limit: number;
      visibility: TranscriptVisibility;
      contentMode: TranscriptContentMode;
    }
  | {
      mode: 'page_after';
      sessionId: string;
      afterCursor: string;
      limit: number;
      visibility: TranscriptVisibility;
      contentMode: TranscriptContentMode;
    };

export type TranscriptSessionHeader = {
  sessionId: string;
  displayTitle: string;
  titleSource: KnownOrUnknown<'persisted' | 'first_user_message' | 'unknown'>;
  workspacePath: string | null;
  repoIdentity: RepoIdentitySummary | null;
  startedAt: string | null;
  lastActivityAt: string | null;
};

export type TranscriptRole = KnownOrUnknown<'user' | 'assistant' | 'tool' | 'agent' | 'metadata' | 'unknown'>;

export type TranscriptItemCategory = KnownOrUnknown<
  | 'message'
  | 'thinking'
  | 'tool_call'
  | 'tool_output'
  | 'agent_event'
  | 'telemetry'
  | 'metadata'
  | 'rollback'
  | 'unknown'
>;

export type ForceVisibleReason = KnownOrUnknown<'search_match' | 'find_match'>;

export type ToolStatus = KnownOrUnknown<
  'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'unknown'
> | null;

// Product adapters derive previews and call/output relationships upstream. The renderer
// should not parse raw tool arguments or use callId as row state identity.
export type ToolSummary = {
  name: string | null;
  callId: string | null;
  status: ToolStatus;
  targetSessionIds: readonly string[];
  argumentsPreview: string | null;
};

export type AgentEventType = KnownOrUnknown<
  'spawn' | 'wait' | 'resume' | 'send_input' | 'close' | 'notification' | 'unknown'
>;

export type AgentEventStatus = KnownOrUnknown<
  'spawned' | 'running' | 'completed' | 'failed' | 'waiting' | 'resumed' | 'unresolved' | 'unknown'
> | null;

export type AgentEventSummary = {
  eventType: AgentEventType;
  status: AgentEventStatus;
  nickname: string | null;
  role: string | null;
  targetSessionId: string | null;
  provisional: boolean;
  unresolved: boolean;
};

export type TranscriptItem = {
  transcriptItemId: string;
  jumpTargetId: string;
  sessionId: string;
  role: TranscriptRole | null;
  visibility: KnownOrUnknown<'default' | 'optional' | 'debug'>;
  category: TranscriptItemCategory;
  defaultVisible: boolean;
  forceVisibleReason: ForceVisibleReason | null;
  rolledBack: boolean;
  timestamp: string | null;
  textPreview: string;
  isTruncated: boolean;
  detailsAvailable: boolean;
  tool: ToolSummary | null;
  agentEvent: AgentEventSummary | null;
  rawDebugAvailable: boolean;
};

export type TranscriptHighlight = {
  matchId: string;
  transcriptItemId: string;
  startOffset: number;
  endOffset: number;
};

export type TranscriptPageResponse = {
  apiInfo: ApiInfo;
  header: TranscriptSessionHeader;
  items: readonly TranscriptItem[];
  beforeCursor: string | null;
  afterCursor: string | null;
  targetTranscriptItemId: string | null;
  selectedMatchId: string | null;
  highlights?: readonly TranscriptHighlight[];
  error?: ProductError;
};

export type TranscriptItemDetailsRequest = {
  sessionId: string;
  transcriptItemId: string;
  includeRawDebug?: boolean;
};

export type TranscriptItemDetailsResponse = {
  apiInfo: ApiInfo;
  transcriptItemId: string;
  fullText: string | null;
  tool: {
    raw: string | null;
    parsedJson: unknown | null;
    parseError: string | null;
    normalizedStatus: ToolSummary['status'];
  } | null;
  rawDebug?: {
    evidenceIds: readonly string[];
    sourceRefs?: readonly unknown[];
    rawJson?: string;
  };
  error?: ProductError;
};

export type FindTranscriptRequest = {
  sessionId: string;
  query: string;
  cursor?: string;
  limit: number;
  visibility: TranscriptVisibility;
  contentMode: TranscriptContentMode;
};

export type FindTranscriptMatch = {
  matchId: string;
  transcriptItemId: string;
  sessionId: string;
  preview: string;
  highlights?: readonly TranscriptHighlight[];
};

export type FindTranscriptResponse = {
  apiInfo: ApiInfo;
  matches: readonly FindTranscriptMatch[];
  beforeCursor: string | null;
  afterCursor: string | null;
  error?: ProductError;
};

export type SessionFamilyTimelineRequest = {
  sessionId: string;
};

export type SessionFamilyTimelineNode = {
  sessionId: string;
  parentSessionId: string | null;
  depth: number;
  nickname: string | null;
  role: string | null;
  path: string | null;
  workspacePath: string | null;
  repoIdentity: RepoIdentitySummary | null;
  source: KnownOrUnknown<'root' | 'subagent' | 'fork' | 'unknown'>;
  provisional: boolean;
  unresolved: boolean;
};

// Family timeline data is product-normalized context. Duplicate raw deliveries
// such as a wait result plus notification should be grouped before rendering.
export type SessionFamilyTimelineItem = {
  eventId: string;
  eventType: AgentEventType;
  status: AgentEventStatus;
  parentJumpTargetId: string | null;
  childJumpTargetId: string | null;
  evidenceIds: readonly string[];
  groupedWithEventIds: readonly string[];
  targetSessionIds: readonly string[];
  rawDebugAvailable: boolean;
  timestamp: string | null;
};

export type SessionFamilyTimelineResponse = {
  apiInfo: ApiInfo;
  rootSessionId: string;
  nodes: readonly SessionFamilyTimelineNode[];
  events: readonly SessionFamilyTimelineItem[];
  error?: ProductError;
};
