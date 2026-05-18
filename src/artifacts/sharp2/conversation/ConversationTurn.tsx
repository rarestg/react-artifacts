import type { ReactNode } from 'react';
import { getTurnItemKey } from './keys';
import { MessageCard } from './MessageCard';
import { TokenCounter } from './TokenCounter';
import { ToolCall } from './ToolCall';
import { formatConversationTimestamp, formatConversationTimestampTitle } from './time';
import {
  type ConversationDetailVisibility,
  getTurnItemVisibleType,
  type RenderMode,
  type TurnItem,
  type VisibleTypes,
} from './types';

function TurnMetaBadge({
  children,
  title,
  uppercase = true,
}: {
  children: ReactNode;
  title?: string;
  uppercase?: boolean;
}) {
  return (
    <span
      title={title}
      className={`inline-flex h-6 items-center border border-[var(--border)] bg-[var(--surface)] px-1.5 text-[10px] font-semibold ${
        uppercase ? 'uppercase' : 'normal-case'
      } text-[var(--text-muted)] tabular-nums`}
    >
      {children}
    </span>
  );
}

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
  let availableItemCount = 0;

  for (const [originalIndex, item] of items.entries()) {
    const visibleType = getTurnItemVisibleType(item);

    if (item.type === 'tool_call') {
      availableItemCount += 1;
      if (showToolSummaries) {
        filteredItems.push({ item, originalIndex });
      }
      continue;
    }

    if (item.type === 'token_counter') {
      if (showTokenCounters && (showIntermediateTokenCounters || originalIndex === finalTokenCounterIndex)) {
        availableItemCount += 1;
      }
      if (showTokenCounters && (showIntermediateTokenCounters || originalIndex === finalTokenCounterIndex)) {
        filteredItems.push({ item, originalIndex });
      }
      continue;
    }

    availableItemCount += 1;
    if (visibleTypes?.[visibleType] ?? true) {
      filteredItems.push({ item, originalIndex });
    }
  }

  if (filteredItems.length === 0) return null;

  const itemCountTitle = `${filteredItems.length} of ${availableItemCount} transcript rows visible for Turn ${turnNumber}`;
  const formattedTimestamp = formatConversationTimestamp(timestamp);
  const timestampTitle = formatConversationTimestampTitle(timestamp);

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)]">
      {/* Turn header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-muted)]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--text)]">Turn {turnNumber}</span>
          {formattedTimestamp && (
            <span
              title={timestampTitle ? `${timestampTitle} local time` : undefined}
              className="border-l border-[var(--border)] pl-3 text-[10px] text-[var(--text-subtle)] tabular-nums"
            >
              {formattedTimestamp}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {duration && (
            <TurnMetaBadge title={`${duration} elapsed in Turn ${turnNumber}`} uppercase={false}>
              {duration}
            </TurnMetaBadge>
          )}
          <TurnMetaBadge title={itemCountTitle}>
            {filteredItems.length} / {availableItemCount} visible
          </TurnMetaBadge>
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
                renderMode={item.role === 'assistant' ? renderModes?.[originalIndex] || 'default' : 'default'}
                onToggleRender={
                  item.role === 'assistant' && onToggleRender ? () => onToggleRender(originalIndex) : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
