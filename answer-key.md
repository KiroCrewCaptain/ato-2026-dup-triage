# Answer key: Backlog Factory

The expected result for the **100 open issues** of `KiroCrewCaptain/ato-2026-dup-triage`:
#1-#101 except #46 (an outside pull request that fixes #1; leave it alone). Same set as
`data/issues.json` and `seed/issues.json`. Use it in the **Check** step: compare
`factory/board.json` with this page.

Labels on GitHub are noisy on purpose (some are wrong on purpose). The factory decides
the kind itself. Wording does not matter; an argued, different verdict on a small feature
is fine to discuss.

## Truth lanes and board lanes

This key uses eight truth lanes. The board shows six columns plus History. They map like this:

| Truth lane | Board lane (`lane` in board.json) | Count (all 100) |
|---|---|---:|
| Bug | `reproduce` → `fix` → `ready` (the owner card of each bug group) | 13 |
| Duplicate | `duplicate` (History), with `dup_of` | 19 |
| Feature | `triage` (verdict build or reframe) | 24 |
| Docs | `triage` (kind docs) | 6 |
| Question | `triage` (kind question, verdict answer) | 6 |
| Needs you | `needs_you`, `needs: "product"` | 11 |
| Needs info | `needs_you`, `needs: "needs_info"` (or `cant_reproduce` for Windows-only) | 16 |
| Rejected | `rejected` (History) | 5 |
| **All** | | **100** |

**The bar for Lab 1:** each board lane within ±2 of:

| Board lane | Expected |
|---|---:|
| reproduce (bug owners) | 13 |
| duplicate | 19 |
| triage (Feature + Docs + Question) | 36 |
| needs_you (Needs you + Needs info) | 27 |
| rejected | 5 |

plus: every bug group found with one owner card; #47 rejected; #48 in Needs you; every
feature card shows right problem → five whys → first principles.

## #1-#48

Same rules as batch 2: the first issue of each duplicate group is its owner; environment
reports and vague reports go to Needs info; works-as-designed goes to Rejected.

