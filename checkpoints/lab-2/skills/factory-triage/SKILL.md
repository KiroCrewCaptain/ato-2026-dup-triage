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
   issues). Check: the count you sort equals the count you read. If a call fails, use
   `<repo>/data/issues.json` and set `"source": "offline"`. Never comment, label, close,
   edit, open issues or PRs. If asked, say: "Backlog Factory is a local factory. It writes
   to your clone only; nothing goes to GitHub."
2. Before your first write, say in one line what you will write and ask
   `OK? (yes / no)`. Wait for yes. A scheduled run (no person) writes only `factory/`.
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
  is a **duplicate**: link the oldest clear one (`dup_of`). Group before you fix anything:
  three reports of one bug are one fix.
- **What does the reporter actually want?** The ask is often a solution, not the problem.
- **What is missing?** Steps, version, OS, the exact error. If you cannot act without it,
  the verdict is **needs_info** and the card says what to ask.
- **Which kind is it really?** code bug / environment / docs / by design / product.
  Example: "times are 4 hours off" is jot showing UTC by design, so it is a feature
  request (local time), not a bug.
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
| `bug` → reproduce | a code bug you can try locally | `reproduce` | |
| `build` | small feature, clear, fits jot | `triage` (waits for OK) | |
| `reframe` | the root is real but the ask is the wrong fix: build the root fix | `triage` (waits for OK) | |
| `needs_you` | product-level: changes what jot is (server, sync, crypto, daemon, packaging) | `needs_you` | `product` |
| `needs_info` | cannot act without more from the reporter | `needs_you` | `needs_info` |
| `cant_reproduce` | only on a platform you do not have (e.g. Windows only) | `needs_you` | `cant_reproduce` |
| `reject` | fails step 1 or 3 (e.g. telemetry in a local notes tool) | `rejected` | |
| `duplicate` | same problem as `dup_of` | `duplicate` | |
| `docs` | docs-only fix | `triage` | |

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
- `lane`: `inbox` | `triage` | `reproduce` | `fix` | `ready` | `needs_you` | `rejected` | `duplicate`.
- `reason`: one line, at most 12 words. `status`: two to four words.
- `frame` is required for every feature and every bug (for a bug, `root` is the code cause).
- At the end set `"run": {"state": "idle", "step": "triage done"}` and `github_writes: 0`.

## Report

End with a short table: lane → count, then the 3 most interesting reframes in one line each.
Then: "Open the Backlog Factory page to see the board."
