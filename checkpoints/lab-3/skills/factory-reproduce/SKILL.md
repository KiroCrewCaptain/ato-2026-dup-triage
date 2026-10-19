---
name: factory-reproduce
description: Backlog Factory step 2. For each bug in the reproduce lane, reproduce it for real in the local clone (exact commands plus real output, or a failing unittest), add the five-whys root cause as "details added", and move it to fix, needs_you or needs_info. Uses helper agents for batches. Use after triage, or when asked to reproduce bugs.
---

# Reproduce: prove each bug before anyone fixes it

Run after `factory-triage`. Read `<repo>/factory/board.json`; work on cards with `lane: "reproduce"`.
Skip a card that already has `repro.result` (the board is the memory: a re-run only does
new work). Duplicates are not reproduced: only the card they point to (`dup_of`).

## Rules

1. Never touch the person's real notes. Every command runs with a throwaway file:
   `JOT_FILE=<repo>/factory/tmp/<n>.json python -m jot ...` from the repo folder.
   (`python3` on macOS/Linux, `py` or `python` on Windows.)
2. Run the real commands. Paste the real output. Never invent output. If a command
   cannot run here (another OS, a missing tool), the verdict is `cant_reproduce` and the
   card says what is needed.
3. Optional: write a failing test at `<repo>/factory/repro/test_<n>.py` (unittest, imports
   `jot.cli`). Run it with `python -m unittest factory/repro/test_<n>.py` from the repo
   folder and paste the result line. Do not edit `jot/` or `tests/` in this step.
4. GitHub stays read only. Nothing in this step talks to the network.

## Helpers (more than 3 bugs)

This is the point of the lab: use helpers whenever there are more than 3 bugs. Do not
skip them to save the person a click; the Allow click is part of the lesson.
Your yes/no question must name them, for example "I will start 2 helpers: #12 #49 and
#16 #58, then update board.json. OK? (yes / no)". After the yes, your FIRST action is
`spawn_run` with those batches. Do not reproduce them yourself first.
Split the bugs into batches of 2 to 3 and start one helper per batch with `spawn_run`,
`agent: "factory-reproducer"`, and NO `cwd` (Kiro Crew 0.9.0 accepts a `cwd` only under `~/workspace`, `~/workplace` and
similar roots; the repo folder may be anywhere). Each helper's task gets: the repo
folder's ABSOLUTE path with "start every shell command with cd <that path>", its issue
numbers, the issue texts, and rules 1-4 above. Each helper replies with JSON per issue: `n`, `cmd`, `out`, `test`, `result`,
`root`. You merge the replies into `board.json`. Only if the `spawn_run` tool is missing
from your tools, or a helper fails, do that batch yourself, and say why in one line.

In Normal mode each helper waits for the person's OK before it starts (Subagents
panel: **Review in panel → Allow**). Say so once, in one line, and wait. Do not cancel
the helpers and do not redo their work inline while they wait.

## What to write per card

```json
"repro": {
  "cmd": "jot add a; jot add b; jot add c; jot rm 2; jot add d; jot list",
  "out": "1  a\n3  c\n3  d",
  "note": "same ID as c",
  "test": "factory/repro/test_32.py::test_id_not_reused",
  "result": "FAILED",
  "where": "your clone"
},
"details": "Cause: next_id() returns len(notes) + 1. Any version. Any OS."
```

Then set:
- reproduced → `lane: "fix"`, `status: "reproduced"`, `track: ["sorted","reproduced","details"]`
- not reproducible here → `lane: "needs_you"`, `needs: "cant_reproduce"`, a one-line
  `reply` the person could send the reporter (they copy it; you never post it)
- works as designed → set `lane: "triage"` as a feature with a `frame`, verdict `reframe`

Rewrite `board.json` after each helper's reply. At the end: `run.step = "reproduce done"`.

## Report

A table: issue → reproduced? → root cause (one line). Then: "Next: the fix-review step."
