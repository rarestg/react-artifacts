import { CopyButton } from '../../../components/CopyButton';
import { mergeClassNames } from '../../../lib/classNames';
import { getDefaultRenderMode, RenderErrorBoundary, renderInlineMarkdown, splitMessageContent } from './markdown';
import { TimestampBadge } from './TimestampBadge';
import { TranscriptRow, TranscriptRowActionCluster } from './TranscriptRow';
import type { MessageRole, RenderMode } from './types';

const headerActionClasses =
  'h-6 place-items-center border border-transparent bg-transparent px-1.5 py-0 text-[10px] font-semibold uppercase leading-none text-[var(--text-subtle)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] active:bg-[var(--surface-pressed)] motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]';
const renderToggleSlotClasses = 'w-[4.75rem]';

export type MessageCardProps = {
  role: MessageRole;
  content: string;
  timestamp?: string;
  renderMode?: RenderMode;
  onToggleRender?: () => void;
};

type MessageRoleConfigKey = MessageRole | 'unknown';

function isKnownMessageRole(role: unknown): role is MessageRole {
  return role === 'user' || role === 'assistant' || role === 'thinking';
}

export function MessageCard({ role, content, timestamp, renderMode = 'default', onToggleRender }: MessageCardProps) {
  // Keep message row surfaces neutral; role color belongs in the left accent only.
  const roleConfig: Record<MessageRoleConfigKey, { label: string; accentColor: string; labelColor: string }> = {
    user: {
      label: 'User',
      accentColor: 'var(--category-green)',
      labelColor: 'text-[var(--category-green)]',
    },
    assistant: {
      label: 'Assistant',
      accentColor: 'var(--category-blue)',
      labelColor: 'text-[var(--category-blue)]',
    },
    thinking: {
      label: 'Thinking',
      accentColor: 'var(--category-amber)',
      labelColor: 'text-[var(--category-amber)]',
    },
    unknown: {
      label: 'Unknown',
      accentColor: 'var(--border-strong)',
      labelColor: 'text-[var(--text-muted)]',
    },
  };

  const normalizedRole = isKnownMessageRole(role) ? role : 'unknown';
  const config = roleConfig[normalizedRole];
  const defaultRenderMode = normalizedRole === 'unknown' ? 'literal' : getDefaultRenderMode(normalizedRole);
  const effectiveRenderMode = normalizedRole === 'assistant' ? renderMode : 'default';
  const isLiteral =
    effectiveRenderMode === 'literal' || (effectiveRenderMode === 'default' && defaultRenderMode === 'literal');
  const canToggleRender = normalizedRole === 'assistant' && onToggleRender;
  const renderToggleLabel = isLiteral ? 'Raw' : 'Rendered';
  const renderToggleTitle = isLiteral ? 'Show rendered Markdown output' : 'Show raw message source';

  return (
    <TranscriptRow
      accentColor={config.accentColor}
      left={
        <span className={mergeClassNames('text-xs font-semibold uppercase', config.labelColor)}>{config.label}</span>
      }
      right={
        <TranscriptRowActionCluster
          leading={
            canToggleRender ? (
              <button
                type="button"
                aria-label="Rendered Markdown output"
                aria-pressed={!isLiteral}
                title={renderToggleTitle}
                onClick={canToggleRender}
                className={mergeClassNames('inline-grid cursor-pointer', renderToggleSlotClasses, headerActionClasses)}
              >
                <span className="col-start-1 row-start-1 invisible" aria-hidden="true">
                  Rendered
                </span>
                <span className="col-start-1 row-start-1">{renderToggleLabel}</span>
              </button>
            ) : null
          }
          timestamp={<TimestampBadge timestamp={timestamp} />}
          action={<CopyButton text={content} idleLabel="" ariaLabel="Copy message source" variant="icon" />}
        />
      }
    >
      <div>
        {isLiteral ? (
          // Literal rendering (pre-wrap, monospace, exact text)
          <pre className="font-mono text-sm text-[var(--text)] whitespace-pre-wrap break-words leading-relaxed">
            {content}
          </pre>
        ) : (
          // "Rendered" markdown — wrapped in error boundary; falls back to literal on failure
          <RenderErrorBoundary
            fallback={
              <pre className="font-mono text-sm text-[var(--text)] whitespace-pre-wrap break-words leading-relaxed">
                {content}
              </pre>
            }
          >
            <div className="font-mono text-sm text-[var(--text)] space-y-2 leading-relaxed">
              {splitMessageContent(content).map((part) => {
                const partKey = `${part.type}-${part.start}`;

                if (part.type === 'code') {
                  return (
                    <div key={partKey} className="border border-[var(--border)] bg-[var(--surface-muted)]">
                      {part.lang && (
                        <div className="px-2 py-1 border-b border-[var(--border)] bg-[var(--surface-strong)]">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-subtle)]">
                            {part.lang}
                          </span>
                        </div>
                      )}
                      <pre className="p-2 text-sm overflow-x-auto">{part.content}</pre>
                    </div>
                  );
                }

                // Process text content (split by paragraphs)
                const paragraphs = part.content.split('\n\n').filter((p) => p.trim());
                let paragraphCursor = 0;

                return paragraphs.map((paragraph) => {
                  const paragraphIndex = part.content.indexOf(paragraph, paragraphCursor);
                  const paragraphStart = paragraphIndex === -1 ? paragraphCursor : paragraphIndex;
                  paragraphCursor = paragraphStart + paragraph.length + 2;
                  const paragraphKey = `p-${part.start + paragraphStart}`;

                  if (paragraph.startsWith('# ')) {
                    return (
                      <div
                        key={paragraphKey}
                        className="font-semibold text-[var(--text)] border-b border-[var(--border)] pb-1"
                      >
                        {renderInlineMarkdown(paragraph.slice(2), `${paragraphKey}-h1`)}
                      </div>
                    );
                  }
                  if (paragraph.startsWith('## ')) {
                    return (
                      <div key={paragraphKey} className="font-semibold text-[var(--text)]">
                        {renderInlineMarkdown(paragraph.slice(3), `${paragraphKey}-h2`)}
                      </div>
                    );
                  }
                  if (paragraph.startsWith('- ') || paragraph.includes('\n- ')) {
                    const lines = paragraph.split('\n').filter((l) => l.trim());
                    let lineCursor = 0;

                    return (
                      <div key={paragraphKey} className="pl-3">
                        {lines.map((line) => {
                          const lineIndex = paragraph.indexOf(line, lineCursor);
                          const lineStart = lineIndex === -1 ? lineCursor : lineIndex;
                          lineCursor = lineStart + line.length + 1;
                          const lineKey = `li-${part.start + paragraphStart + lineStart}`;
                          const lineText = line.replace(/^- /, '');

                          return (
                            <div key={lineKey} className="flex gap-2">
                              <span className="text-[var(--text-subtle)]">•</span>
                              <span>{renderInlineMarkdown(lineText, `${lineKey}-inline`)}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return <p key={paragraphKey}>{renderInlineMarkdown(paragraph, `${paragraphKey}-p`)}</p>;
                });
              })}
            </div>
          </RenderErrorBoundary>
        )}
      </div>
    </TranscriptRow>
  );
}
