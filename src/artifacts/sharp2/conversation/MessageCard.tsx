import { CopyButton } from '../../../components/CopyButton';
import { mergeClassNames } from '../../../lib/classNames';
import { getDefaultRenderMode, RenderErrorBoundary, renderInlineMarkdown, splitMessageContent } from './markdown';
import type { MessageRole, RenderMode } from './types';

export type MessageCardProps = {
  role: MessageRole;
  content: string;
  timestamp?: string;
  renderMode?: RenderMode;
  onToggleRender?: () => void;
};

export function MessageCard({ role, content, timestamp, renderMode = 'default', onToggleRender }: MessageCardProps) {
  // Role configuration
  const roleConfig: Record<
    MessageRole,
    { label: string; borderColor: string; bgColor: string; alwaysLiteral?: boolean }
  > = {
    user: {
      label: 'User',
      borderColor: 'border-l-[var(--category-blue)]',
      bgColor: 'bg-[var(--surface)]',
    },
    assistant: {
      label: 'Assistant',
      borderColor: 'border-l-[var(--category-green)]',
      bgColor: 'bg-[var(--surface)]',
    },
    thinking: {
      label: 'Thinking',
      borderColor: 'border-l-[var(--category-amber)]',
      bgColor: 'bg-[var(--category-amber-weak)]',
    },
    tool: {
      label: 'Tool Output',
      borderColor: 'border-l-[var(--category-violet)]',
      bgColor: 'bg-[var(--category-violet-weak)]',
      alwaysLiteral: true,
    },
  };

  const config = roleConfig[role] || roleConfig.assistant;
  const isLiteral =
    config.alwaysLiteral ||
    renderMode === 'literal' ||
    (renderMode === 'default' && getDefaultRenderMode(role) === 'literal');

  return (
    <div className={mergeClassNames('border border-[var(--border)] border-l-2', config.borderColor, config.bgColor)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[color:var(--border)] bg-[var(--surface-muted)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text)]">{config.label}</span>
          {timestamp && <span className="text-[10px] text-[var(--text-subtle)] tabular-nums">{timestamp}</span>}
        </div>
        <div className="flex items-center gap-1">
          {/* Render mode toggle (not for tool/meta) */}
          {!config.alwaysLiteral && onToggleRender && (
            <button
              type="button"
              onClick={onToggleRender}
              className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)] active:bg-[var(--surface-pressed)] cursor-pointer transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]"
            >
              {isLiteral ? 'Raw' : 'Rendered'}
            </button>
          )}
          <CopyButton text={content} className="border-0 bg-transparent hover:bg-[var(--surface-strong)] px-1.5" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
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
    </div>
  );
}
