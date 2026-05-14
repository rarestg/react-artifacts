import type { CSSProperties, ReactNode } from 'react';

type TranscriptRowStyle = CSSProperties & {
  '--transcript-row-accent': string;
};

type TranscriptRowSummarySlots = {
  accentColor: string;
  left: ReactNode;
  right?: ReactNode;
};

export type TranscriptRowProps = TranscriptRowSummarySlots & {
  children?: ReactNode;
};

export type ExpandableTranscriptRowProps = TranscriptRowSummarySlots & {
  expanded: boolean;
  controlsId: string;
  summaryAriaLabel: string;
  onToggle: () => void;
  children?: ReactNode;
};

function getTranscriptRowStyle(accentColor: string): TranscriptRowStyle {
  return {
    '--transcript-row-accent': accentColor,
  };
}

function TranscriptRowShell({ accentColor, children }: { accentColor: string; children: ReactNode }) {
  return (
    <div
      style={getTranscriptRowStyle(accentColor)}
      className="border-l-2 border-l-[color:var(--transcript-row-accent)] bg-[var(--surface)]"
    >
      {children}
    </div>
  );
}

function TranscriptRowSummary({ left, right }: Pick<TranscriptRowSummarySlots, 'left' | 'right'>) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">{left}</div>
      {right !== undefined && right !== null && <div className="flex shrink-0 items-center gap-1.5">{right}</div>}
    </div>
  );
}

export function TranscriptRow({ accentColor, left, right, children }: TranscriptRowProps) {
  return (
    <TranscriptRowShell accentColor={accentColor}>
      <div className="p-3">
        <TranscriptRowSummary left={left} right={right} />
        {children && <div className="mt-2">{children}</div>}
      </div>
    </TranscriptRowShell>
  );
}

export function ExpandableTranscriptRow({
  accentColor,
  expanded,
  controlsId,
  summaryAriaLabel,
  onToggle,
  left,
  right,
  children,
}: ExpandableTranscriptRowProps) {
  return (
    <TranscriptRowShell accentColor={accentColor}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={controlsId}
        aria-label={summaryAriaLabel}
        onClick={onToggle}
        className="flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-[var(--surface-muted)] active:bg-[var(--surface-pressed)] motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]"
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">{left}</div>
        {right !== undefined && right !== null && <div className="flex shrink-0 items-center gap-1.5">{right}</div>}
      </button>

      {expanded && children && (
        <div id={controlsId} className="space-y-3 px-3 pb-3">
          {children}
        </div>
      )}
    </TranscriptRowShell>
  );
}