| # | Title | True kind | Lane | Root-cause group / duplicate-of | Verdict and reason | Reproduces? |
|---:|---|---|---|---|---|---|
| 1 | Typo in JOT.md: "seperate" | docs | Docs | - | Docs: typo fix. Outside PR #46 already fixes it: nothing to do | n/a |
| 2 | jot crashes with JSONDecodeError after my laptop died | bug | Bug | A: empty/cut-off file (owner) | Build: load_notes() must handle an empty or truncated file | yes |
| 3 | Add `jot edit` to change a note's text | feature | Feature | - | Build: `jot edit ID TEXT`, one subcommand | n/a |
| 4 | UnicodeEncodeError when I add a note with an emoji (Windows) | bug | Bug | B: no UTF-8 encoding (owner) | Build: open() with encoding="utf-8" | windows-only |
| 5 | search doesn't find "Groceries" when I type groceries | bug | Bug | D: case-sensitive search (owner) | Build: case-insensitive search | yes |
| 6 | Shell completion for bash and zsh | feature | Feature | - | Build: a small static completion script | n/a |
| 7 | Two notes have the same ID after rm | bug | Bug | C: id reuse after rm (owner) | Build: next_id() = max id + 1 | yes |
| 8 | Times in `jot list` are 4 hours off | bug | Duplicate | dup of #21 (UTC by design) | Duplicate: jot stores and shows UTC on purpose; the need is #21 local time | yes |
| 9 | Support regular expressions in `jot search` | feature | Feature | - | Build or reframe: regex behind a flag; plain search stays default | n/a |
| 10 | How do I keep work and personal notes apart? | feature | Needs you | - | Needs you: profiles change how jot finds its file (lean: document JOT_FILE) | n/a |
| 11 | `jot: command not found` after pip install --user on macOS | bug | Needs info | environment: pip scripts dir not on PATH (owner) | Not our bug: PATH; answer with an install note | no |
| 12 | Expecting value: line 1 column 1 (char 0) | bug | Duplicate | dup of #2 (A) | Duplicate of #2 | yes |
| 13 | Colored output | feature | Feature | - | Reframe: the need is seeing done notes fast; a [x] mark, no color, pipes still work | n/a |
| 14 | Feature request: export notes as a Markdown checklist | feature | Feature | G: Markdown export (owner) | Build: `jot export --format md` | n/a |
| 15 | PermissionError when the notes file is owned by root | bug | Bug | unreadable file shows a traceback | Build: catch PermissionError, print one clear line | yes |
| 16 | Notes file from Windows won't open on my Mac (UnicodeDecodeError 0xe9) | bug | Duplicate | dup of #4 (B) | Duplicate of #4 (the decode side) | yes |
| 17 | Case-insensitive search please | feature | Duplicate | dup of #5 (D) | Duplicate of #5 | n/a |
| 18 | Can jot sync between two computers? | feature | Needs you | - | Needs you: sync needs a server (lean: reject, point to a synced folder + JOT_FILE) | n/a |
| 19 | `jot done 4` marked the wrong note | bug | Duplicate | dup of #7 (C) | Duplicate of #7 (the symptom) | yes |
| 20 | pip install fails on Python 3.8 | bug | Needs info | environment: Python 3.8 below requires-python | Not our bug: needs Python 3.9+ | no |
| 21 | Show local time instead of UTC | feature | Feature | E: UTC display (owner) | Build: show local time | n/a |
| 22 | Due dates and reminders | feature | Needs you | - | Needs you: reminders need a daemon (lean: due dates only) | n/a |
| 23 | jot list fails after I cleared notes.json | bug | Duplicate | dup of #2 (A) | Duplicate of #2 | yes |
| 24 | Emoji show as ?? in cmd.exe | bug | Needs info | environment: cmd.exe font | Not our bug: console font; Windows only | no |
| 25 | Add a CONTRIBUTING guide | docs | Docs | - | Docs: CONTRIBUTING.md already exists; check and close | n/a |
| 26 | zsh: command not found: jot | bug | Duplicate | dup of #11 (F) | Duplicate of #11 | no |
| 27 | jot search misses matches | bug | Duplicate | dup of #5 (D) | Duplicate of #5 | yes |
| 28 | Pin or prioritize notes | feature | Needs you | - | Needs you: priorities change the data model | n/a |
| 29 | UnicodeEncodeError: 'charmap' codec can't encode character '\u2192' | bug | Duplicate | dup of #4 (B) | Duplicate of #4 | windows-only |
| 30 | Custom date format in `jot list` | feature | Feature | - | Build: a date format option | n/a |
| 31 | Respect XDG_DATA_HOME on Linux | feature | Feature | - | Build: respect XDG_DATA_HOME | n/a |
| 32 | IDs are reused after deleting a note | bug | Duplicate | dup of #7 (C) | Duplicate of #7 (names the line) | yes |
| 33 | Can I get my notes out as .md? | feature | Duplicate | dup of #14 (G) | Duplicate of #14 | n/a |
| 34 | Homebrew formula | feature | Needs you | - | Needs you: packaging and a release process | n/a |
| 35 | Run the tests in GitHub Actions | feature | Feature | - | Build: run the tests in CI | n/a |
| 36 | Archive done notes older than 30 days | feature | Feature | - | Build: archive old done notes | n/a |
| 37 | export output looks wrong | bug | Needs info | vague | Needs info: what looks wrong, which command, which version | no |
| 38 | `jot rm` should say "removed", not "rm" | feature | Feature | - | Build: say "removed" | n/a |
| 39 | done command not working | bug | Needs info | vague | Needs info | no |
| 40 | Tags are broken | bug | Needs info | vague | Needs info | no |
| 41 | Say "no notes yet" when the list is empty | feature | Feature | - | Build: "no notes yet" when empty | n/a |
| 42 | jot is really slow | bug | Needs info | vague | Needs info: how many notes, which command, timings | no |
| 43 | `jot export --help` should say the output is JSON | feature | Feature | - | Build: help text says the output is JSON | n/a |
| 44 | Doesn't work on my work laptop | bug | Needs info | vague | Needs info | no |
| 45 | Add a test for the default notes location | feature | Feature | - | Build: one test for the default notes path | n/a |
| 47 | Send anonymous usage stats so you know which commands people use | feature | Rejected | - | Reject: a local notes tool has no server; privacy cost, no user pain | n/a |
| 48 | Encrypt the notes file with a password | feature | Needs you | - | Needs you: real need, but key handling changes what jot is (lean: document disk encryption) | n/a |

