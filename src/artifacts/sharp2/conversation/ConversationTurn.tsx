import type { ReactNode } from 'react';
import { getTurnItemKey } from './keys';
import { MessageCard } from './MessageCard';
import { SubagentNotification } from './SubagentNotification';
import { TimestampBadge } from './TimestampBadge';
import { TokenCounter } from './TokenCounter';
import { ToolCall } from './ToolCall';
import { formatConversationTimestamp } from './time';
import {
  type ConversationDetailVisibility,
  type ConversationVisibilityOptions,
  getTurnItemVisibleType,
  type RenderMode,
  type TurnItem,
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
  renderModesByItemId?: Record<string, RenderMode>;
  onToggleRenderModeForItem?: (itemId: string) => void;
  visibleTypes?: ConversationVisibilityOptions;
  detailVisibility?: Partial<ConversationDetailVisibility>;
};

function TranscriptRowStackItem({ children }: { children: ReactNode }) {
  return <div className="border-b border-[var(--border)] last:border-b-0">{children}</div>;
}

export function ConversationTurn({
  turnNumber,
  timestamp,
  duration,
  items,
  renderModesByItemId,
  onToggleRenderModeForItem,
  visibleTypes,
  detailVisibility,
}: ConversationTurnProps) {
  const showTokenCounters = visibleTypes?.tokenCounters ?? true;
  const showIntermediateTokenCounters = detailVisibility?.showIntermediateTokenCounters ?? false;
  const showRawDebug = detailVisibility?.showRawDebug ?? false;
  const hasExplicitTokenCounterRoles = items.some(
    (item) =>
      item.type === 'token_counter' && (item.isFinalForTurn !== undefined || item.tokenCounterRole !== undefined),
  );
  let finalTokenCounterIndex = -1;

  if (!hasExplicitTokenCounterRoles) {
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (items[index]?.type === 'token_counter') {
        finalTokenCounterIndex = index;
        break;
      }
    }
  }

  const shouldShowTokenCounter = (item: TurnItem, originalIndex: number) => {
    if (item.type !== 'token_counter' || !showTokenCounters) return false;
    if (showIntermediateTokenCounters) return true;
    if (hasExplicitTokenCounterRoles) return item.isFinalForTurn === true || item.tokenCounterRole === 'final';
    return originalIndex === finalTokenCounterIndex;
  };

  const getAssistantRenderMode = (item: TurnItem): RenderMode => {
    if (item.type !== undefined) return 'default';
    if (item.role !== 'assistant') return 'default';
    if (item.id && renderModesByItemId?.[item.id]) return renderModesByItemId[item.id];
    return 'default';
  };

  const getAssistantRenderToggle = (item: TurnItem) => {
    if (item.type !== undefined) return undefined;
    if (item.role !== 'assistant') return undefined;
    const itemId = item.id;
    if (itemId && onToggleRenderModeForItem) return () => onToggleRenderModeForItem(itemId);
    return undefined;
  };

  const filteredItems: Array<{ item: TurnItem; originalIndex: number }> = [];
  let availableItemCount = 0;

  for (const [originalIndex, item] of items.entries()) {
    const visibleType = getTurnItemVisibleType(item);

    if (item.type === 'tool_call') {
      availableItemCount += 1;
      if (visibleTypes?.[visibleType] ?? true) {
        filteredItems.push({ item, originalIndex });
      }
      continue;
    }

    if (item.type === 'token_counter') {
      if (shouldShowTokenCounter(item, originalIndex)) {
        availableItemCount += 1;
      }
      if (shouldShowTokenCounter(item, originalIndex)) {
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
  const turnTimestampBadge =
    timestamp?.trim() && formatConversationTimestamp(timestamp) ? <TimestampBadge timestamp={timestamp} /> : null;

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)]">
      {/* Turn header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-muted)]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--text)]">Turn {turnNumber}</span>
          {turnTimestampBadge && <span className="border-l border-[var(--border)] pl-3">{turnTimestampBadge}</span>}
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
              <TranscriptRowStackItem key={getTurnItemKey(item, originalIndex)}>
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
              </TranscriptRowStackItem>
            );
          }

          if (item.type === 'tool_call') {
            return (
              <TranscriptRowStackItem key={getTurnItemKey(item, originalIndex)}>
                <ToolCall
                  tool={item.tool}
                  toolKind={item.toolKind}
                  agentId={item.agentId}
                  agentNickname={item.agentNickname}
                  agentRole={item.agentRole}
                  preview={item.preview}
                  summary={item.summary}
                  input={item.input}
                  output={item.output}
                  detailsAvailable={item.detailsAvailable}
                  detailsStatus={item.detailsStatus}
                  timestamp={item.timestamp}
                  status={item.status}
                />
              </TranscriptRowStackItem>
            );
          }

          if (item.type === 'subagent_notification') {
            return (
              <TranscriptRowStackItem key={getTurnItemKey(item, originalIndex)}>
                <SubagentNotification
                  agentId={item.agentId}
                  agentNickname={item.agentNickname}
                  agentRole={item.agentRole}
                  status={item.status}
                  summary={item.summary}
                  rawPayload={item.rawPayload}
                  showRawDebug={showRawDebug}
                  timestamp={item.timestamp}
                />
              </TranscriptRowStackItem>
            );
          }

          return (
            <TranscriptRowStackItem key={getTurnItemKey(item, originalIndex)}>
              <MessageCard
                role={item.role}
                content={item.content}
                timestamp={item.timestamp}
                renderMode={getAssistantRenderMode(item)}
                onToggleRender={getAssistantRenderToggle(item)}
              />
            </TranscriptRowStackItem>
          );
        })}
      </div>
    </div>
  );
}
