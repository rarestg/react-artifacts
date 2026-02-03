export type ResizeRect = {
  top: number;
  bottom: number;
  height: number;
};

export type ResizePlanInput = {
  windowInnerHeight: number;
  elementRect: ResizeRect;
  panelRect: ResizeRect | null;
  gridRect: ResizeRect | null;
  contentRect: ResizeRect | null;
  panelContentRect: ResizeRect | null;
  panelContentIsLast: boolean;
  minHeight: number;
};

export type ResizePlan = {
  viewportSlackBase: number;
  viewportSlack: number;
  gridSlack: number;
  panelSlack: number;
  internalSlack: number;
  slack: number;
  safeSlack: number;
  currentHeight: number;
  nextHeight: number;
  shouldExpand: boolean;
};

export const toResizeRect = (rect: DOMRect): ResizeRect => ({
  top: rect.top,
  bottom: rect.bottom,
  height: rect.height,
});

export const computeResizePlan = ({
  windowInnerHeight,
  elementRect,
  panelRect,
  gridRect,
  contentRect,
  panelContentRect,
  panelContentIsLast,
  minHeight,
}: ResizePlanInput): ResizePlan => {
  const viewportSlackBase = contentRect?.bottom ?? gridRect?.bottom ?? panelRect?.bottom ?? elementRect.bottom;
  const viewportSlack = Math.max(0, windowInnerHeight - viewportSlackBase);
  const gridSlack = panelRect && gridRect ? Math.max(0, gridRect.bottom - panelRect.bottom) : 0;
  const panelSlack =
    panelRect && panelContentRect && panelContentIsLast ? Math.max(0, panelRect.bottom - panelContentRect.bottom) : 0;
  const internalSlack = gridSlack + panelSlack;
  const slack = viewportSlack + internalSlack;
  const safeSlack = Math.max(0, Math.floor(slack) - 1);
  const currentHeight = elementRect.height;
  const nextHeight = Math.max(minHeight, Math.round(currentHeight + safeSlack));

  return {
    viewportSlackBase,
    viewportSlack,
    gridSlack,
    panelSlack,
    internalSlack,
    slack,
    safeSlack,
    currentHeight,
    nextHeight,
    shouldExpand: safeSlack > 0,
  };
};
