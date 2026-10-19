# Answer key

The expected result for the seeded issues of `KiroCrewCaptain/ato-2026-dup-triage`
(the same 45 issues as `data/issues.json`). Use it as the **Check** step of
every lab: compare the app's report with this page.

Numbers assume the issues were seeded into a fresh repo, in order, so the first
one is #1 (see PREP.md).

The bar for a lab: the app finds most groups, explains each match with
evidence from **both** issues, and does **not** merge the near-misses. Wording
and order do not matter. Missing one group is fine; calling a near-miss a
duplicate is the mistake to discuss.

## Duplicate groups (7)

| Group | Issues | Same root cause | Why the words differ |
|---|---|---|---|
| A. Crash on an empty or cut-off notes file | #2, #12, #23 | `load_notes()` calls `json.load` with no error handling, so an empty or truncated `notes.json` raises `JSONDecodeError` | #2 is a cut-off file after a power loss (macOS), #12 an empty file from a shell `>` (Ubuntu, jot 0.2.4), #23 an empty file from `type nul` (Windows). Two show different error text (`Unterminated string` vs `Expecting value`). |
| B. Notes file read/written without UTF-8 | #4, #16, #29 | `open()` in `load_notes()`/`save_notes()` has no `encoding="utf-8"`, so Windows uses its local code page | #4 is an emoji on add (Windows 11), #29 an arrow `→` on add (Windows Server), #16 is the other side: a file written on Windows fails to read on a Mac (`UnicodeDecodeError 0xe9`). Encode vs decode errors, same fix. |
| C. IDs reused after `rm` | #7, #19, #32 | `next_id()` returns `len(notes) + 1`, so after a delete the next note can take an ID still in use | #7 is a clean repro (Ubuntu), #19 is the symptom only ("`done 4` marked the wrong note", macOS), #32 names the line and a fix. |
| D. Search is case-sensitive | #5, #17, #27 | `search_notes()` uses a plain `in` test | #5 and #27 are filed as bugs, #17 as an enhancement. Same change fixes all three. |
| E. Times shown in UTC without saying so | #8, #21 | `add_note()` stores UTC and `format_note()` prints it with no zone | #8 is a bug report ("4 hours off", New York); #21 asks for local time as a feature. |
| F. `jot: command not found` after `pip install` | #11, #26 | pip put the `jot` script in a folder that is not on `PATH` (user/framework scripts dir on macOS) | #11 uses `pip install --user` with the Xcode Python 3.9; #26 uses `pip3` with the python.org 3.12. Neither mentions the other's setup. |
| G. Export as Markdown | #14, #33 | `jot export` only has `--format json` | #14 is a detailed feature request with sample output; #33 is a short question from a user moving to Obsidian. |

## Related, but NOT duplicates (4 near-misses)

These share words or a component with a group above. The app should keep them
separate, or at most say "related to".

| Issue | Looks like | Why it is different |
|---|---|---|
| #15 PermissionError when the file is owned by root | A (crash on the notes file) | A different error from a different cause (file ownership, on write). Fixing A does not fix it. |
| #9 Support regular expressions in search | D (case-sensitive search) | A new feature (regex), not the case bug. Case-insensitive search does not give regex. |
| #24 Emoji show as `??` in cmd.exe | B (Windows encoding) | The file is saved correctly; this is the console's display code page when printing. Adding `encoding="utf-8"` to `open()` does not change it. |
| #30 Custom date format | E (UTC timestamps) | About the *format* (`19 Oct`), not the time zone. Showing local time does not give a custom format. |

Also watch #18 ("Can jot sync between two computers?"). It mentions a synced
folder, like #16, but it is a question about syncing, not an encoding bug. Not
a duplicate.

## Unrelated (14)

#1, #3, #6, #10, #13, #18, #20, #22, #25, #28, #31, #34, #35, #36. Each is a
one-off: a typo, a feature idea, a question, or project housekeeping. An app
that groups any two of these has a false positive.

## Remix rule: Missing-Info Nudger (5)

Bug reports that give no version, no OS and no steps. The nudger should draft a
polite "please tell us your jot version, OS and the exact command" reply for
each. They are deliberately unlabeled.

| Issue | What is missing |
|---|---|
| #37 export output looks wrong | version, OS, the command, what "wrong" means |
| #39 done command not working | version, OS, the ID used, what happened instead |
| #40 Tags are broken | version, OS, which command, what "broken" means |
| #42 jot is really slow | version, OS, how many notes, which command, how slow |
| #44 Doesn't work on my work laptop | everything: version, OS, command, error text |

Not on this list: #12 and #26 have no labels but do give OS and version, and
#12 gives the exact error. #39 might turn out to be group C (IDs reused) and
#40 might be anything; without the details nobody can tell, which is the point
of the nudge. The duplicate app should not put these in a group.

## Remix rule: Good First Issue Scout (4)

Small, well-scoped changes in one file, with the place to change named in the
issue. The scout should suggest GitHub's default `good first issue` label.
They are deliberately unlabeled.

| Issue | One file | Change |
|---|---|---|
| #38 `jot rm` should say "removed" | `jot/cli.py` | one `print` in `main()` |
| #41 Say "no notes yet" when the list is empty | `jot/cli.py` | one branch in `main()` |
| #43 `jot export --help` should say JSON | `jot/cli.py` | one help string in `build_parser()` |
| #45 Add a test for the default notes location | `tests/test_cli.py` | one new test |

Already labeled `good first issue`, so the scout should skip them: #1 (typo)
and #35 (CI workflow). Not good first issues: #32 (the ID fix touches IDs that
users already have) and #31 (moves user data).

## Totals

45 issues = 18 in 7 duplicate groups + 4 near-misses + 14 unrelated +
5 missing-info + 4 good-first-issue candidates. The last 9 are #37–#45 and are
unrelated to the duplicate groups.
