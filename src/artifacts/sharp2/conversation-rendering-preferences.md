# Sharp2 Conversation Rendering Preferences

These notes capture local product/design preferences for the sharp2 conversation example. They are not shared primitive
policy, but future edits should preserve them unless the user explicitly changes direction.

- Prefer flat transcript groups over nested cards. Each turn should read as one header plus one contiguous row stack.
- Use role color primarily through the left row accent and role label. Keep message row backgrounds neutral.
- Conversation role colors should use user green, assistant blue, subagent cyan/system, thinking amber, and ordinary
  tools violet.
- Message role labels should be uppercase and color-matched to the left accent.
- Tool calls should use structured `type: 'tool_call'` data only. Do not reintroduce raw `role: 'tool'` message rows.
- Subagent lifecycle activity should use subagent-specific `toolKind` values and `type: 'subagent_notification'` for
  machine-delivered results. Keep it on its own filter and category color, distinct from ordinary tool calls.
- Tool rows should be summary-first and collapsed by default. The row itself should be the large click target for
  expansion, with the timestamp and chevron on the right.
- Tool row headers should show a one-line truncated command/input preview rather than a standalone tool-name tag.
- Collapsed tool rows should not include copy actions; keep copy controls inside expanded Input/Output details.
- Tool row headers and expanded Input/Output details should share the same horizontal inset.
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
