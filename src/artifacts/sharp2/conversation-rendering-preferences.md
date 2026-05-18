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
- Reserve aligned section widths only for closed vocabularies where comparison matters, such as subagent actions.
- Do not reserve width for arbitrary tool names. Ordinary tool descriptors may stay natural-width, such as `TOOL | bash`.
- Subagent identity should render as separate nickname and short-id tags, not a combined `nickname / id` label.
- Subagent identity tags may use deterministic per-agent color for recognition, while the row accent remains the row
  category color.
- Copyable subagent identity belongs only where interaction permits it: non-expandable notification rows and expanded
  tool details. Collapsed expandable tool rows should show inert identity tags.
- Tool rows should be summary-first and collapsed by default. The row itself should be the large click target for
  expansion, with the timestamp and chevron on the right.
- Tool row headers should show a one-line truncated command/input preview rather than a standalone tool-name tag.
- Collapsed tool rows should not include nested copy actions; keep copy controls inside expanded details, including
  Input/Output and relevant metadata.
- Tool row headers, message rows, subagent rows, and expanded details should preserve shared transcript row geometry and
  horizontal rhythm.
- Do not use a global Tool Details filter. Inspect details by expanding the specific tool row.
- Keep row action controls visually cohesive: compact neutral controls, borderless at rest when the row needs to stay
  quiet, and clearly visible hover/active/focus/copied/failed states.
- Message source copy actions should be icon-only, with copied/failed feedback shown by icon and tokenized state color.
- Timestamp actions may show the localized time as compact text, but should use the same control family as copy actions.
- Copy feedback should not duplicate status glyphs; if the icon changes to a check or error icon, visible text should
  stay plain, like `Copied` or `Failed`.
- Tool detail labels should stay compact and strong (`text-[10px]`, uppercase, semibold/bold, tracked), with short
  visible `Copy` labels and specific accessible labels for input/output.
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