## #49-#101 (seed batch 2)

From `workshop-app/seed-batch2/TRUTH.md` (repros run against jot 0.3.1). Order N is issue #(48+N).

| Order | # | Title | True kind | Lane | Root-cause group / duplicate-of | Verdict and reason | Reproduces? |
|---:|---:|---|---|---|---|---|---|
| 1 | 49 | KeyError: 'tags' after I edited notes.json by hand | bug | Bug | NEW-1 load does not fill missing fields | Build: load_notes() should default tags=[] / done=False for hand-edited notes | yes |
| 2 | 50 | `jot undone` to reopen a note | feature | Feature | - | Build: small, clearly useful, one new subcommand | n/a |
| 3 | 51 | jot add fails with "Expecting value" after the disk filled up | bug | Duplicate | dup of #2 (group A: empty/cut-off file) | Duplicate: same load_notes() crash on an empty file as #2/#12/#23 | yes |
| 4 | 52 | Is it safe to run jot from a cron job? | question | Question | - | Answer: no locking; two writers at once can drop a note (last write wins). Rare for a weekly cron | n/a |
| 5 | 53 | Lost all my notes | bug | Needs info | unknown (could be order 7, a relative JOT_FILE, or group A) | Needs info: version, OS, JOT_FILE value, what is in ~/.jot/, last command run | no |
| 6 | 54 | Subtasks inside a note | feature | Needs you | - | Needs you: turns the flat note list into a tree; touches every command and the file format | n/a |
| 7 | 55 | JOT_FILE with ~ creates a folder literally named ~ | bug | Bug | NEW-2 JOT_FILE not expanded | Build: notes_path() should expanduser() the JOT_FILE value | yes |
| 8 | 56 | Accounts and a cloud version of jot | feature | Rejected | - | Reject: JOT.md promises 'one JSON file, no server, no account'; this is a different product | n/a |
| 9 | 57 | SyntaxError: future feature annotations is not defined | bug | Needs info | environment: Python below 3.9 | Not our bug: Python 3.6 is below requires-python >=3.9 (pip would refuse it); close with explanation | no |
| 10 | 58 | multi line note messes up the list | bug | Bug | NEW-3 newlines in note text | Build: format_note() should show newlines as a marker (or add should refuse them) | yes |
| 11 | 59 | Option to save notes in lowercase | feature | Feature | reframe -> group D (#5, #17) | Reframe: the real need is case-insensitive search (#17); lowercasing would destroy the user's text | n/a |
| 12 | 60 | `jot rm 3` deleted the wrong note | bug | Duplicate | dup of #7 (group C: ID reuse) | Duplicate: next_id() = len+1 reuses an ID; rm hits the first match. Same fix as #7 | yes |
| 13 | 61 | Docs: where are the notes on Windows? | docs | Docs | - | Docs: add the Windows path and how to set JOT_FILE there | n/a |
| 14 | 62 | Unexpected UTF-8 BOM after I edited notes.json in Notepad | bug | Bug | NEW-4 UTF-8 BOM (near-miss of group B #4/#16/#29) | Build: read with utf-8-sig. NOT a dup of B: adding encoding='utf-8' alone still fails on a BOM | yes |
| 15 | 63 | Fix a typo in a note without deleting it | feature | Duplicate | dup of #3 (jot edit) | Duplicate of #3 | n/a |
| 16 | 64 | crash when adding a note | bug | Needs info | unknown | Needs info: version, OS, the exact command, the error text | no |
| 17 | 65 | Delete several notes at once | feature | Feature | - | Build: small, nargs='+' on rm/done | n/a |
| 18 | 66 | What do the fields in notes.json mean? Is the format stable? | question | Question | - | Answer: created is UTC 'YYYY-MM-DD HH:MM'; export prints the same JSON; no stability promise yet | n/a |
| 19 | 67 | Tags typed with # show as ##work and can't be filtered | bug | Bug | NEW-5 tag '#' prefix not stripped | Build: strip a leading '#' from tags on add and on --tag | yes |
| 20 | 68 | Use SQLite instead of one JSON file | feature | Needs you | - | Needs you: breaks the 'one JSON file you can read' promise and needs a migration; owner's call | n/a |
| 21 | 69 | search only finds things if I type the exact capitals | bug | Duplicate | dup of #5 (group D: case-sensitive search) | Duplicate of #5: search_notes() uses a plain 'in' test | yes |
| 22 | 70 | `jot` runs a different program on my Mac | bug | Needs info | environment: PATH / macOS built-in jot | Not our bug: macOS ships a BSD /usr/bin/jot ahead of pip's script dir on PATH; renaming the command is a product call | no |
| 23 | 71 | Add a `jot backup` command | feature | Feature | reframe -> group A (#2) | Reframe: real need is a save that cannot corrupt the file (write temp + os.replace), the root of #2 | n/a |
| 24 | 72 | My done notes vanished | bug | Rejected | works as designed | Works as designed: list hides done notes; `jot list --all` shows them as [x]. Docs fix is order 27 | no |
| 25 | 73 | BrokenPipeError when I pipe jot list into head | bug | Bug | NEW-6 no SIGPIPE/BrokenPipe handling | Build: catch BrokenPipeError in main() and exit quietly | yes |
| 26 | 74 | Rewrite jot in Rust | feature | Rejected | - | Reject: a full rewrite of a ~150-line tool solves no user problem; install pain is #34 (Homebrew) | n/a |
| 27 | 75 | README doesn't say that `jot list` hides done notes | docs | Docs | related to order 24 | Docs: one sentence in JOT.md | n/a |
| 28 | 76 | `jot list --tag work` misses notes tagged Work | bug | Bug | NEW-7 tag filter is case-sensitive (near-miss of group D) | Build: casefold in filter_notes(). NOT a dup of #5: fixing search_notes() does not touch --tag | yes |
| 29 | 77 | How do I back up my notes? | question | Question | - | Answer: copy the file; jot only touches it during a command | n/a |
| 30 | 78 | Recurring notes | feature | Needs you | - | Needs you: needs dates, a schedule and new done semantics; a direction call | n/a |
| 31 | 79 | Cyrillic text crashes jot add on Windows | bug | Duplicate | dup of #4 (group B: no encoding='utf-8') | Duplicate of #4: save_notes() opens without encoding, cp1252 on Windows | windows-only |
| 32 | 80 | `jot tags` to list all my tags | feature | Feature | - | Build: small, one subcommand | n/a |
| 33 | 81 | search is broken??? | bug | Needs info | unknown (maybe #5 or order 47) | Needs info: the note text, the query, version, OS. Do not guess a duplicate | no |
| 34 | 82 | jot saves an empty note | bug | Bug | NEW-8 blank note text accepted | Build: add should refuse empty/whitespace-only text with exit 2 | yes |
| 35 | 83 | Check for a new version on every run | feature | Rejected | - | Reject: a network call on every command for an offline, no-server tool; pip/pipx already upgrade | n/a |
| 36 | 84 | One notes file per project? | question | Question | dup of #10 | Answer (same as #10): set JOT_FILE per project, e.g. with direnv | n/a |
| 37 | 85 | Print notes as a Markdown task list | feature | Duplicate | dup of #14 (group G) | Duplicate of #14 | n/a |
| 38 | 86 | Notes I add in the evening show tomorrow's date | bug | Duplicate | dup of #8 (group E: UTC shown; fix is #21) | Duplicate of #8: times are UTC by design with no zone shown; the change lives in #21 | yes |
| 39 | 87 | Let me choose the ID when adding a note | feature | Feature | reframe -> group C (#7, #32) | Reframe: real need is IDs that never get reused (fix #7); user-chosen IDs add collisions | n/a |
| 40 | 88 | PermissionError on Windows when my notes are in OneDrive | bug | Needs info | environment: sync client locks the file | Not our bug: OneDrive holds the file while syncing; a friendly message is #15's fix | no |
| 41 | 89 | Share a notes list with my team | feature | Needs you | - | Needs you: multi-user needs a server or shared storage, conflicts and access control | n/a |
| 42 | 90 | Read the note text from stdin | feature | Feature | - | Build: small; '-' means read stdin | n/a |
| 43 | 91 | jot list shows weird characters | bug | Needs info | unknown (maybe #24 or order 14) | Needs info: OS, terminal, a sample note, a screenshot | no |
| 44 | 92 | Add a CHANGELOG | docs | Docs | - | Docs: add CHANGELOG.md | n/a |
| 45 | 93 | `jot clear` to delete all notes | feature | Feature | reframe -> group A (#12, #23) | Reframe: real need is 'start fresh without a crash': fix empty-file handling (#12) and document deleting the file | n/a |
| 46 | 94 | nothing works after updating | bug | Needs info | unknown | Needs info: old and new version, OS, the command, the error text | no |
| 47 | 95 | jot search doesn't find notes by their tag | feature | Feature | reframe (near-miss of group D #5) | Reframe: search only looks at text by design; `jot list --tag work` already does this. Not the case bug | n/a (behavior confirmed) |
| 48 | 96 | jot where: print which notes file is used | feature | Feature | - | Build: small; also helps triage 'lost my notes' reports | n/a |
| 49 | 97 | Full-screen terminal UI | feature | Needs you | - | Needs you: a big new surface plus a dependency question (curses on Windows) | n/a |
| 50 | 98 | deadlines | feature | Duplicate | dup of #22 (due dates) | Duplicate of #22 | n/a |
| 51 | 99 | Can I rename a tag in all my notes at once? | question | Question | - | Answer: today, edit the JSON; a `jot retag` could be a small feature later | n/a |
| 52 | 100 | Does jot work in Termux on Android? | question | Question | - | Answer: stdlib-only, needs Python 3.9+; should work (not tested here) | n/a |
| 53 | 101 | README: say that JOT_FILE should be a full path | docs | Docs | related to order 7 | Docs: one line in JOT.md | n/a |

## Bugs that reproduce (any OS unless noted)

| Group | Owner | Members | Root cause | Repro (throwaway `JOT_FILE`) |
|---|---|---|---|---|
| A | #2 | #12 #23 #51 | `load_notes()` calls `json.load` with no handling | `: > $JOT_FILE; jot list` → `JSONDecodeError` |
| B | #4 | #16 #29 (#79 per batch 2 truth) | `open()` without `encoding="utf-8"` | a `0xe9` byte → `UnicodeDecodeError`; #4/#29 encode side is Windows-only |
| C | #7 | #19 #32 #60 | `next_id()` returns `len(notes) + 1` | `add a; add b; add c; rm 2; add d; list` → two notes with id 3 |
| D | #5 | #17 #27 #69 | `search_notes()` is case-sensitive | add "Groceries", `search groceries` → nothing |
| - | #15 | | unreadable file shows a traceback | `chmod 000 $JOT_FILE; jot list` (not as root) |
| NEW-1..6 | #49 #55 #58 #62 #67 #73 | see the batch-2 table | missing fields; `~` not expanded; newlines; UTF-8 BOM (not a dup of B); `#` tag prefix; BrokenPipe | see `TRUTH.md` |

## Lab 3 (fix ⇄ review)

One bug reaches **Ready to merge**: the reviewer says `VERDICT: GREEN`,
`python -m unittest discover -s tests` passes (the 7 existing tests plus at least one new
one), the repro no longer shows the bug, and the branch `factory/fix-<n>` is local only. The
person runs `git merge factory/fix-<n>` themselves. Suggested first bug: #7 (ids). A good
class discussion: does the fix lose data? (A fix that turns an *invalid* file into "no notes"
makes the next save overwrite it.)

The Dup Detective answer key (duplicate groups and near-misses) is in
`extras/dup-detective/answer-key.md`.
