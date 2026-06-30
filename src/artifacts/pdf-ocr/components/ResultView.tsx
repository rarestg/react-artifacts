import { Component, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../../../components/Button';
import { CopyButton } from '../../../components/CopyButton';
import {
  panelHeaderActionsClass,
  panelHeaderRowClass,
  panelHeaderTextClass,
  panelHeaderTitleClass,
} from '../../../components/panelHeaderClasses';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { mergeClassNames } from '../../../lib/classNames';
import type { Controller } from '../useController';
import { bandClass } from './primitives';

const TAB_OPTIONS = [
  { value: 'preview', label: 'Preview' },
  { value: 'source', label: 'Markdown source' },
] as const;

// Token-styled markdown elements (no typography plugin); raw HTML stays escaped (no rehype-raw).
const markdownClass = mergeClassNames(
  'max-w-none space-y-3 text-sm leading-relaxed text-[var(--text)] break-words',
  '[&_h1]:text-base [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:font-semibold',
  '[&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5',
  '[&_a]:text-[var(--accent-text)] [&_a]:underline',
  '[&_code]:font-mono [&_code]:text-xs [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-[var(--border)] [&_pre]:bg-[var(--surface-muted)] [&_pre]:p-3',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border-strong)] [&_blockquote]:pl-3 [&_blockquote]:text-[var(--text-muted)]',
  '[&_hr]:my-4 [&_hr]:border-[var(--border)]',
  '[&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[var(--border)] [&_th]:bg-[var(--surface-muted)] [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-[var(--border)] [&_td]:px-2 [&_td]:py-1 [&_table]:text-xs',
);

const preClass =
  'max-h-[28rem] overflow-auto whitespace-pre-wrap break-words border border-[var(--border)] bg-[var(--surface-muted)] p-3 font-mono text-xs leading-relaxed text-[var(--text)]';

/** Falls back to the literal markdown source if react-markdown throws while rendering. */
class MarkdownBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function ResultView({ vm }: { vm: Controller }) {
  const markdown = vm.state.markdown;
  const hasMarkdown = markdown.length > 0;

  return (
    <section className={mergeClassNames(bandClass, 'space-y-3 border-t border-[var(--border)]')}>
      <div className={mergeClassNames(panelHeaderRowClass, 'border-b-0 px-0 py-0')}>
        <div className={panelHeaderTextClass}>
          <span className={panelHeaderTitleClass}>Result</span>
        </div>
        <div className={panelHeaderActionsClass}>
          <CopyButton
            text={markdown}
            idleLabel="Copy"
            variant="headerAction"
            disabled={!hasMarkdown}
            ariaLabel="Copy markdown source"
          />
          <Button size="sm" onClick={vm.download} disabled={!hasMarkdown}>
            Download .md
          </Button>
        </div>
      </div>

      <SegmentedControl
        ariaLabel="Result view"
        value={vm.resultTab}
        onValueChange={vm.setResultTab}
        options={TAB_OPTIONS}
      />

      {hasMarkdown ? (
        vm.resultTab === 'preview' ? (
          <MarkdownBoundary key={markdown} fallback={<pre className={preClass}>{markdown}</pre>}>
            <div className={markdownClass}>
              <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
            </div>
          </MarkdownBoundary>
        ) : (
          <pre className={preClass}>{markdown}</pre>
        )
      ) : (
        <p className="border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-4 text-xs text-[var(--text-muted)]">
          No markdown produced yet — re-OCR the failed pages to build the document.
        </p>
      )}
    </section>
  );
}
