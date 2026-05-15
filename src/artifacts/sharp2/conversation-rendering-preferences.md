# Sharp2 Conversation Rendering Preferences

These notes capture local product/design preferences for the sharp2 conversation example. They are not shared primitive
policy, but future edits should preserve them unless the user explicitly changes direction.

- Prefer flat transcript groups over nested cards. Each turn should read as one header plus one contiguous row stack.
- Use role/category color primarily through the left row accent and primary label. Keep transcript row backgrounds neutral.
- Conversation category colors should use user green, assistant blue, subagent cyan/system, thinking amber, and ordinary
  tools violet. Per-agent identity color should not replace the subagent row/category color.
- Message role labels should be uppercase and color-matched to the left accent.
- Transcript rows should share one row-shell contract: left accent, summary inset, right action cluster, and expanded
  detail inset should not drift between row types.
- Tool calls should use structured `type: 'tool_call'` data only. Do not reintroduce raw `role: 'tool'` message rows.
- Subagent lifecycle activity should use subagent-specific `toolKind` values and `type: 'subagent_notification'` for
  machine-delivered results. Keep it on its own filter and category color, distinct from ordinary tool calls.
- Event rows should use compact descriptors with category plus pipe-separated sections, such as `SUBAGENT | Wait`.
- Reserve aligned action-section widths when a descriptor is followed by preview content, including subagent actions and
  ordinary tool names such as `TOOL | bash`, so previews start on a shared throughline with enough breathing room.
- Row preview pills should let the row layout own truncation width. In transcript event rows, previews fill the remaining
  summary space and truncate only when they reach the sibling right action cluster, with row gaps providing breathing room.
- Subagent identity should render as separate nickname and short-id tags, not a combined `nickname / id` label.
- Subagent identity tags may use deterministic per-agent color for recognition, while the row accent remains the row
  category color.
- Subagent identity tags should read like selected message-type filters: weak category fill, matching text, and no visible
  outline. Keep any border transparent only when needed to preserve stable geometry.
- Subagent identity tags may stay copyable in collapsed expandable headers when they are sibling controls beside the
  disclosure summary, not nested inside it.
- Hover titles on compact subagent identity copy tags should stay terse, such as `Copy nickname` and `Copy full agent ID`;
  keep full values in accessible labels and copy payloads rather than native tooltip text.
- Copyable subagent identity tags should reserve enough inline width for feedback text like `Copied`, then show that
  feedback while the tag uses the copy success/failure color state.
- Copyable subagent identity tags should reuse the shared `CopyButton` tag variant so copy-state behavior and spacing stay
  aligned with other transcript copy controls.
- Per-agent identity colors should avoid success/error/warning-looking tones. Do not use green, red, lime, or amber for
  identity tags by default.
- UUID-like subagent IDs should display a short stable suffix from the hyphen-stripped ID while copy actions preserve the
  full source ID.
- Inspectable machine-delivered rows should expand for full source/result details. Collapsed expandable summaries should
  show inert metadata only; copyable source metadata belongs in expanded details unless it is promoted to an explicit
  sibling row control such as a subagent identity tag.
- Tool rows should be summary-first and collapsed by default. The row itself should be the large click target for
  expansion, with timestamp, status, and chevron controls aligned in a sibling right action cluster.
- When an expandable row hover treatment spans the full row, clicking non-interactive row space should expand the row;
  use a real full-row disclosure button layer so sibling controls such as copy tags, timestamp buttons, and chevrons can
  keep their own click behavior.
- Tool row headers should show a one-line truncated command/input preview rather than a standalone tool-name tag.
- Collapsed tool rows should not include nested copy actions. Timestamp copy is allowed in the right action cluster
  because it is a sibling control, while Input/Output and relevant metadata copy controls belong in expanded details.
- Tool row headers, message rows, subagent rows, and expanded details should preserve shared transcript row geometry and
  horizontal rhythm.
- When a row family already has repeated controls in the same column, new controls should fit that visual grid instead of
  inventing a new rhythm. For example, if message rows end with a square icon button, expandable rows should render
  chevrons as the same square icon-button size with the same spacing so rightmost controls align vertically.
- Do not use a global Tool Details filter. Inspect details by expanding the specific tool row.
- Keep row action controls visually cohesive: compact neutral controls, borderless at rest when the row needs to stay
  quiet, and clearly visible hover/active/focus/copied/failed states.
- Message source copy actions should be icon-only, with copied/failed feedback shown by icon and tokenized state color.
- Timestamp actions may show the localized time as compact text, but should use the same control family as copy actions.
- Copy feedback should not duplicate status glyphs; if the icon changes to a check or error icon, visible text should
  stay plain, like `Copied` or `Failed`.
- Tool detail labels should stay compact and strong (`text-[10px]`, uppercase, semibold/bold, tracked), with icon-only
  square copy controls and specific accessible labels for input/output.
- The Raw/Rendered toggle should look like the same control family as the copy button and stay vertically centered.
- Put turn timestamps beside the turn label with a divider. Put message timestamps in the right action cluster,
  immediately before source copy, so the row action columns stay aligned.
- Treat fixture timestamps as UTC source values. Display them as localized browser times without seconds, expose the
  full localized time on hover, and copy the raw UTC source timestamp.
- Preserve lowercase time units in durations such as `850ms`, `2.3s`, and `1m 04s`.
- Show Raw/Rendered controls only on assistant output rows.
- Dependent filter chips should be short and avoid duplicate counts. Use labels like `All`; let parent chips carry counts.
- Prefer disabled/greyed dependent filter chips over connector lines, bars, or other decorative linking.
- Use `Context Window` rather than `Token Counters` in the visible UI.
- Turn metadata badges should be neutral boxed badges, not quiet borderless tags.
- Show turn item counts as `n / m visible` so readers can tell when nothing is hidden.
- Use native `title` text for compact controls and metadata badges when the visible label is intentionally terse.
