"""jot: a tiny command-line notes tool.

Notes live in one JSON file: $JOT_FILE, or ~/.jot/notes.json by default.

    jot add "buy milk" --tag home
    jot list [--tag TAG] [--all]
    jot search QUERY
    jot done ID
    jot rm ID
    jot export [--format json]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

__version__ = "0.3.1"


def notes_path() -> Path:
    """Where the notes file lives."""
    env = os.environ.get("JOT_FILE")
    if env:
        return Path(env)
    return Path.home() / ".jot" / "notes.json"


def load_notes(path: Path) -> list[dict]:
    """Read every note. A missing file means no notes yet."""
    if not path.exists():
        return []
    # utf-8-sig strips a UTF-8 BOM written by editors such as Notepad.
    # Empty and truncated files are still left to the caller (see the tracker).
    with open(path, encoding="utf-8-sig") as fh:
        return json.load(fh)


def save_notes(path: Path, notes: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as fh:
        json.dump(notes, fh, indent=2, ensure_ascii=False)


def next_id(notes: list[dict]) -> int:
    # Known limit: ids come from the count, so removing a note can make
    # the next note reuse an id that is still in use.
    return len(notes) + 1


def add_note(notes: list[dict], text: str, tags: list[str] | None = None) -> dict:
    note = {
        "id": next_id(notes),
        "text": text,
        "tags": sorted(set(tags or [])),
        "done": False,
        "created": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
    }
    notes.append(note)
    return note


def find_note(notes: list[dict], note_id: int) -> dict | None:
    for note in notes:
        if note["id"] == note_id:
            return note
    return None


def search_notes(notes: list[dict], query: str) -> list[dict]:
    # Plain substring match, case-sensitive.
    return [n for n in notes if query in n["text"]]


def filter_notes(notes: list[dict], tag: str | None = None, show_all: bool = False) -> list[dict]:
    out = []
    for note in notes:
        if note["done"] and not show_all:
            continue
        if tag and tag not in note["tags"]:
            continue
        out.append(note)
    return out


def format_note(note: dict) -> str:
    mark = "x" if note["done"] else " "
    tags = " ".join(f"#{t}" for t in note["tags"])
    line = f"[{mark}] {note['id']:>3}  {note['created']}  {note['text']}"
    return f"{line}  {tags}" if tags else line


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="jot", description="A tiny command-line notes tool.")
    parser.add_argument("--version", action="version", version=f"jot {__version__}")
    sub = parser.add_subparsers(dest="command", required=True)

    p_add = sub.add_parser("add", help="add a note")
    p_add.add_argument("text")
    p_add.add_argument("--tag", action="append", default=[], help="tag the note (repeatable)")

    p_list = sub.add_parser("list", help="list open notes")
    p_list.add_argument("--tag", help="only notes with this tag")
    p_list.add_argument("--all", action="store_true", help="include done notes")

    p_search = sub.add_parser("search", help="find notes containing text")
    p_search.add_argument("query")

    p_done = sub.add_parser("done", help="mark a note done")
    p_done.add_argument("id", type=int)

    p_rm = sub.add_parser("rm", help="delete a note")
    p_rm.add_argument("id", type=int)

    p_export = sub.add_parser("export", help="print all notes")
    p_export.add_argument("--format", choices=["json"], default="json")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    path = notes_path()
    notes = load_notes(path)

    if args.command == "add":
        note = add_note(notes, args.text, args.tag)
        save_notes(path, notes)
        print(f"added {note['id']}")
    elif args.command == "list":
        for note in filter_notes(notes, args.tag, args.all):
            print(format_note(note))
    elif args.command == "search":
        for note in search_notes(notes, args.query):
            print(format_note(note))
    elif args.command in ("done", "rm"):
        note = find_note(notes, args.id)
        if note is None:
            print(f"no note {args.id}", file=sys.stderr)
            return 1
        if args.command == "done":
            note["done"] = True
        else:
            notes.remove(note)
        save_notes(path, notes)
        print(f"{args.command} {args.id}")
    elif args.command == "export":
        json.dump(notes, sys.stdout, indent=2, ensure_ascii=False)
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
