# Answer key: Backlog Factory

The expected board for the **100 open issues** of `KiroCrewCaptain/ato-2026-dup-triage`
(#1-#101 except #46, which is an outside pull request fixing #1). Same set as
`data/issues.json`. Use it in the **Check** step: compare `factory/board.json` with this page.

Labels on GitHub are noisy on purpose, and #12, #26, #37-#45 and #47-#101 have none.
The factory decides the kind itself.

**The bar for Lab 1:**
- all 100 issues on the board (a run that reads only one page of 100 from GitHub misses one);
- the bug groups below found, each with one owner card and the others `duplicate`;
- #47, #74 and #83 rejected; #48 and #56 in Needs you;
- every feature card has good problem → five whys → first principles.

Wording does not matter. A different but argued verdict on a small feature (build vs
reframe vs reject) is fine: discuss it. Lane counts land roughly at: reproduce 12-14,
duplicate 22-28, triage 30-36, needs you 20-26, rejected 4-8.

## Bugs that really reproduce (checked against `jot/` on 2026-10-19)

| Owner | Group (duplicates) | Root cause (five whys ends here) | Real repro (throwaway `JOT_FILE`) |
|---|---|---|---|
| #2 | #12, #23, #51 | `load_notes()` calls `json.load` with no handling, and `save_notes()` writes in place, so a cut-off write leaves a broken file | `: > $JOT_FILE; jot list` → `JSONDecodeError: Expecting value` |
| #7 | #19, #32, #60 | `next_id()` returns `len(notes) + 1`, so after `rm` a new note reuses a live id | `add a; add b; add c; rm 2; add d; list` → two notes with id 3 |
| #5 | #17, #27, #69 | `search_notes()` uses a plain, case-sensitive `in` | add "Groceries", `search groceries` → nothing |
| #16 | #4, #29, #62, #79 | `open()` has no `encoding="utf-8"` (and no BOM handling) | a `0xe9` byte → `UnicodeDecodeError`; a BOM file → `Unexpected UTF-8 BOM` |
| #15 | (#88 is the Windows/OneDrive cousin) | an unreadable file is not caught, so the user sees a traceback | `chmod 000 $JOT_FILE; jot list` → `PermissionError` traceback (not as root) |
| #49 | | a note without `tags` (hand-edited file) crashes the list | `[{"id":1,"text":"x","done":false,"created":"..."}]` → `KeyError: 'tags'` |
| #55 | #101 | `notes_path()` does not expand `~` in `JOT_FILE` | `JOT_FILE='~/n.json' jot add hi` → a folder literally named `~` |
| #58 | | the text is printed raw, so a newline breaks the one-line list | `jot add $'a\nb'; jot list` → the note spills onto two lines |
| #67 | | tags are stored as typed, and the list adds `#` | `jot add a --tag '#work'` → `##work`; `list --tag work` → nothing |
| #76 | | `filter_notes()` compares tags case-sensitively | tag `Work`, `list --tag work` → nothing |
| #82 | | `add` accepts empty text | `jot add ""` → `added 1`, an empty row |
| #73 | | output to a closed pipe is not handled | 3,000 notes, `jot list \| head -1` → `BrokenPipeError` on stderr |

Accept #4, #29, #79 (Windows write side) in **Needs you / can't reproduce** instead of
duplicates of #16: same root, but they need Windows to show. Same for #88.

## Everything else

| Expected | Issues |
|---|---|
| **Duplicate of a feature** | #8 → #21 (UTC by design) · #86 → #21 · #33, #85 → #14 (Markdown export) · #63 → #3 (edit) · #98 → #22 (due dates) · #84 → #10 (`JOT_FILE`) · #57 → #20 (Python version) · #59 → #5 (case-insensitive search solves it) · #77 ↔ #71 (backup) · #72 → #75 (list hides done notes) · #26 → #11 (PATH) |
| **Build** (small, fits jot) | #3, #6, #9, #30, #31, #35, #36, #38, #41, #43, #45, #50, #65, #80, #90, #93, #96, #99 |
| **Reframe** (solve the root) | #13 (a ✓ mark, not color) · #10 (document `JOT_FILE`, no profiles) · #11, #70 (install/PATH note, not code) · #71 (backup = copy one file: document it) · #87 (choosing ids is a workaround for #7) · #95 (use `list --tag`, document it) · #52 (document single-writer use from cron) · #21 (show local time) |
| **Docs** | #61, #66, #75, #92 · #1 (outside PR #46 already fixes it: nothing to do) |
| **Needs you** (product-level, agent gives a lean) | #18 sync, #22 due dates/reminders, #28 pin/priority, #34 Homebrew, #48 encryption, #54 subtasks, #56 accounts/cloud, #68 SQLite, #78 recurring, #89 team sharing, #97 full-screen UI |
| **Needs info** (cannot act yet) | #37, #39, #40, #42, #44, #53, #64, #81, #91, #94, #100 · #24 (cmd.exe font: Windows only) |
| **Reject** | #47 usage stats, #83 version check on every run (both phone home from a local tool), #74 rewrite in Rust, #25 (`CONTRIBUTING.md` already exists), #20 (Python 3.8 is below `requires-python >= 3.9`) |

Some product-level cards are also fair rejects (#56, #68, #74, #97). The point to
discuss is the reason, not the lane.

## Reframes worth showing on the Features tab

| Issue | The ask | Good problem? → root | Verdict |
|---|---|---|---|
| #8 | "times are 4 hours off" (filed as a bug) | by design: jot stores and prints UTC | duplicate of #21 (feature: local time) |
| #13 | colored output | the want is "see done notes fast" | reframe: a ✓ mark, pipes still work |
| #59 | save notes in lowercase | the want is finding notes whatever the case | reframe: case-insensitive search (#5) |
| #87 | choose the id when adding | ids are reused after `rm` (#7) | reframe: fix #7 |
| #51 | crash after the disk filled up | why a broken file? the save is not atomic | duplicate of #2; the fix writes to a temp file then renames |
| #47 / #83 | usage stats / update check | a local notes tool has no server | reject |
| #48 | encrypt the notes file | real need, but key handling changes what jot is | needs you (lean: document disk encryption) |

## Lab 3 (fix ⇄ review)

One bug reaches **Ready to merge**: the reviewer says `VERDICT: GREEN`,
`python -m unittest discover -s tests` passes (the 7 existing tests plus at least one new one), the
repro no longer shows the bug, and the branch `factory/fix-<n>` is local only. The
person runs `git merge factory/fix-<n>` themselves. Suggested first bug: #7 (ids):
a one-line fix and a short test.

The Dup Detective answer key (duplicate groups and near-misses) is in
`extras/dup-detective/answer-key.md`.
