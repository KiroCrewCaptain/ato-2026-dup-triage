---
name: factory-triage
description: Backlog Factory step 1. Read the open issues (GitHub read only, or data/issues.json offline), sort each one with the owner's framework (good problem? five whys, first principles), give it a verdict and a lane, and write factory/board.json for the Backlog Factory page. Use when asked to run the factory, sort or triage the backlog.
---

# Triage: sort the backlog

You are the Backlog Factory. This skill is step 1 of a run. If the `factory-reproduce` and
`factory-fix-review` skills are also installed, run them after this one, in that order.

## Where things are

- **Repo folder**: the folder named in the request. If none is named, read it from
  `~/.kiro/crew/apps/backlog-factory/data/settings.json` (`"repo"`), else use
  `~/ato-2026-dup-triage`. It holds `jot/` (the code), `tests/`, `data/issues.json`.
- **Factory folder**: `<repo>/factory/`. You write ONLY here (and on local branches later).
- **Board**: `<repo>/factory/board.json`. The page reads it every few seconds.
- **Your decisions inbox**: `<repo>/factory/decisions.json`, written by the page's buttons.
  Read it first. A person's choice beats your verdict: `build`, `reframe` (= OK on a
  reframe), `as_asked`, `reject`, `agree`, `park`, `due_dates_only`, `needs_you`.

## Rules

1. **GitHub is read only.** Read the open issues with unauthenticated GET calls, one
   page at a time, until a page comes back `[]` (a full page of 100 means there is more):
   `curl -fsS "https://api.github.com/repos/KiroCrewCaptain/ato-2026-dup-triage/issues?state=open&per_page=100&page=1"`
   then `&page=2`, and so on. Drop items that have `pull_request` (they are PRs, not
   issues). Save fetched pages only under `<repo>/factory/tmp/`, never `/tmp`
   (a scratch copy; it needs no OK). Check: the count you sort equals the count you
   read. If a call fails, use
   `<repo>/data/issues.json` and set `"source": "offline"`. Never comment, label, close,
   edit, open issues or PRs. If asked, say: "Backlog Factory is a local factory. It writes
   to your clone only; nothing goes to GitHub."
2. Before your first write, say in one line what you will write and ask
   `OK? (yes / no)`. Wait for yes. A scheduled run (no person) writes only `factory/`.
   After the yes, go on from what you already read; do not fetch or read it again.
   Never open `answer-key.md` or `seed/`: they are the person's check, not your input.
3. Labels on GitHub are noisy on purpose. Decide the kind yourself.
4. Write `board.json` early (all issues in `inbox`), then again after every 10 issues,
   so the page fills while you work.
5. **The board is the memory.** If `board.json` already exists, keep every card whose
   issue is still open and unchanged (same title), and sort only the new ones. Drop cards
   for issues that are closed now. Then apply `decisions.json`. A re-run is quick.

## The framework, for every issue, in order

Use these as prompts to think, not a form to fill. On the card keep only the lines that
changed the verdict.

### 1. Is it a good problem?

(The owner's reference: "Are You Solving the Right Problems?", Thomas Wedell-Wedellsborg,
Harvard Business Review, 2017. Do not quote it.)

- **Say it in one sentence.** If another issue says the same thing in other words, this one
  is a **duplicate**: link the lowest-numbered one as `dup_of`, even if a later one is clearer;
  that one owns the fix. Group before you fix anything: three reports of one bug are one fix. This holds for
  setup problems and questions too. A duplicate
  needs the same root, not the same area: a vague "search is broken" or "crash when adding"
  could be several bugs, so it is **needs_info**, never a guessed duplicate. A near miss
  whose fix is different (a BOM vs a missing encoding, the tag filter vs search) is its own bug.
- **What does the reporter actually want?** The ask is often a solution, not the problem.
- **What is missing?** Steps, version, OS, the exact error. If you cannot act without it,
  the verdict is **needs_info** and the card says what to ask.
- **Which kind is it really?** code bug / environment / docs / by design / product /
  a plain question. A report of something jot does on purpose is works as designed: `reject`,
  with a `reply` that shows how.
  Example: "times are 4 hours off" is jot showing UTC by design, so it is a feature
  request (local time), not a bug: a duplicate of the issue that asks for local time. "Is it safe to…?", "How do I…?", "Does it work on…?"
  is a question: answer it, even when the answer hints at a feature. But if the honest
  answer is "not today, and it would change what jot is" (sync, sharing), it is a
  product call: `needs_you`, with the answer as your lean.
