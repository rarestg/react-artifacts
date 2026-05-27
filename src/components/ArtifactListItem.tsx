import { Layers, Square, SquareArrowOutUpRight } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

import type { ArtifactEntry } from '../artifacts';
import { mergeClassNames } from '../lib/classNames';

type ArtifactListItemArtifact = Pick<ArtifactEntry, 'id' | 'name' | 'subtitle' | 'kind' | 'model' | 'version'>;

type ArtifactListItemProps = {
  artifact: ArtifactListItemArtifact;
  selected: boolean;
  onSelect: (id: string) => void;
};

const getStandaloneUrl = (id: string) => {
  const base = import.meta.env?.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}artifact/${encodeURIComponent(id)}`;
};

type TooltipPosition = {
  left: number;
  top: number;
  placement: 'bottom' | 'top';
};

const TOOLTIP_OFFSET = 8;
const TOOLTIP_WIDTH = 256;
const TOOLTIP_MARGIN = 12;
const TOOLTIP_ESTIMATED_HEIGHT = 96;

export function ArtifactListItem({ artifact, selected, onSelect }: ArtifactListItemProps) {
  const subtitleRef = React.useRef<HTMLDivElement>(null);
  const tooltipId = React.useId();
  const [subtitleHovered, setSubtitleHovered] = React.useState(false);
  const [buttonFocused, setButtonFocused] = React.useState(false);
  const [tooltipPosition, setTooltipPosition] = React.useState<TooltipPosition | null>(null);
  const tooltipVisible = Boolean(artifact.subtitle && (subtitleHovered || buttonFocused));

  const updateTooltipPosition = React.useCallback(() => {
    const subtitleElement = subtitleRef.current;

    if (!subtitleElement || typeof window === 'undefined') {
      return;
    }

    const rect = subtitleElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const maxLeft = Math.max(TOOLTIP_MARGIN, viewportWidth - TOOLTIP_WIDTH - TOOLTIP_MARGIN);
    const left = Math.min(Math.max(rect.left, TOOLTIP_MARGIN), maxLeft);
    const spaceBelow = viewportHeight - rect.bottom - TOOLTIP_MARGIN;
    const spaceAbove = rect.top - TOOLTIP_MARGIN;
    const placement = spaceBelow < TOOLTIP_ESTIMATED_HEIGHT && spaceAbove > spaceBelow ? 'top' : 'bottom';

    setTooltipPosition({
      left,
      top: placement === 'top' ? rect.top - TOOLTIP_OFFSET : rect.bottom + TOOLTIP_OFFSET,
      placement,
    });
  }, []);

  const handleButtonFocus = React.useCallback(() => {
    updateTooltipPosition();
    setButtonFocused(true);
  }, [updateTooltipPosition]);

  const handleButtonBlur = React.useCallback(() => {
    setButtonFocused(false);
  }, []);

  const handleButtonMouseMove = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const hoveringSubtitle = Boolean(subtitleRef.current?.contains(event.target as Node));

      if (hoveringSubtitle) {
        updateTooltipPosition();
      }

      setSubtitleHovered(hoveringSubtitle);
    },
    [updateTooltipPosition],
  );

  const handleButtonMouseLeave = React.useCallback(() => {
    setSubtitleHovered(false);
  }, []);

  React.useEffect(() => {
    if (!tooltipVisible) {
      return;
    }

    updateTooltipPosition();
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition, true);

    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition, true);
    };
  }, [tooltipVisible, updateTooltipPosition]);

  const tooltip =
    artifact.subtitle && tooltipVisible && tooltipPosition && typeof document !== 'undefined'
      ? createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-50 w-64 border border-gray-200 bg-white px-2.5 py-2 text-xs leading-snug text-gray-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              transform: tooltipPosition.placement === 'top' ? 'translateY(-100%)' : undefined,
            }}
          >
            {artifact.subtitle}
          </div>,
          document.body,
        )
      : null;

  return React.createElement(
    'li',
    null,
    <div className="group relative text-sm">
      <button
        type="button"
        aria-label={`Select ${artifact.name}`}
        aria-describedby={tooltipVisible && artifact.subtitle ? tooltipId : undefined}
        onClick={() => onSelect(artifact.id)}
        onFocus={artifact.subtitle ? handleButtonFocus : undefined}
        onBlur={artifact.subtitle ? handleButtonBlur : undefined}
        onMouseMove={artifact.subtitle ? handleButtonMouseMove : undefined}
        onMouseLeave={artifact.subtitle ? handleButtonMouseLeave : undefined}
        className={mergeClassNames(
          'block w-full cursor-pointer px-3 pt-2 pr-12 pb-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
          selected
            ? 'bg-blue-100 font-medium text-blue-800 dark:bg-slate-800 dark:text-slate-100'
            : 'text-gray-700 group-hover:bg-gray-200 dark:text-slate-300 dark:group-hover:bg-slate-800',
        )}
      >
        <div className="flex items-center gap-2">
          {artifact.kind === 'app' ? (
            <Layers className="size-3.5 text-gray-500 dark:text-slate-400" aria-hidden="true" />
          ) : artifact.kind === 'single' ? (
            <Square className="size-3.5 text-gray-500 dark:text-slate-400" aria-hidden="true" />
          ) : null}
          <span className="truncate">{artifact.name}</span>
        </div>
        {artifact.subtitle && (
          <div ref={subtitleRef} className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-slate-400">
            {artifact.subtitle}
          </div>
        )}
        {(artifact.model || artifact.version) && (
          <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
            {artifact.model && (
              <span className="inline-flex items-center border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-gray-600 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {artifact.model}
              </span>
            )}
            {artifact.version && (
              <span className="inline-flex items-center border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-gray-600 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {artifact.version}
              </span>
            )}
          </div>
        )}
      </button>
      <a
        href={getStandaloneUrl(artifact.id)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${artifact.name} standalone`}
        title="Open standalone view"
        className={
          'absolute right-2 bottom-2 z-10 inline-flex size-7 cursor-pointer items-center justify-center border border-transparent text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-offset-slate-950'
        }
      >
        <SquareArrowOutUpRight className="size-3.5" aria-hidden="true" />
      </a>
      {tooltip}
    </div>,
  );
}
