# Sharp2 Conversation Rendering Preferences

These notes capture local product/design preferences for the sharp2 conversation example. They are not shared primitive
policy, but future edits should preserve them unless the user explicitly changes direction.

- Prefer flat transcript groups over nested cards. Each turn should read as one header plus one contiguous row stack.
- Use role color primarily through the left row accent and role label. Keep message row backgrounds neutral.
- Message role labels should be uppercase and color-matched to the left accent.
- Tool calls should use structured `type: 'tool_call'` data only. Do not reintroduce raw `role: 'tool'` message rows.
- Tool rows should be summary-first and collapsed by default. The row itself should be the large click target for
  expansion, with the timestamp and chevron on the right.
- Do not use a global Tool Details filter. Inspect details by expanding the specific tool row.
- Keep header actions visually cohesive: compact neutral boxed controls, visible hover/active/focus states, and no
  sudden border appearing only after click feedback.
- Header copy actions should be icon-only, with copied/failed feedback shown by icon and tokenized state color.
- The Raw/Rendered toggle should look like the same control family as the copy button and stay vertically centered.
- Put message timestamps on the right with header actions.
- Dependent filter chips should be short and avoid duplicate counts. Use labels like `All`; let parent chips carry counts.
- Prefer disabled/greyed dependent filter chips over connector lines, bars, or other decorative linking.
- Use `Context Usage` rather than `Token Counters` in the visible UI.
- Turn metadata badges should be neutral boxed badges, not quiet borderless tags.
- Show turn item counts as `n / m visible` so readers can tell when nothing is hidden.
- Use native `title` text for compact controls and metadata badges when the visible label is intentionally terse.
