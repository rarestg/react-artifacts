import { Component, Fragment, type ReactNode } from 'react';
import type { MessageRole } from './types';

export type MessageContentPart =
  | { type: 'text'; content: string; start: number; end: number }
  | { type: 'code'; lang: string; content: string; start: number; end: number };

export function splitMessageContent(content: string): MessageContentPart[] {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts: MessageContentPart[] = [];
  let lastIndex = 0;
  let match = codeBlockRegex.exec(content);

  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
        start: lastIndex,
        end: match.index,
      });
    }

    parts.push({
      type: 'code',
      lang: match[1],
      content: match[2],
      start: match.index,
      end: match.index + match[0].length,
    });

    lastIndex = match.index + match[0].length;
    match = codeBlockRegex.exec(content);
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex),
      start: lastIndex,
      end: content.length,
    });
  }

  return parts;
}

export function getDefaultRenderMode(role: MessageRole): 'literal' | 'rendered' {
  return role === 'user' || role === 'tool' ? 'literal' : 'rendered';
}

export function renderInlineMarkdown(text: string, keyBase: string): ReactNode[] {
  const tokenRegex = /`[^`]+`|\*\*[^*]+\*\*/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(tokenRegex)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      nodes.push(<Fragment key={`${keyBase}-t-${cursor}`}>{text.slice(cursor, start)}</Fragment>);
    }

    const token = match[0];
    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={`${keyBase}-c-${start}`}
          className="bg-[var(--surface-strong)] border border-[var(--border)] px-1 py-0.5 text-[13px] text-[var(--text)]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(
        <strong key={`${keyBase}-b-${start}`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    }

    cursor = start + token.length;
  }

  if (cursor < text.length || nodes.length === 0) {
    nodes.push(<Fragment key={`${keyBase}-t-${cursor}`}>{text.slice(cursor)}</Fragment>);
  }

  return nodes;
}

export class RenderErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
