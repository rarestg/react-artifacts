import type { ConversationTurnData, TurnItem } from './types';

export const getTurnKey = (turn: ConversationTurnData) => turn.id ?? `turn-${turn.turnNumber}-${turn.timestamp ?? ''}`;

export const getTurnItemKey = (item: TurnItem) => {
  if (item.id) return item.id;
  if (item.type === 'token_counter') {
    return `token-${item.label ?? 'context'}-${item.used}-${item.limit}`;
  }
  if (item.type === 'tool_call') {
    return `tool-${item.tool}-${item.timestamp ?? ''}-${item.input.length}-${item.output.length}`;
  }
  return `msg-${item.role}-${item.timestamp ?? ''}-${item.content.length}`;
};
