#!/usr/bin/env python3
"""Append a raw-markdown entry to UI_IMPLEMENTATION_NOTES.md and refresh index line ranges.

Usage:
  python3 design/update_ui_implementation_notes.py \
    --entry-md /path/to/entry.md \
    --title "Preference vs. Visible State" \
    --when-read "Use when constraints force a different visible mode than the saved preference." \
    --keywords "responsive state, aria-pressed, persisted settings, derived mode"

Notes:
- entry.md should contain the entry body only (no top-level "##" heading).
- Markdown formatting (including code blocks/indentation) is preserved as-is.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import List, Tuple, Dict

ENTRY_HEADING_RE = re.compile(r"^## (\d{3}) — ")


def _next_entry_id(lines: List[str]) -> int:
    ids = []
    for line in lines:
        match = ENTRY_HEADING_RE.match(line)
        if match:
            ids.append(int(match.group(1)))
    return (max(ids) + 1) if ids else 1


def _find_index_table(lines: List[str]) -> Tuple[int, int]:
    start = None
    for i, line in enumerate(lines):
        if line.strip().startswith("| ID | Title |"):
            start = i
            break
    if start is None:
        raise RuntimeError("Index table header not found.")
    end = start
    while end < len(lines) and lines[end].strip().startswith("|"):
        end += 1
    return start, end  # end is exclusive


def _parse_index_rows(lines: List[str], start: int, end: int) -> Tuple[List[int], List[str]]:
    row_indices: List[int] = []
    ids: List[str] = []
    for i in range(start + 2, end):
        line = lines[i].strip()
        if not line.startswith("|"):
            continue
        parts = [part.strip() for part in line.strip("|").split("|")]
        if not parts:
            continue
        entry_id = parts[0]
        if not re.fullmatch(r"\d{3}", entry_id):
            continue
        row_indices.append(i)
        ids.append(entry_id)
    return row_indices, ids


def _build_entry_block(entry_id: int, title: str, body_md: str) -> List[str]:
    lines: List[str] = []
    lines.append(f"## {entry_id:03d} — {title}")
    lines.append("")
    body = body_md.strip("\n")
    if body:
        lines.extend(body.splitlines())
    return lines


def _compute_entry_ranges(lines: List[str]) -> Dict[str, Tuple[int, int]]:
    entries: List[Tuple[str, int]] = []
    for i, line in enumerate(lines, start=1):
        match = ENTRY_HEADING_RE.match(line)
        if match:
            entries.append((match.group(1), i))
    ranges: Dict[str, Tuple[int, int]] = {}
    for idx, (entry_id, start) in enumerate(entries):
        next_start = entries[idx + 1][1] if idx + 1 < len(entries) else len(lines) + 1
        end = next_start - 1
        ranges[entry_id] = (start, end)
    return ranges


def _update_index_lines(lines: List[str], start: int, end: int, ranges: Dict[str, Tuple[int, int]]) -> List[str]:
    updated = lines[:]
    for i in range(start + 2, end):
        line = updated[i].strip()
        if not line.startswith("|"):
            continue
        parts = [part.strip() for part in line.strip("|").split("|")]
        if not parts:
            continue
        entry_id = parts[0]
        if entry_id not in ranges:
            continue
        start_line, end_line = ranges[entry_id]
        parts[-1] = f"{start_line}-{end_line}"
        updated[i] = "| " + " | ".join(parts) + " |"
    return updated


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", default="design/UI_IMPLEMENTATION_NOTES.md")
    parser.add_argument("--entry-md", required=True, help="Path to raw markdown entry body.")
    parser.add_argument("--title", required=True)
    parser.add_argument("--when-read", required=True)
    parser.add_argument("--keywords", required=True)
    args = parser.parse_args()

    path = Path(args.file)
    lines = path.read_text().splitlines()

    entry_path = Path(args.entry_md)
    body_md = entry_path.read_text()

    entry_id = _next_entry_id(lines)
    entry_block = _build_entry_block(entry_id, args.title, body_md)

    # Append entry at the end with a section separator.
    if lines and lines[-1].strip():
        lines.append("")
    lines.append("---")
    lines.append("")
    lines.extend(entry_block)

    # Insert index row.
    index_start, index_end = _find_index_table(lines)
    row_indices, _ = _parse_index_rows(lines, index_start, index_end)
    insert_at = (row_indices[-1] + 1) if row_indices else (index_start + 2)

    index_row = (
        f"| {entry_id:03d} | {args.title} | {args.when_read} | {args.keywords} | TBD |"
    )
    lines.insert(insert_at, index_row)

    # Recompute ranges and update index line numbers.
    ranges = _compute_entry_ranges(lines)
    index_start, index_end = _find_index_table(lines)
    lines = _update_index_lines(lines, index_start, index_end, ranges)

    path.write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
