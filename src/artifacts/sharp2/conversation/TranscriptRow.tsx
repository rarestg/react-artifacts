import { ChevronDown, ChevronRight } from 'lucide-react';
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
  leftControls?: ReactNode;
  leftTrailing?: ReactNode;
  children?: ReactNode;
};

export type TranscriptRowActionClusterProps = {
  leading?: ReactNode;
  timestamp?: ReactNode;
  action?: ReactNode;
};

export type TranscriptRowDisclosureButtonProps = {
  expanded: boolean;
  controlsId: string;
  ariaLabel: string;
  onToggle: () => void;
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

function DisclosureSummaryButton({
  expanded,
  controlsId,
  summaryAriaLabel,
  onToggle,
  children,
  className = 'min-w-0 flex-1',
}: {
  expanded: boolean;
  controlsId: string;
  summaryAriaLabel: string;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controlsId}
      aria-label={summaryAriaLabel}
      onClick={onToggle}
      className={`${className} cursor-pointer text-left active:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5">{children}</div>
    </button>
  );
}

export function TranscriptRowActionCluster({ leading, timestamp, action }: TranscriptRowActionClusterProps) {
  return (
    <div className="grid grid-cols-[4.75rem_auto_1.5rem] items-center gap-1.5">
      <div className="flex min-w-0 justify-end">{leading}</div>
      <div className="flex justify-end">{timestamp}</div>
      <div className="flex justify-end">{action}</div>
    </div>
  );
}

export function TranscriptRowDisclosureButton({
  expanded,
  controlsId,
  ariaLabel,
  onToggle,
}: TranscriptRowDisclosureButtonProps) {
  const Icon = expanded ? ChevronDown : ChevronRight;

  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controlsId}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onToggle}
      className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center border border-transparent bg-transparent text-[var(--text-subtle)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] active:bg-[var(--surface-pressed)] motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
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
  leftControls,
  leftTrailing,
  right,
  children,
}: ExpandableTranscriptRowProps) {
  const hasSplitLeftControls = leftControls !== undefined || leftTrailing !== undefined;

  return (
    <TranscriptRowShell accentColor={accentColor}>
      <div className="relative flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 p-3 transition-colors hover:bg-[var(--surface-muted)] motion-reduce:transition-none">
        {hasSplitLeftControls ? (
          <>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={controlsId}
              aria-label={summaryAriaLabel}
              onClick={onToggle}
              className="absolute inset-0 z-0 cursor-pointer bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]"
            />
            <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-1.5">
              <div className="flex shrink-0 items-center gap-1.5">{left}</div>
              {leftControls !== undefined && leftControls !== null && (
                <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">{leftControls}</div>
              )}
              {leftTrailing !== undefined && leftTrailing !== null && (
                <div className="flex min-w-0 flex-1 items-center gap-1.5">{leftTrailing}</div>
              )}
            </div>
          </>
        ) : (
          <DisclosureSummaryButton
            expanded={expanded}
            controlsId={controlsId}
            summaryAriaLabel={summaryAriaLabel}
            onToggle={onToggle}
          >
            {left}
          </DisclosureSummaryButton>
        )}
        {right !== undefined && right !== null && (
          <div
            className={
              hasSplitLeftControls
                ? 'pointer-events-auto relative z-10 flex shrink-0 items-center gap-1.5'
                : 'flex shrink-0 items-center gap-1.5'
            }
          >
            {right}
          </div>
        )}
      </div>

      {expanded && children && (
        <div id={controlsId} className="space-y-3 px-3 pb-3">
          {children}
        </div>
      )}
    </TranscriptRowShell>
  );
}
