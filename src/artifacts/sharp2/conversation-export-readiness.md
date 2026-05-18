# Conversation Rendering Export Readiness

## Purpose and Status

The sharp2 conversation renderer is a reference implementation for transcript rendering. It is not a standalone package
yet. The current code proves row anatomy, filters, controls, copy behavior, timestamps, token telemetry, and expandable
details inside the sharp2 artifact boundary.

The export target is a pane-3 renderer for a local Codex conversation search and visualization product. Pane 1 chooses a
workspace, pane 2 chooses a session, and pane 3 renders one selected session transcript page with host-owned visibility,
paging, search state, expansion state, render modes, and details loading.

## Target Product Contract

Pane 3 targets `codexscope.product.v1`. It consumes product transcript/read APIs, not parser IR, raw JSONL, anchor-window
commands, source evidence tables, or parser-private records. Names such as `ParsedSessionFile`, `AnchorWindowEntry`,
`graph_events`, and `lineage_evidence` are explicit non-contracts for this renderer boundary.

The product APIs in scope are:

- `getTranscriptPage` for ordered summary rows in one selected session.
- `getTranscriptItemDetails` for large tool output, raw tool text, parsed JSON, parse errors, and raw debug payloads.
- `findTranscript` for matches inside the selected session transcript.
- `getSessionFamilyTimeline` for subagent timeline context.

Session-shaped workspace/session search belongs to pane 2 through `searchSessions`; it is not part of the pane-3
renderer contract.

Product responses carry `apiInfo`, `contractVersion`, `capabilities`, and typed `ProductError` envelopes. The local
temporary outline in `conversation/productTypes.ts` is type-only and should be replaced by generated `codexscope-model`
DTOs when those exist.

## Product DTO Fields

The page-level item DTO should include these fields or equivalent generated names:

- `apiInfo`, `contractVersion`, `capabilities`, and `header`.
- `transcriptItemId`, `jumpTargetId`, and `sessionId`.
- `category`, `role`, `visibility`, `defaultVisible`, and `forceVisibleReason`.
- `rolledBack`, `timestamp`, `textPreview`, `isTruncated`, and `detailsAvailable`.
- `tool` with `name`, `callId`, normalized status, `targetSessionIds`, and `argumentsPreview`.
- `agentEvent` with event type, status, nickname, role, target session, `provisional`, and `unresolved`.
- `rawDebugAvailable`, with raw debug material available only through explicit details/debug reads.

Ordering truth is the per-session append sequence returned by the product API. Timestamps are display and sort hints, not
ordering truth. Backend visibility is applied before paging; the product host may then apply local toggles to loaded
items, while search and jump targets may be force-visible.

## Current View Model Versus Product DTO

`ConversationTurnData` remains the presentational view model for sharp2. It groups already-adapted rows into turns and is
not the backend DTO. Product data should pass through an adapter that maps page-level `TranscriptItem[]` summaries into
the current rows, keys render state by `transcriptItemId`, and fetches full detail text through
`getTranscriptItemDetails`.

The adapter should require unique stable item IDs for product data. Existing fixture fallbacks remain deterministic only
for showcase data.

## Renderer API Direction

Low-level renderer API example:

```ts
<ConversationTurn
  turnNumber={pageNumber}
  timestamp={header.lastActivityAt}
  items={adaptTranscriptItems(page.items)}
  visibleTypes={localVisibility}
  detailVisibility={{ showIntermediateTokenCounters, showRawDebug }}
  renderModesByItemId={renderModesByItemId}
  onToggleRenderModeForItem={toggleRenderModeForItem}
/>
```

Batteries-included controller example:

```ts
<TranscriptPane
  page={transcriptPage}
  detailsCache={detailsCache}
  detailsStatusByItemId={detailsStatusByItemId}
  visibility={visibility}
  searchTargetItemId={targetItemId}
  onRequestPage={getTranscriptPage}
  onRequestDetails={getTranscriptItemDetails}
/>
```

The controller owns paging, search target handling, expansion state by item ID, detail cache/loading/error state, and
force-visible search matches. The current sharp2 branch intentionally does not implement that controller.

## Theming and Design Contract

The renderer depends on artifact theme tokens for surfaces, text, borders, focus rings, semantic status colors, category
colors, and shared component copy states. It must render under `ArtifactThemeRoot` or an equivalent product theme
boundary that provides the same token contract.

Rows keep the current anatomy: category/accent marker, primary label, preview, stable right-side status/timestamp/control
cluster, one disclosure control for expandable rows, and copy buttons only for available source text. Controls stay
square, focus-visible rings stay visible, category colors are paired with labels, and local timestamp display keeps raw
timestamp copy behavior.

Unknown product enum values must use runtime fallback labels instead of throwing. Raw payloads, parser diagnostics, and
source/debug material are opt-in details/debug content, not normal transcript expansion.

## Out of Scope for First Export

- Parser implementation, raw JSONL parsing, parser IR, and anchor-window commands.
- Raw debug UI by default.
- Media/image rendering unless an explicit product DTO is added.
- Family-tree visualization beyond `getSessionFamilyTimeline` context.
- Pane-2 session search shell.
- Virtualization.
- Streaming/follow mode beyond explicit paged reads.

## Extraction Steps

1. Replace temporary `productTypes.ts` with generated `codexscope-model` DTOs.
2. Add a product adapter from `TranscriptPageResponse` and `TranscriptItemDetailsResponse` into renderer rows.
3. Move host-owned state out of the artifact: filters, render modes, expansion, details cache, search target, and paging.
4. Package the renderer with its token dependencies and theme boundary contract documented.
5. Add integration tests against product DTO fixtures, including unknown categories/statuses and missing detail text.

## Test Checklist

- Public barrel exposes only the intended renderer API and temporary product contract types.
- Product types do not import React, renderer internals, parser IR, raw JSONL records, anchors, or evidence tables.
- Unknown tool kinds, statuses, categories, and roles render safe fallback labels.
- Summary rows do not require full input or output text on the initial page.
- Missing details show explicit unavailable, pending, loading, or on-demand states only when the view model says so.
- Final token counters are explicit for paged fragments.
- Render modes, expansion state, and details cache are keyed by stable product item IDs.
- Raw debug payloads are hidden by default and visible only when explicit debug/detail state enables them.
- Theme tokens are present under `ArtifactThemeRoot` or an equivalent product boundary.
