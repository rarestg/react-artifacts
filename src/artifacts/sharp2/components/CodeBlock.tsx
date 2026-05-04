import { CopyButton } from '../../../components/CopyButton';

type CodeBlockProps = {
  children: string;
  language?: string;
};

export function CodeBlock({ children, language }: CodeBlockProps) {
  return (
    <div className="relative border border-[var(--border)] bg-[var(--surface-muted)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-subtle)]">{language}</span>
        <CopyButton text={children} className="border-0 bg-transparent px-1.5 hover:bg-[var(--surface-strong)]" />
      </div>
      <pre className="overflow-x-auto p-3 text-sm text-[var(--text)]">
        <code>{children}</code>
      </pre>
    </div>
  );
}
