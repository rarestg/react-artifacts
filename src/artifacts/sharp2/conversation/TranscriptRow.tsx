import { ChevronDown, ChevronRight } from 'lucide-react';
import { Children, type CSSProperties, type ReactNode } from 'react';

type TranscriptRowStyle = CSSProperties & {
  '--transcript-row-accent': string;
};

type TranscriptRowSummarySlots = {
  accentColor: string;
  left: ReactNode;
  right?: ReactNode;
};

type TranscriptRowBaseSlots = Omit<TranscriptRowSummarySlots, 'right'>;

export type TranscriptRowProps = TranscriptRowSummarySlots & {
  children?: ReactNode;
};

export type ExpandableTranscriptRowProps = TranscriptRowBaseSlots & {
  expanded: boolean;
  controlsId: string;
  summaryAriaLabel: string;
  summaryTitle?: string;
  onToggle: () => void;
  leftControls?: ReactNode;
  leftTrailing?: ReactNode;
  rightLeading?: ReactNode;
  rightTimestamp?: ReactNode;
  children?: ReactNode;
};

export type TranscriptRowActionClusterProps = {
  leading?: ReactNode;
  timestamp?: ReactNode;
  action?: ReactNode;
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

export function TranscriptRowActionCluster({ leading, timestamp, action }: TranscriptRowActionClusterProps) {
  return (
    <div className="grid grid-cols-[4.75rem_auto_1.5rem] items-center gap-1.5">
      <div className="flex min-w-0 justify-end">{leading}</div>
      <div className="flex justify-end">{timestamp}</div>
      <div className="flex justify-end">{action}</div>
    </div>
  );
}

function TranscriptRowDisclosureIndicator({ expanded }: { expanded: boolean }) {
  const Icon = expanded ? ChevronDown : ChevronRight;

  return (
    <span
      aria-hidden="true"
      className="inline-flex size-6 shrink-0 items-center justify-center border border-transparent bg-transparent text-[var(--text-subtle)]"
    >
      <Icon className="size-4" aria-hidden="true" />
    </span>
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
  summaryTitle,
  onToggle,
  left,
  leftControls,
  leftTrailing,
  rightLeading,
  rightTimestamp,
  children,
}: ExpandableTranscriptRowProps) {
  // Keep a single semantic disclosure control over the row. The chevron is inert,
  // while promoted sibling controls such as timestamps and identity tags stay separate.
  const hasSplitLeftControls = leftControls !== undefined || leftTrailing !== undefined;
  const hasControlledRegion = Children.toArray(children).length > 0;
  const right = (
    <TranscriptRowActionCluster
      leading={rightLeading}
      timestamp={rightTimestamp}
      action={<TranscriptRowDisclosureIndicator expanded={expanded} />}
    />
  );

  return (
    <TranscriptRowShell accentColor={accentColor}>
      <div className="relative flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 p-3 transition-colors hover:bg-[var(--surface-muted)] motion-reduce:transition-none">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={hasControlledRegion ? controlsId : undefined}
          aria-label={summaryAriaLabel}
          title={summaryTitle}
          onClick={onToggle}
          className="absolute inset-0 z-0 cursor-pointer bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--surface)]"
        />
        <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-1.5">
          <div
            className={
              hasSplitLeftControls ? 'flex shrink-0 items-center gap-1.5' : 'flex min-w-0 flex-1 items-center gap-1.5'
            }
          >
            {left}
          </div>
          {leftControls !== undefined && leftControls !== null && (
            <div className="pointer-events-none flex shrink-0 items-center gap-1.5">{leftControls}</div>
          )}
          {leftTrailing !== undefined && leftTrailing !== null && (
            <div className="flex min-w-0 flex-1 items-center gap-1.5">{leftTrailing}</div>
          )}
        </div>
        <div className="pointer-events-none relative z-10 flex shrink-0 items-center gap-1.5">{right}</div>
      </div>

      {hasControlledRegion && (
        <div id={controlsId} hidden={!expanded} className="space-y-3 px-3 pb-3">
          {expanded ? children : null}
        </div>
      )}
    </TranscriptRowShell>
  );
}
