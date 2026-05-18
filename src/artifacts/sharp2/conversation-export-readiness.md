# Conversation Rendering Export Readiness

## Purpose

The sharp2 conversation renderer is a reference implementation for Codex transcript rendering. It proves row anatomy,
filters, copy behavior, timestamps, token telemetry, tool details, and subagent events inside the sharp2 artifact. It is
not a package yet.

The export target is pane 3 of CodexScope: pane 1 chooses a workspace, pane 2 chooses a session, and pane 3 renders one
selected session transcript page. The product host owns paging, search target handling, visibility, render modes,
expansion state, and detail cache/loading/error state. Follow/streaming ownership belongs to a later product mode.

## Boundary

Pane 3 consumes `codexscope.product.v1` read-model APIs, not parser IR, raw JSONL, anchor-window commands, evidence
tables, or parser-private record names. Terms such as `ParsedSessionFile`, `AnchorWindowEntry`, `graph_events`, and
`lineage_evidence` are explicit non-contracts for this renderer boundary.

The renderer should receive normalized product rows. Upstream parser/read-model code owns JSONL parsing, session metadata
resolution, tool-call/output pairing, subagent lineage resolution, evidence grouping, and turn repair. Conflicting or
unresolved source metadata belongs in detail/debug evidence, not renderer logic.

Product responses should carry `apiInfo`, `contractVersion`, `capabilities`, and typed `ProductError` envelopes. The
temporary `conversation/productTypes.ts` outline is type-only and should be replaced by generated `codexscope-model` DTOs
when they exist.

## Product APIs

- `getTranscriptPage`: ordered summary rows for one selected session.
- `getTranscriptItemDetails`: full message/tool text, parsed tool JSON, parse errors, raw payloads, and debug evidence.
- `findTranscript`: matches inside the selected session transcript.
- `getSessionFamilyTimeline`: root/child subagent context for the selected session family.

Workspace/session search belongs to pane 2 through `searchSessions`; it is not part of the pane-3 renderer contract.
Transcript find is content-focused; metadata should be exposed as structured filters/facets rather than default free-text
matches.

Ordering truth is the per-session append sequence returned by the product API. Timestamps are display and sort hints, not
ordering truth. Backend visibility is applied before paging; the host may then apply local toggles to loaded items, while
search and jump targets may be force-visible.

## Session Family Semantics

A Codex run with subagents is a family of sessions, not one flat chat. The root session has its own transcript. Each child
subagent has its own transcript. Parent rows record orchestration: spawn, wait, send input, resume, close, and received
notifications. Child transcripts record what the child saw and answered.

Pane 3 renders one selected session transcript. Family context comes from `getSessionFamilyTimeline`; do not flatten
child transcript messages into the parent timeline. A follow-up to a subagent is parent-side orchestration plus a child
turn, not a new human user message in the parent transcript.

Subagent completions can arrive through a wait result, a standalone notification, or both. The product timeline should
group duplicate raw deliveries with stable event IDs, `groupedWithEventIds`, and `evidenceIds`; the renderer should
display the normalized logical event. Resume/interrupted flows may produce provisional or unresolved nodes and later
notifications, so DTOs need explicit `provisional` and `unresolved` states.

Family timeline nodes should carry `sessionId`, `parentSessionId`, `depth`, nickname/role, source path, workspace/repo
identity, fork/source metadata, `provisional`, and `unresolved`. Timeline events should carry event IDs, jump targets,
target sessions, grouped event IDs, evidence IDs, raw-debug availability, status, and timestamp.

## DTO Requirements

Page-level items should include these fields or equivalent generated names:

- `transcriptItemId`, `jumpTargetId`, `sessionId`, and resolved session header metadata.
- `category`, `role`, `visibility`, `defaultVisible`, `forceVisibleReason`, and `rolledBack`.
- `timestamp`, `textPreview`, `isTruncated`, `detailsAvailable`, and `rawDebugAvailable`.
- `tool` with name, source `callId`, normalized status, target session IDs, and upstream `argumentsPreview`.
- `agentEvent` with event type, status, nickname, role, target session, `provisional`, and `unresolved`.

Headers should resolve `displayTitle` with a title source, treat workspace path as the conversation cwd, keep repo
identity separate from workspace, expose started/last-activity timestamps, and push conflicting later source metadata to
debug details.

