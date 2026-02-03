# Humanized Count Formatting Plan (JSONL Structure Viewer)

## 1) Problem & Motivation
We want char/token counts to be easier to scan at a glance in the Input and Output subtitles. Today they are raw numbers (e.g., 884 chars, ~221 tokens). For large values this becomes noisy. The requirement is:
- < 1,000: show full number
- 1,000–9,999: show one decimal in “k” (e.g., 1.1k)
- 10,000–999,999: show whole “k” (e.g., 29k)
- >= 1,000,000: show one decimal “m” (e.g., 1.3m)

Success criteria:
- Input subtitle shows raw input counts with the new compact format.
- Output subtitle shows copy-output counts with the new compact format.
- Counts don’t change when switching Raw vs Highlighted view.
- Format is consistent and readable; no “1.0k” style trailing zeros.

## 2) System Context
Relevant files and patterns:
- `src/artifacts/jsonl-structure-viewer/index.tsx`
  - `formatStatsLine` builds the stats line for Input/Output subtitles.
  - `inputStats` uses raw input length and line count.
  - `outputStats` uses `outputForCopy` (copy payload).
  - `formatCount` currently handles singular/plural for items/lines.
- `src/artifacts/jsonl-structure-viewer/lib/ui.ts`
  - Shared header styling, not directly relevant for formatting.

The counts displayed are derived in `index.tsx` and displayed in the panel headers.

## 3) Implementation Plan (ordered)

### Step 1: Add a compact-number formatter
**Where**: new module `src/artifacts/jsonl-structure-viewer/lib/formatNumber.ts` (or add to an existing formatting util if preferred).

**What**:
- Implement `formatCompactNumber(value: number): string`:
  - `value < 1000` → return `${value}`
  - `value < 10_000` → return `${trimDecimal(value / 1000, 1)}k`
  - `value < 1_000_000` → return `${Math.round(value / 1000)}k`
  - else → return `${trimDecimal(value / 1_000_000, 1)}m`
- `trimDecimal` should remove trailing `.0` (e.g., `1.0k` → `1k`).
- Assume non-negative integers (counts). If negative values are possible, clarify behavior (see assumptions).

**Why**: Keep formatting logic centralized and reusable.

### Step 2: Update stats line formatting to use compact numbers
**Where**: `src/artifacts/jsonl-structure-viewer/index.tsx`

**What**:
- Import `formatCompactNumber`.
- Update `formatStatsLine` to use compact formatting for `characters` and `tokens`:
  - Example output: `"884 chars | ~221 tokens | 2 strings truncated"`
  - Example output (large): `"12.4k chars | ~3.1k tokens | 214 strings truncated"`
- Keep the truncated-string count **uncompacted** to preserve precision (decision; see below).
- Do **not** change `formatCount` or the item/line labels; these should stay precise.

**Why**: Chars/tokens are the high-volume counts where compact formatting helps most.

### Step 3: Confirm output stats stability
**Where**: `src/artifacts/jsonl-structure-viewer/index.tsx`

**What**:
- Ensure `outputStats` stays tied to `outputForCopy` only (already done) and no other code path reintroduces display-dependent stats.
- Make sure input stats still come from raw input length (already done).

**Why**: Avoid the prior “view mode changes counts” bug.

## 4) Key Decisions & Tradeoffs
- **Decision**: Compact format only for chars/tokens, not for items/lines or truncated count.
  - **Why**: Items/lines and truncation are actionable counts; precision matters more than compactness.
- **Decision**: One decimal only under 10k; otherwise whole k. Millions use one decimal (e.g., 1.3m).
  - **Why**: Balances readability and precision while matching the stated requirement.
- **Alternative**: Use `Intl.NumberFormat` compact notation. Rejected because it can be locale-dependent and inconsistent (e.g., “1K”, “1 thousand”).

## 5) Risks & Landmines
- **Trailing zeros**: Make sure `1.0k` becomes `1k` and `1.0m` becomes `1m`.
- **Rounding edge cases**: Values like `999,950` → `1,000k` should render as `1m` rather than `1000k`. Using the “m” branch for `>= 1,000,000` avoids this; ensure rounding doesn’t push 999,950 into the “m” branch unintentionally.
- **Negative values**: Not expected for counts; if they appear, formatting rules should be clarified.

## 6) Verification & Validation
Manual checks in the UI:
1) Input subtitle:
   - Small input → raw numbers (e.g., `842 chars | ~210 tokens`).
   - Large input → compact format (e.g., `12.4k chars | ~3.1k tokens`).
2) Output subtitle:
   - Confirm values match copy output (Raw/Highlighted toggles do not change stats).
   - Large output → compact format.
3) Edge cases:
   - `999` → `999`
   - `1,000` → `1k`
   - `9,950` → `10k` (rounded)
   - `10,000` → `10k`
   - `1,000,000` → `1m`

Rollback plan:
- Revert changes to `formatStatsLine` and remove the new formatter import if unexpected formatting shows up.

## 7) Open Questions / Follow-ups
- Should truncated count also be compacted for very large values, or remain raw permanently?
- Should we display line counts in Input subtitle too (currently only chars/tokens/truncated)?

Assumptions:
- Counts are non-negative integers.
- We only need this formatting for UI display, not for any exported/copy data.