- **When does it NOT happen?** (Linux fine, Windows broken: encoding, not logic.)

### 2. Five whys → root cause

Ask "why?" until the answer is a line of code or a missing capability. Two or three whys
are often enough. Write them as short lines. The last answer is the **root**.
For a bug, read `jot/cli.py` to name the line (example: `next_id()` returns
`len(notes) + 1`, so a removed note's id comes back).

### 3. First principles → the best fix

The smallest change that removes the root cause and keeps jot what it is: one local JSON
file, a plain CLI, output that still pipes. No servers, no daemons, no new dependencies.

## Verdicts and lanes

| Verdict | When | Lane | `needs` |
|---|---|---|---|
| `bug` → reproduce | a code bug you can show here (a temp `JOT_FILE`, `chmod`, a bad byte). A traceback where a clear message belongs is a bug, even when the cause is the user's setup (a root-owned file) | `reproduce` | |
| `build` | small feature, clear, fits jot. A new command, flag, option, shell completion or output tweak is small, even if it needs a test and a doc line. Repo chores (CI, a test) count too | `triage` (waits for OK) | |
| `reframe` | the root is real but the ask is the wrong fix: build the root fix. If the root is another issue's bug, say so; it is still a reframe (never a duplicate, never needs you) | `triage` (waits for OK) | |
| `answer` | a question: put the short answer in `reply`, `kind: "question"` | `triage` | |
| `docs` | docs-only fix | `triage` | |
| `needs_you` | real need, but it adds a new field to every note or changes what jot is: dates and reminders, priority, subtasks, recurring, sync, sharing, encryption, a database, a full-screen UI, an installer (Homebrew). Nothing else: if you can name your lean (build, reframe, reject), you decide, because a build or reframe card already waits for the person's OK | `needs_you` | `product` |
| `needs_info` | cannot act without more from the reporter, or it is not jot's bug (old Python, PATH, OneDrive, a terminal font): the `reply` says what to ask or what to do | `needs_you` | `needs_info` |
| `cant_reproduce` | a real code bug that only shows on a platform you do not have (e.g. Windows only) | `needs_you` | `cant_reproduce` |
| `reject` | only these: a different product (accounts and a cloud service, a rewrite in another language), a network call from a local tool (stats, update checks), works as designed (the `reply` says how it works), or already done | `rejected` | |
| `duplicate` | same ask or same symptom and root as `dup_of` | `duplicate` | |

If an open PR already fixes the issue (a PR body says "fixes #N"), say so in `reason`
and do not schedule a fix. For `needs_you`, always give your `lean` in one line.

## board.json

Write valid JSON, UTF-8, this shape (omit empty fields):

```json
{
  "app": "backlog-factory",
  "repo": "KiroCrewCaptain/ato-2026-dup-triage",
  "source": "live",
  "updated": "2026-10-19T15:02:00Z",
  "run": {"state": "running", "step": "triage 20/47"},
  "github_writes": 0,
  "issues": [
    {
      "n": 14, "title": "Export notes as a Markdown checklist",
      "kind": "feature", "size": "small",
      "lane": "triage", "verdict": "build",
      "status": "waiting for OK",
      "reason": "Fits: one flag, uses export.",
      "asked": [14, 33],
      "frame": {
        "good": "Yes. Two people hit it.",
        "whys": ["To paste notes into docs.", "jot list has IDs and dates."],
        "root": "No clean text export.",
        "best": "Add jot export --format md. One flag. One test."
      }
    }
  ]
}
```

- `kind`: `bug` | `feature` | `question` | `docs`. `size`: `small` | `product`.
- `kind` is what it really is, not its label: a question is `question` even if it
  ends in a feature idea; a report that is by design is `feature` or `question`.
- `lane`: `inbox` | `triage` | `reproduce` | `fix` | `ready` | `needs_you` | `rejected` | `duplicate`
  (the page's column ids; any other value hides the card).
- `reply`: for `answer`, `needs_info` and `reject`, the text a person would post (one or two lines).
- `reason`: one line, at most 12 words. `status`: two to four words.
- `frame` is required for every feature and every bug (for a bug, `root` is the code cause).
- At the end set `"run": {"state": "idle", "step": "triage done"}` and `github_writes: 0`.

## Report

End with a short table: lane → count, then the 3 most interesting reframes in one line each.
Then: "Open the Backlog Factory page to see the board."
