export type ToolCallStatus = 'success' | 'error' | 'pending';
export type MessageRole = 'user' | 'assistant' | 'thinking' | 'tool';
export type RenderMode = 'default' | 'literal' | 'rendered';

export type VisibleTypes = {
  user: boolean;
  assistant: boolean;
  thinking: boolean;
  toolCalls: boolean;
  tokenCounters: boolean;
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

export type ConversationTurnData = {
  id?: string;
  turnNumber: number;
  timestamp?: string;
  duration?: string;
  items: TurnItem[];
};
