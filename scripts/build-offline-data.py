#!/usr/bin/env python3
"""Build data/issues.json from seed/issues.json, offline.

The output has the same shape as

    gh issue list -R KiroCrewCaptain/ato-2026-dup-triage --state open --limit 200 \
      --json number,title,body,labels

on the base repo right after scripts/seed-issues.sh --apply:

- a JSON array, newest issue first (gh's default sort),
- each item has exactly the keys body, labels, number, title,
- each label has id, name, description, color.

Numbers follow seed order: the first seeded issue is #1.
Label ids are placeholders ("LA_offline_<name>"). GitHub's real ids are only
known after seeding; scripts/refresh-offline-data.sh replaces this file with
the live output.

Usage: python3 scripts/build-offline-data.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# GitHub's default labels for a new repository (name -> description, color).
DEFAULT_LABELS = {
    "bug": ("Something isn't working", "d73a4a"),
    "documentation": ("Improvements or additions to documentation", "0075ca"),
    "duplicate": ("This issue or pull request already exists", "cfd3d7"),
    "enhancement": ("New feature or request", "a2eeef"),
    "good first issue": ("Good for newcomers", "7057ff"),
    "help wanted": ("Extra attention is needed", "008672"),
    "invalid": ("This doesn't seem right", "e4e669"),
    "question": ("Further information is requested", "d876e3"),
    "wontfix": ("This will not be worked on", "ffffff"),
}


def label_obj(name: str) -> dict:
    if name not in DEFAULT_LABELS:
        raise SystemExit(f"label {name!r} is not a GitHub default label")
    description, color = DEFAULT_LABELS[name]
    return {
        "id": "LA_offline_" + name.replace(" ", "_"),
        "name": name,
        "description": description,
        "color": color,
    }


def main() -> None:
    seed = json.loads((ROOT / "seed" / "issues.json").read_text(encoding="utf-8"))
    items = []
    for number, issue in enumerate(seed, start=1):
        items.append(
            {
                "body": issue["body"],
                "labels": [label_obj(n) for n in issue["labels"]],
                "number": number,
                "title": issue["title"],
            }
        )
    items.reverse()  # gh issue list: newest first
    out = ROOT / "data" / "issues.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    # gh prints compact JSON when piped; keep the same bytes style.
    out.write_text(json.dumps(items, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}: {len(items)} issues (#{items[-1]['number']}..#{items[0]['number']})")


if __name__ == "__main__":
    main()
