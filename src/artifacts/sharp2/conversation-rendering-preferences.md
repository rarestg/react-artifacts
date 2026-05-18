# Sharp2 Conversation Rendering Preferences

Current product/design contract for the sharp2 conversation renderer. This is sharp2-local guidance, not shared primitive
policy, but export work should preserve these rules unless product requirements deliberately change.

## Scope

- Render normalized conversation rows. React may derive simple display fallbacks from normalized text, but should not
  decode raw JSONL, raw tool JSON, or parser IR to infer semantics.
- Keep source text copyable. User/tool/raw output copies the source string; rendered assistant output copies the original
  assistant source, not the visual Markdown rendering.

## Transcript Anatomy

- A turn is one compact header plus one contiguous transcript row stack. Avoid nested message/tool/token cards.
- All transcript rows share one shell: left category accent, summary inset, stable right action cluster, and aligned
  expanded-detail inset.
- Category color lives on the row accent and primary label. Keep row backgrounds neutral. Use user green, assistant blue,
  thinking amber, ordinary tool violet, and subagent cyan/system.
- Role and event labels are uppercase. Event descriptors use compact pipe sections such as `TOOL | bash` and
  `SUBAGENT | Wait`; reserve action-section width so previews start on a shared line.
- Preview pills should contain semantic text and let layout own truncation. Do not pre-truncate fixture/product strings
  to satisfy one viewport.
- Expandable rows use one semantic disclosure target over the full row. The chevron is visual; sibling timestamp/copy/tag
  controls remain separate controls.

## Row Semantics

- Message rows show user content literally by default. Assistant rows may toggle Raw/Rendered; thinking rows render with
  the default Markdown mode but do not show the toggle.
- Tool rows use structured `type: 'tool_call'` data only. They are summary-first, collapsed by default, and expand per row
  for input/output or on-demand detail states. Do not add a global Tool Details filter.
- Subagent activity uses subagent-specific `toolKind` values for parent orchestration and `type: 'subagent_notification'`
  for machine-delivered child results. Keep subagents on the `Subagents` filter and out of ordinary tool-call styling.
- Subagent previews describe orchestration or submitted prompts, such as `Completed within 10m` or a follow-up
  instruction. They should not repeat low-value strings like `spawn_agent > Ada`.
- Subagent identity renders as separate nickname and short-id tags. Tags may use deterministic per-agent colors for
  recognition, but row accent remains the subagent category color. Avoid green, red, lime, or amber identity tones.
- UUID-like subagent IDs display a short stable suffix from the hyphen-stripped ID; copy actions preserve the full ID.
- Machine-delivered rows expand for result/raw details. Raw payloads are debug/detail content, hidden unless explicitly
  enabled.
- Token telemetry is labeled `Context Window`. When those rows are visible, show the final end-of-turn counter by default;
  intermediate counters are a diagnostic detail mode. Use total token usage over model context window, preserve
  `cached_input_tokens: 0` as data, and keep last-usage/rate-limit fields out of the default row.

## Controls And Metadata

- Reuse shared `CopyButton` variants for icon, timestamp, header text, and tag copy controls. Keep copied/failed feedback
  stable in width and tokenized by state.
- Collapsed rows should not contain nested source-copy actions. Timestamp copy and promoted identity tags are allowed as
  sibling controls; input/output/raw copy controls belong in expanded details.
- Timestamp controls display localized time without seconds, expose the full localized time on hover, and copy the raw UTC
  source timestamp.
- Keep row action controls visually cohesive: compact neutral controls, quiet at rest, with visible hover, active,
  focus-visible, copied, and failed states.
- Successful tool calls and completed notifications stay quiet; pending, running, error, failed, timed-out, and unknown
  states use compact status badges.
- Detail labels stay compact and strong: `text-[10px]`, uppercase, semibold/bold, tracked, with icon-only copy buttons and
  specific accessible labels.
- Dependent filter chips should be short and disabled when inactive. Prefer labels like `All`; let parent chips carry
  counts.
- Turn metadata badges are neutral boxed badges. Show item counts as `n / m visible`, and preserve lowercase duration
  units such as `850ms`, `2.3s`, and `1m 04s`.
