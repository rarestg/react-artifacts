import type { ConversationTurnData, TurnItem } from './types';

export const getTurnKey = (turn: ConversationTurnData) => turn.id ?? `turn-${turn.turnNumber}-${turn.timestamp ?? ''}`;

const hashString = (value: string) => {
  let hash = 0x811c9dc5;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
};

const hashFields = (fields: unknown[]) =>
  hashString(JSON.stringify(fields.map((field) => [typeof field, String(field)])));

const withOriginalIndex = (key: string, originalIndex?: number) =>
  originalIndex === undefined ? key : `${key}-${originalIndex}`;

export const getTurnItemKey = (item: TurnItem, originalIndex?: number) => {
  if (item.id) return withOriginalIndex(item.id, originalIndex);
  if (item.type === 'token_counter') {
    return withOriginalIndex(
      `token-${hashFields(['token_counter', item.label ?? 'context', item.used, item.limit])}`,
      originalIndex,
    );
  }
  if (item.type === 'tool_call') {
    return withOriginalIndex(
      `tool-${hashFields(['tool_call', item.tool, item.timestamp ?? '', item.input, item.output, item.status ?? ''])}`,
      originalIndex,
    );
  }
  return withOriginalIndex(
    `msg-${hashFields(['message', item.role, item.timestamp ?? '', item.content])}`,
    originalIndex,
  );
};