Tool `callId` preserves source call/output identity but should not be used as renderer state identity. Raw arguments,
parsed JSON, parse errors, unpaired call/output evidence, and full input/output text belong in item details or debug
reads.

Visible unresolved, pending, or unknown tool relationship state should be normalized upstream through `tool.status` or an
explicit generated DTO field. Unknown product enum values must use runtime fallback labels. Product status enums are not
identical to current renderer view-model statuses; the adapter maps product statuses to renderer status/category while
preserving unknown fallback behavior.

`ConversationTurnData` is the current sharp2 presentation model, not the backend DTO. A product adapter should map
`TranscriptPageResponse.items` into renderer rows, group page items into renderer turns or equivalent transcript groups,
key render/expansion/detail state by `transcriptItemId`, and fetch full details through `getTranscriptItemDetails`.
Product pages may contain one or more adapted turn groups.

Current fixtures may embed full `input`, `output`, or `rawPayload` so the showcase can demonstrate expansion without a
backend. Product summary pages should prefer previews, `detailsAvailable`, and detail status; full source/debug material
should come from explicit details/debug reads.

Product paging/opening modes are part of contract behavior: `beginning`, `around`, `latest`, `page_before`,
`page_after`, opaque cursors, and summary-page text/byte limits should be handled by the product API and host. The first
export is paged only; host-owned follow/streaming state may be added later but is out of scope for this pass.

## Renderer API Direction

Low-level renderer:

```tsx
<ConversationTurn
  turnNumber={turn.turnNumber}
  timestamp={turn.timestamp ?? header.lastActivityAt}
  items={adaptTranscriptItems(turn.items)}
  visibleTypes={localVisibility}
  detailVisibility={{ showIntermediateTokenCounters, showRawDebug }}
  renderModesByItemId={renderModesByItemId}
  onToggleRenderModeForItem={toggleRenderModeForItem}
/>
```

Product controller:

```tsx
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

The current sharp2 artifact intentionally implements the renderer pieces, not the full product controller.

Current sharp2 rows own expansion internally for showcase purposes. Product export should make expansion/detail state
host-owned and keyed by stable item IDs.

## Theme And UI Contract

The renderer depends on artifact theme tokens for surfaces, text, borders, focus rings, semantic status colors, category
colors, and shared copy states. It must render under `ArtifactThemeRoot` or an equivalent product theme boundary.

Detailed row anatomy, copy behavior, disclosure, timestamp, and metadata rules live in
`conversation-rendering-preferences.md`. Raw payloads, parser diagnostics, and source/debug material are opt-in
detail/debug content, not normal transcript expansion.

## Out Of Scope For First Export

- Parser implementation, raw JSONL parsing, parser IR, evidence tables, and anchor-window commands.
- Raw debug UI by default.
- Media/image rendering unless explicit attachment DTOs are added.
- Full family-tree visualization beyond `getSessionFamilyTimeline` context.
- Pane-2 workspace/session search.
- Virtualization.
- Streaming/follow mode; the first export supports explicit paged reads only.

## Extraction Checklist

- Replace temporary `productTypes.ts` with generated `codexscope-model` DTOs.
- Add a product adapter from transcript page/details responses into renderer rows.
- Move host-owned filters, render modes, expansion, details cache, search target, and paging out of the artifact.
- Package the renderer with its token dependencies and theme boundary documented.
- Add integration fixtures for unknown enums, missing detail text, large tool output, partial family links, standalone
  notifications, duplicate wait/notification completion grouping, and unresolved/provisional subagent states.

## Test Checklist

- Public barrel exposes only the intended renderer API and temporary product contract types.
- Product types do not import React, renderer internals, parser IR, raw JSONL records, anchors, or evidence tables.
- Unknown tool kinds, statuses, categories, and roles render safe fallback labels.
- Summary rows do not require full input/output text on the initial page.
- Missing details show explicit unavailable, pending, loading, or on-demand states only when the view model says so.
- Final token counters are explicit for paged fragments.
- Render modes, expansion state, and details cache are keyed by stable product item IDs.
- Raw debug payloads are hidden by default and visible only when explicit debug/detail state enables them.
- Theme tokens are present under `ArtifactThemeRoot` or an equivalent product boundary.
