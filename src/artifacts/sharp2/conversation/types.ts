export type ToolCallStatus = 'success' | 'error' | 'pending';
export type ToolCallKind =
  | 'standard'
  | 'subagent_spawn'
  | 'subagent_wait'
  | 'subagent_send_input'
  | 'subagent_resume'
  | 'subagent_close';
export type SubagentNotificationStatus = 'completed' | 'failed' | 'running' | 'timed_out';
export type MessageRole = 'user' | 'assistant' | 'thinking';
export type RenderMode = 'default' | 'literal' | 'rendered';

export type VisibleTypes = {
  user: boolean;
  assistant: boolean;
  thinking: boolean;
  toolCalls: boolean;
  subagentActivity: boolean;
  tokenCounters: boolean;
};
export type VisibleType = keyof VisibleTypes;

export type ConversationDetailVisibility = {
  showToolSummaries: boolean;
  showTokenCounters: boolean;
  showIntermediateTokenCounters: boolean;
};

export type MessageItem = {
  id?: string;
  role: MessageRole;
  content: string;
  timestamp?: string;
  type?: undefined;
};

export type TokenCounterItem = {
  id?: string;
  type: 'token_counter';
  used: number;
  limit: number;
  label?: string;
  cached?: number;
  inputTokens?: number;
  outputTokens?: number;
  reasoningOutputTokens?: number;
  lastUsage?: {
    inputTokens?: number;
    cachedInputTokens?: number;
    outputTokens?: number;
    reasoningOutputTokens?: number;
    totalTokens?: number;
  };
  rateLimits?: unknown;
};

export type ToolCallItem = {
  id?: string;
  type: 'tool_call';
  toolKind?: ToolCallKind;
  tool: string;
  agentId?: string;
  agentNickname?: string;
  agentRole?: string;
  preview?: string;
  summary?: string;
  input: string;
  output: string;
  timestamp?: string;
  status?: ToolCallStatus;
};

export type SubagentNotificationItem = {
  id?: string;
  type: 'subagent_notification';
  agentId: string;
  agentNickname?: string;
  agentRole?: string;
  status: SubagentNotificationStatus;
  summary: string;
  rawPayload?: string;
  timestamp?: string;
};

export type TurnItem = MessageItem | TokenCounterItem | ToolCallItem | SubagentNotificationItem;

export function isSubagentToolKind(toolKind: ToolCallKind | undefined): boolean {
  return toolKind !== undefined && toolKind !== 'standard';
}

export function getTurnItemVisibleType(item: TurnItem): VisibleType {
  if (item.type === 'token_counter') return 'tokenCounters';
  if (item.type === 'subagent_notification') return 'subagentActivity';
  if (item.type === 'tool_call') return isSubagentToolKind(item.toolKind) ? 'subagentActivity' : 'toolCalls';
  return item.role;
}

export type ConversationTurnData = {
  id?: string;
  turnNumber: number;
  timestamp?: string;
  duration?: string;
  items: TurnItem[];
};
