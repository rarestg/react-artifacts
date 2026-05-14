export type ToolCallStatus = 'success' | 'error' | 'pending';
export type MessageRole = 'user' | 'assistant' | 'thinking';
export type RenderMode = 'default' | 'literal' | 'rendered';

export type VisibleTypes = {
  user: boolean;
  assistant: boolean;
  thinking: boolean;
  toolCalls: boolean;
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
  tool: string;
  input: string;
  output: string;
  timestamp?: string;
  status?: ToolCallStatus;
};

export type TurnItem = MessageItem | TokenCounterItem | ToolCallItem;

export function getTurnItemVisibleType(item: TurnItem): VisibleType {
  if (item.type === 'token_counter') return 'tokenCounters';
  if (item.type === 'tool_call') return 'toolCalls';
  return item.role;
}

export type ConversationTurnData = {
  id?: string;
  turnNumber: number;
  timestamp?: string;
  duration?: string;
  items: TurnItem[];
};
