// Pure helpers for the prompt-grid hjkl navigation. Local to this artifact per the
// README UI Decision Ladder: Base UI exposes no public roving-focus primitive.

/**
 * Count the columns in a resolved `grid-template-columns` value ("340px 340px 340px").
 * Collapsed auto-fit tracks serialize as "0px" and hold no cards, so they do not
 * count. Layout-less DOMs (happy-dom) return the authored `repeat(auto-fit,
 * minmax(...))` string instead; anything that is not a plain list of track sizes
 * falls back to one column, degrading j/k to next/previous.
 */
export function countResolvedGridColumns(gridTemplateColumns: string): number {
  const tracks = gridTemplateColumns.trim().split(/\s+/);
  if (tracks.length === 0 || tracks[0] === '') return 1;
  if (!tracks.every((track) => /^\d+(\.\d+)?[a-z%]+$/i.test(track))) return 1;
  const columns = tracks.filter((track) => !/^0(\.0+)?[a-z%]+$/i.test(track)).length;
  return columns > 0 ? columns : 1;
}

/**
 * Next card index for a vim navigation key, or null for an edge no-op.
 * h/l move linearly across row boundaries; j/k move one visual row (columnCount
 * stride), with j clamping into a partial last row. With nothing focused
 * (currentIndex < 0) any navigation key lands on the first card.
 */
export function getNextCardIndex(
  key: string,
  currentIndex: number,
  cardCount: number,
  columnCount: number,
): number | null {
  if (key !== 'h' && key !== 'j' && key !== 'k' && key !== 'l') return null;
  if (cardCount <= 0) return null;
  if (currentIndex < 0) return 0;
  if (key === 'h') return currentIndex > 0 ? currentIndex - 1 : null;
  if (key === 'l') return currentIndex < cardCount - 1 ? currentIndex + 1 : null;
  if (key === 'k') {
    const next = currentIndex - columnCount;
    return next >= 0 ? next : null;
  }
  const next = Math.min(currentIndex + columnCount, cardCount - 1);
  return next === currentIndex ? null : next;
}
