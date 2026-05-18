import { Tag } from '../../../components/Tag';
import { getTurnItemKey } from './keys';
import { MessageCard } from './MessageCard';
import { TokenCounter } from './TokenCounter';
import { ToolCall } from './ToolCall';
import {
  type ConversationDetailVisibility,
  getTurnItemVisibleType,
  type RenderMode,
  type TurnItem,
  type VisibleTypes,
} from './types';

export type ConversationTurnProps = {
  turnNumber: number;
  timestamp?: string;
  duration?: string;
  items: TurnItem[];
  renderModes?: RenderMode[];
  onToggleRender?: (messageIndex: number) => void;
  visibleTypes?: Partial<VisibleTypes>;
  detailVisibility?: Partial<ConversationDetailVisibility>;
};

export function ConversationTurn({
  turnNumber,
  timestamp,
  duration,
  items,
  renderModes,
  onToggleRender,
  visibleTypes,
  detailVisibility,
}: ConversationTurnProps) {
  const showToolSummaries = detailVisibility?.showToolSummaries ?? visibleTypes?.toolCalls ?? true;
  const showToolDetails = detailVisibility?.showToolDetails ?? true;
  const showTokenCounters = detailVisibility?.showTokenCounters ?? visibleTypes?.tokenCounters ?? true;
  const showIntermediateTokenCounters = detailVisibility?.showIntermediateTokenCounters ?? false;
  let finalTokenCounterIndex = -1;

  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (items[index]?.type === 'token_counter') {
      finalTokenCounterIndex = index;
      break;
    }
  }

  const filteredItems: Array<{ item: TurnItem; originalIndex: number }> = [];

  for (const [originalIndex, item] of items.entries()) {
    const visibleType = getTurnItemVisibleType(item);

    if (item.type === 'tool_call') {
      if (showToolSummaries) {
        filteredItems.push({ item, originalIndex });
      }
      continue;
    }

    if (item.type === 'token_counter') {
      if (showTokenCounters && (showIntermediateTokenCounters || originalIndex === finalTokenCounterIndex)) {
        filteredItems.push({ item, originalIndex });
      }
      continue;
    }

    if (item.role === 'tool') {
      if (showToolSummaries) {
        filteredItems.push({ item, originalIndex });
      }
      continue;
    }

    if (visibleTypes?.[visibleType] ?? true) {
      filteredItems.push({ item, originalIndex });
    }
  }

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

      {/* Transcript rows */}
      <div className="flex flex-col">
        {filteredItems.map(({ item, originalIndex }) => {
          if (item.type === 'token_counter') {
            return (
              <div
                key={getTurnItemKey(item, originalIndex)}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                <TokenCounter
                  used={item.used}
                  limit={item.limit}
                  label={item.label}
                  cached={item.cached}
                  inputTokens={item.inputTokens}
                  outputTokens={item.outputTokens}
                  reasoningOutputTokens={item.reasoningOutputTokens}
                  lastUsage={item.lastUsage}
                  rateLimits={item.rateLimits}
                />
              </div>
            );
          }

          if (item.type === 'tool_call') {
            return (
              <div
                key={getTurnItemKey(item, originalIndex)}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                <ToolCall
                  tool={item.tool}
                  input={item.input}
                  output={item.output}
                  timestamp={item.timestamp}
                  status={item.status}
                  showDetails={showToolDetails}
                />
              </div>
            );
          }

          return (
            <div key={getTurnItemKey(item, originalIndex)} className="border-b border-[var(--border)] last:border-b-0">
              <MessageCard
                role={item.role}
                content={item.content}
                timestamp={item.timestamp}
                renderMode={renderModes?.[originalIndex] || 'default'}
                onToggleRender={onToggleRender ? () => onToggleRender(originalIndex) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
