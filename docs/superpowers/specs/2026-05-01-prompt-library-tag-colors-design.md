# Prompt Library Tag Colors Design

Date: 2026-05-01

## Purpose

Add vivid, theme-aware color to Prompt Library tags and tag filters without making the prompt cards visually noisy. The top filter row should feel colorful and active when filters are selected. Tags on prompt cards, search results, and detail views should stay compact and mostly neutral, with color used as a small categorical indicator.

This work also expands the shared categorical palette so other artifacts can reuse the same colors.

## Non-Goals

- No database-backed or user-defined tag colors.
- No tag hashing algorithm for the current curated tag set.
- No tests that pin curated prompt titles, wording, contexts, or exact tag assignments.
- No broad redesign of the Prompt Library layout.

Hashing remains a reasonable future option if tags become user-created or the static tag list grows enough that manual color assignment stops being practical.

## Palette

The shared artifact theme already has categorical tokens for blue, green, amber, violet, and red. Extend that token family with cyan, pink, and lime.

Token shape:

- `--category-blue` / `--category-blue-weak`
- `--category-green` / `--category-green-weak`
- `--category-amber` / `--category-amber-weak`
- `--category-violet` / `--category-violet-weak`
- `--category-red` / `--category-red-weak`
- `--category-cyan` / `--category-cyan-weak`
- `--category-pink` / `--category-pink-weak`
- `--category-lime` / `--category-lime-weak`

Light mode keeps weak colors pale and readable on white surfaces. Dark mode weak colors must read as visibly colored selected surfaces, matching the Example App Theme Colors behavior rather than disappearing into the dark background.

The dark semantic colors for `--danger` and `--info` should become more vivid because the current dark red and purple text can feel muted. Use brighter red/rose and purple values, then let `--category-red` and `--category-violet` inherit from those updated semantic tokens unless implementation shows a better reason to decouple them.

## Prompt Tag Mapping

The current curated Prompt Library tags get explicit color ids:

| Tag | Color |
| --- | --- |
| `review` | blue |
| `implementation` | green |
| `subagents` | violet |
| `risk` | red |
| `architecture` | cyan |

Amber, pink, and lime remain available for future tags.

Store the color id with each tag definition in `src/artifacts/prompt-library/prompts.ts`, for example as `color: PromptTagColorId`. This keeps ad hoc prompt edits simple while making tag rendering deterministic.

## UI Behavior

Top tag filters use the vivid selected state:

- Selected filters use the tag's weak background, colored border, and colored checkbox fill.
- In dark mode, selected filters should visibly light up as colored rectangles.
- Unselected filters stay mostly neutral so the full filter row does not become noisy before a user filters.
- Unselected checkbox boxes may use the tag color for the outline so the available palette remains discoverable.
- The label and count remain readable with normal text tokens; selected state is communicated by checkbox state, border/fill, and `aria` state, not color alone.

Prompt tags on cards, search results, and detail views use the Retool-style indicator treatment:

- Neutral chip background and border.
- Small solid dot in the tag color.
- Neutral label text.
- Highlighted search-matched tags may add a subtle colored border or tint, but should not become fully filled chips.

This split keeps filters expressive while preserving card scanability.

## Example App

Update the Example App palette previews so the expanded color wheel is visible in both light and dark mode.

The semantic Theme Colors panel should show the updated dark `Danger` and `Info` values. The categorical Message Colors panel should include cyan, pink, and lime in addition to the existing blue, green, amber, violet, and red.

## Components And Data Flow

`src/theme/artifact-theme.css` owns the shared color tokens.

`src/artifacts/example-app/App.tsx` reads those tokens through its existing swatch arrays and renders the expanded previews.

`src/artifacts/prompt-library/prompts.ts` owns the curated tag-to-color mapping.

`src/artifacts/prompt-library/index.tsx` resolves a prompt tag to CSS variable-backed classes or inline CSS variables. The rendering code should avoid duplicating color names across card tags, detail tags, search result tags, and filter checkboxes. A small helper that returns tag color CSS variables or class fragments is enough; do not add a large abstraction.

## Accessibility

- Filter checkboxes remain real checkbox controls.
- Selected state must be represented through checkbox state and visual structure, not color alone.
- Focus rings continue to use `--ring` and must remain visible over colored selected filters.
- Colored dots are decorative and should be `aria-hidden`.
- Text contrast needs to be checked in light and dark mode, especially dark red, dark purple, and dark cyan selected states.

## Testing

Do not add tests that pin the real curated tag titles or prompt content.

Focused tests are useful only for structural behavior, such as:

- `promptTags` entries include a valid color id.
- unknown color ids are rejected by a validation helper if one is added.
- search/filter tests continue using fixtures rather than the real curated prompt corpus.

Visual verification is required because the main risk is contrast and state readability. Verify the Prompt Library and Example App in light and dark mode after implementation.
