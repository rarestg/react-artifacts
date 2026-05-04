import { Tag } from '../../../components/Tag';
import { getTurnItemKey } from './keys';
import { MessageCard } from './MessageCard';
import { TokenCounter } from './TokenCounter';
import { ToolCall } from './ToolCall';
import type { RenderMode, TurnItem, VisibleTypes } from './types';

export type ConversationTurnProps = {
  turnNumber: number;
  timestamp?: string;
  duration?: string;
  items: TurnItem[];
  renderModes?: RenderMode[];
  onToggleRender?: (messageIndex: number) => void;
  visibleTypes?: Partial<VisibleTypes>;
};

export function ConversationTurn({
  turnNumber,
  timestamp,
  duration,
  items,
  renderModes,
  onToggleRender,
  visibleTypes,
}: ConversationTurnProps) {
  // Filter items based on visible types
  const filteredItems = items.filter((item) => {
    if (item.type === 'token_counter') return visibleTypes?.tokenCounters ?? true;
    if (item.type === 'tool_call') return visibleTypes?.toolCalls ?? true;
    if (item.role === 'user') return visibleTypes?.user ?? true;
    if (item.role === 'assistant') return visibleTypes?.assistant ?? true;
    if (item.role === 'thinking') return visibleTypes?.thinking ?? true;
    return true;
  });

  if (filteredItems.length === 0) return null;

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)]">
      {/* Turn header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-muted)]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--text)]">Turn {turnNumber}</span>
          {timestamp && <span className="text-[10px] text-[var(--text-subtle)] tabular-nums">{timestamp}</span>}
        </div>
        <div className="flex items-center gap-2">
          {duration && (
            <Tag variant="muted" className="tabular-nums">
              {duration}
            </Tag>
          )}
          <Tag variant="muted" className="tabular-nums">
            {filteredItems.length} items
          </Tag>
        </div>
      </div>

      {/* Messages */}
      <div className="p-3 space-y-3">
        {filteredItems.map((item) => {
          // Find original index for render mode
          const originalIndex = items.indexOf(item);

          if (item.type === 'token_counter') {
            return <TokenCounter key={getTurnItemKey(item)} used={item.used} limit={item.limit} label={item.label} />;
          }

          if (item.type === 'tool_call') {
            return (
              <ToolCall
                key={getTurnItemKey(item)}
                tool={item.tool}
                input={item.input}
                output={item.output}
                timestamp={item.timestamp}
                status={item.status}
              />
            );
          }

          return (
            <MessageCard
              key={getTurnItemKey(item)}
              role={item.role}
              content={item.content}
              timestamp={item.timestamp}
              renderMode={renderModes?.[originalIndex] || 'default'}
              onToggleRender={() => onToggleRender?.(originalIndex)}
            />
          );
        })}
      </div>
    </div>
  );
}
